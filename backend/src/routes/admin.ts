import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticate, requireAdmin } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
const prisma = new PrismaClient();

// All admin routes require auth + admin role
router.use(authenticate);
router.use(requireAdmin);

// GET /api/admin/staff - List all staff with optional filters
router.get('/staff', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status } = req.query;

    const where: any = {};

    if (status && status !== 'all') {
      // We need to filter by KYE status, which is on the KyeSubmission
      // We'll handle this after querying
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { department: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: { kyeSubmission: true },
      orderBy: { createdAt: 'desc' },
    });

    let result = users.map(u => ({
      id: u.staffId,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      isAdmin: u.isAdmin,
      avatar: u.avatar,
      kyeStatus: u.kyeSubmission?.status || 'pending_submission',
      kyeSubmittedDate: u.kyeSubmission?.submittedDate,
      kyeRefId: u.kyeSubmission?.refId,
    }));

    // Filter by KYE status if requested
    if (status && status !== 'all' && typeof status === 'string') {
      result = result.filter(r => r.kyeStatus === status);
    }

    // Stats
    const stats = {
      total: result.length,
      pending: result.filter(r => r.kyeStatus === 'pending_review').length,
      verified: result.filter(r => r.kyeStatus === 'verified').length,
      rejected: result.filter(r => r.kyeStatus === 'rejected').length,
      notSubmitted: result.filter(r => r.kyeStatus === 'pending_submission').length,
    };

    res.json({ staff: result, stats });
  } catch (error) {
    console.error('Admin staff list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/staff/:staffId - Get single staff detail
router.get('/staff/:staffId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { staffId: req.params.staffId },
      include: { kyeSubmission: true },
    });

    if (!user) {
      res.status(404).json({ error: 'Staff member not found' });
      return;
    }

    res.json({
      id: user.staffId,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      region: user.region,
      avatar: user.avatar,
      kye: user.kyeSubmission ? {
        status: user.kyeSubmission.status,
        step: user.kyeSubmission.step,
        stepLabel: user.kyeSubmission.stepLabel,
        refId: user.kyeSubmission.refId,
        submittedDate: user.kyeSubmission.submittedDate,
        riskScore: user.kyeSubmission.riskScore,
        fullName: user.kyeSubmission.fullName,
        phone: user.kyeSubmission.phone,
        dob: user.kyeSubmission.dob,
        address: user.kyeSubmission.address,
        idType: user.kyeSubmission.idType,
        hasIdDocument: !!user.kyeSubmission.idDocumentPath,
        hasAddressDoc: !!user.kyeSubmission.addressDocPath,
        hasSelfie: !!user.kyeSubmission.selfiePath,
        documentsUploaded: user.kyeSubmission.documentsUploaded,
        documentsRequired: user.kyeSubmission.documentsRequired,
        rejectReason: user.kyeSubmission.rejectReason,
        adminComment: user.kyeSubmission.adminComment,
      } : null,
    });
  } catch (error) {
    console.error('Admin staff detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/staff - Invite new staff
router.post('/staff', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, department, role } = req.body;

    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required' });
      return;
    }

    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      res.status(409).json({ error: 'A staff member with this email already exists' });
      return;
    }

    // Generate staff ID and temp password
    const staffId = `DGX-STF-${String(Math.floor(Math.random() * 9000 + 1000))}`;
    const tempPassword = `Deg${Math.random().toString(36).slice(2, 8)}!`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: {
        staffId,
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || 'Staff',
        department: department || 'General',
        isAdmin: false,
      },
    });

    // Create empty KYE submission
    await prisma.kyeSubmission.create({
      data: { userId: user.id },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        admin: req.user!.email,
        action: `Invited new staff: ${name} (${email})`,
        details: `Staff ID: ${staffId}`,
      },
    });

    // Add notification for the new staff
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to Degxifi',
        message: 'Your staff account is active. Please complete your KYE verification.',
        icon: 'waving_hand',
      },
    });

    res.status(201).json({
      success: true,
      staff: {
        id: staffId,
        name,
        email: email.toLowerCase(),
        role: role || 'Staff',
        department: department || 'General',
      },
      tempPassword,
    });
  } catch (error) {
    console.error('Admin invite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/staff/:staffId - Remove staff
router.delete('/staff/:staffId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { staffId: req.params.staffId } });
    if (!user) {
      res.status(404).json({ error: 'Staff member not found' });
      return;
    }

    await prisma.user.delete({ where: { id: user.id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        admin: req.user!.email,
        action: `Removed staff: ${user.name} (${user.email})`,
        details: `Staff ID: ${user.staffId}`,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Admin delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/staff/:staffId/approve - Approve KYE
router.put('/staff/:staffId/approve', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { staffId: req.params.staffId },
      include: { kyeSubmission: true },
    });

    if (!user || !user.kyeSubmission) {
      res.status(404).json({ error: 'Staff or KYE submission not found' });
      return;
    }

    await prisma.kyeSubmission.update({
      where: { userId: user.id },
      data: {
        status: 'verified',
        step: 4,
        stepLabel: 'Verified',
        adminComment: req.body.comment || null,
      },
    });

    // Notification for staff
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'KYE Approved!',
        message: 'Your KYE verification has been approved. You now have full system access.',
        icon: 'verified',
      },
    });

    // Activity for staff
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: 'success',
        title: 'KYE Verified',
        description: 'Your identity verification has been approved by the compliance team.',
        icon: 'verified',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        admin: req.user!.email,
        action: `Approved KYE for ${user.name} (${user.staffId})`,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Admin approve error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/staff/:staffId/reject - Reject KYE
router.put('/staff/:staffId/reject', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { staffId: req.params.staffId },
      include: { kyeSubmission: true },
    });

    if (!user || !user.kyeSubmission) {
      res.status(404).json({ error: 'Staff or KYE submission not found' });
      return;
    }

    await prisma.kyeSubmission.update({
      where: { userId: user.id },
      data: {
        status: 'rejected',
        step: 2,
        stepLabel: 'Rejected',
        rejectReason: req.body.reason || 'No reason specified',
        adminComment: req.body.comment || null,
      },
    });

    // Notification for staff
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'KYE Rejected',
        message: `Your KYE verification was rejected. Reason: ${req.body.reason || 'Please contact compliance.'}`,
        icon: 'error',
      },
    });

    // Activity for staff
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: 'error',
        title: 'KYE Rejected',
        description: `Verification rejected: ${req.body.reason || 'Action required.'}`,
        icon: 'cancel',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        admin: req.user!.email,
        action: `Rejected KYE for ${user.name} (${user.staffId}). Reason: ${req.body.reason || 'N/A'}`,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Admin reject error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/staff/:staffId/reopen - Reopen rejected KYE
