import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
const prisma = new PrismaClient();

// All staff routes require authentication
router.use(authenticate);

// GET /api/staff/profile
router.get('/profile', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const kye = await prisma.kyeSubmission.findUnique({ where: { userId: user.id } });

    res.json({
      id: user.id,
      staffId: user.staffId,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      region: user.region,
      avatar: user.avatar,
      kyeStatus: kye?.status || 'pending_submission',
      kyeStep: kye?.step || 0,
      kyeTotalSteps: kye?.totalSteps || 4,
      kyeStepLabel: kye?.stepLabel || 'Awaiting Submission',
      kyeSubmittedDate: kye?.submittedDate,
      kyeRefId: kye?.refId,
      documentsUploaded: kye?.documentsUploaded || 0,
      documentsRequired: kye?.documentsRequired || 3,
      riskScore: kye?.riskScore || 0,
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/staff/dashboard
router.get('/dashboard', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const kye = await prisma.kyeSubmission.findUnique({ where: { userId: user.id } });
    const activities = await prisma.activity.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const accessLevel = kye?.status === 'verified' ? 'Full Access' : 'Restricted';

    res.json({
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        region: user.region,
        staffId: user.staffId,
        avatar: user.avatar,
      },
      kye: {
        status: kye?.status || 'pending_submission',
        step: kye?.step || 0,
        totalSteps: kye?.totalSteps || 4,
        stepLabel: kye?.stepLabel || 'Awaiting Submission',
        submittedDate: kye?.submittedDate,
        refId: kye?.refId,
        documentsUploaded: kye?.documentsUploaded || 0,
        documentsRequired: kye?.documentsRequired || 3,
        riskScore: kye?.riskScore || 0,
      },
      accessLevel,
      activities: activities.map(a => ({
        id: a.id,
        type: a.type,
        title: a.title,
        description: a.description,
        date: a.createdAt,
        icon: a.icon,
      })),
      notifications: notifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        time: n.createdAt,
        read: n.read,
        icon: n.icon,
      })),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/staff/notifications
router.get('/notifications', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(notifications.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      time: n.createdAt,
      read: n.read,
      icon: n.icon,
    })));
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/staff/notifications/:id/read
router.put('/notifications/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.userId },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/staff/notifications/read-all
router.put('/notifications/read-all', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/staff/activities
router.get('/activities', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activities = await prisma.activity.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(activities.map(a => ({
      id: a.id,
      type: a.type,
      title: a.title,
      description: a.description,
      date: a.createdAt,
      icon: a.icon,
    })));
  } catch (error) {
    console.error('Activities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
