import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { authenticate } from '../middleware/auth';
import { AuthRequest, JwtPayload } from '../types';

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/login
router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials or account does not exist' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check role mismatch
    if (role === 'admin' && !user.isAdmin) {
      res.status(403).json({ error: 'You do not have admin access' });
      return;
    }

    const payload: JwtPayload = {
      userId: user.id,
      staffId: user.staffId,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

    // Get KYE submission
    const kye = await prisma.kyeSubmission.findUnique({ where: { userId: user.id } });

    res.json({
      token,
      user: {
        id: user.id,
        staffId: user.staffId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        region: user.region,
        isAdmin: user.isAdmin,
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
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
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
      isAdmin: user.isAdmin,
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
    console.error('Auth me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