router.put('/staff/:staffId/reopen', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { staffId: req.params.staffId },
      include: { kyeSubmission: true },
    });

    if (!user || !user.kyeSubmission) {
      res.status(404).json({ error: 'Staff or KYE submission not found' });
      return;
    }

    await prisma.kyeSubmission.update({
      where: { userId: user.id },
      data: {
        status: 'pending_review',
        step: 2,
        stepLabel: 'Document Review',
        rejectReason: null,
        adminComment: null,
      },
    });

    // Notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'KYE Reopened',
        message: 'Your KYE submission has been reopened for review.',
        icon: 'refresh',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        admin: req.user!.email,
        action: `Reopened KYE for ${user.name} (${user.staffId})`,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Admin reopen error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, action, date } = req.query;

    let logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Filter by action type
    if (action && action !== 'all' && typeof action === 'string') {
      logs = logs.filter(log => {
        const lower = log.action.toLowerCase();
        if (action === 'approved') return lower.includes('approved') || lower.includes('approve');
        if (action === 'rejected') return lower.includes('rejected') || lower.includes('reject');
        if (action === 'invited') return lower.includes('invited') || lower.includes('invite');
        return true;
      });
    }

    // Filter by date
    if (date && date !== 'all' && typeof date === 'string') {
      const now = new Date();
      let cutoff: Date;
      if (date === 'today') {
        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else {
        cutoff = new Date(now.getTime() - parseInt(date) * 24 * 60 * 60 * 1000);
      }
      logs = logs.filter(log => new Date(log.createdAt) >= cutoff);
    }

    // Search
    if (search && typeof search === 'string') {
      const term = search.toLowerCase();
      logs = logs.filter(log =>
        (log.admin + ' ' + log.action).toLowerCase().includes(term)
      );
    }

    const result = logs.map(log => ({
      id: log.id,
      admin: log.admin,
      action: log.action,
      date: log.createdAt,
      details: log.details,
    }));

    // Stats (from all logs, not filtered)
    const allLogs = await prisma.auditLog.findMany();
    const stats = {
      total: allLogs.length,
      approvals: allLogs.filter(l => l.action.toLowerCase().includes('approved') || l.action.toLowerCase().includes('approve')).length,
      rejections: allLogs.filter(l => l.action.toLowerCase().includes('rejected') || l.action.toLowerCase().includes('reject')).length,
      other: allLogs.filter(l => {
        const lower = l.action.toLowerCase();
        return !lower.includes('approved') && !lower.includes('approve') &&
               !lower.includes('rejected') && !lower.includes('reject');
      }).length,
    };

    res.json({ logs: result, stats });
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/audit-logs - Clear all logs
router.delete('/audit-logs', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.auditLog.deleteMany();

    // Log the clearing itself
    await prisma.auditLog.create({
      data: {
        admin: req.user!.email,
        action: 'Cleared all audit logs',
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Clear audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/staff/:staffId/download-csv - Export staff CSV
router.get('/download-csv', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      include: { kyeSubmission: true },
      orderBy: { createdAt: 'desc' },
    });

    let csv = 'Staff ID,Name,Email,Role,Department,KYE Status,Submitted Date\n';
    for (const u of users) {
      const kyeStatus = u.kyeSubmission?.status || 'pending_submission';
      const submitted = u.kyeSubmission?.submittedDate ? new Date(u.kyeSubmission.submittedDate).toISOString() : '';
      csv += `"${u.staffId}","${u.name}","${u.email}","${u.role}","${u.department}","${kyeStatus}","${submitted}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=degxifi_staff_${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
