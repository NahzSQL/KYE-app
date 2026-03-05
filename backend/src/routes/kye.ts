import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';
import { config } from '../config';

const router = Router();
const prisma = new PrismaClient();

// Ensure uploads directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG, and PDF files are allowed'));
    }
  },
});

// All KYE routes require authentication
router.use(authenticate);

// GET /api/kye/status
router.get('/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const kye = await prisma.kyeSubmission.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!kye) {
      res.json({
        status: 'pending_submission',
        step: 0,
        totalSteps: 4,
        stepLabel: 'Awaiting Submission',
        submittedDate: null,
        refId: null,
        documentsUploaded: 0,
        documentsRequired: 3,
        riskScore: 0,
        rejectReason: null,
        adminComment: null,
      });
      return;
    }

    res.json({
      status: kye.status,
      step: kye.step,
      totalSteps: kye.totalSteps,
      stepLabel: kye.stepLabel,
      submittedDate: kye.submittedDate,
      refId: kye.refId,
      documentsUploaded: kye.documentsUploaded,
      documentsRequired: kye.documentsRequired,
      riskScore: kye.riskScore,
      rejectReason: kye.rejectReason,
      adminComment: kye.adminComment,
      personalDetails: {
        fullName: kye.fullName,
        phone: kye.phone,
        dob: kye.dob,
        address: kye.address,
      },
      documents: {
        idType: kye.idType,
        hasIdDocument: !!kye.idDocumentPath,
        hasAddressDoc: !!kye.addressDocPath,
        hasSelfie: !!kye.selfiePath,
      },
    });
  } catch (error) {
    console.error('KYE status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/kye/submit - Submit personal details (Step 1)
router.post('/submit', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, phone, dob, address } = req.body;

    if (!fullName || !phone || !dob || !address) {
      res.status(400).json({ error: 'All personal details are required' });
      return;
    }

    const userId = req.user!.userId;

    // Upsert the KYE submission
    const kye = await prisma.kyeSubmission.upsert({
      where: { userId },
      create: {
        userId,
        fullName,
        phone,
        dob,
        address,
        status: 'pending_submission',
        step: 1,
        stepLabel: 'Personal Details Saved',
      },
      update: {
        fullName,
        phone,
        dob,
        address,
      },
    });

    // Add activity
    await prisma.activity.create({
      data: {
        userId,
        type: 'info',
        title: 'Personal Details Updated',
        description: 'KYE personal details have been saved.',
        icon: 'edit',
      },
    });

    res.json({ success: true, kye });
  } catch (error) {
    console.error('KYE submit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/kye/upload/:docType - Upload a document (id, address, selfie)
router.post('/upload/:docType', upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { docType } = req.params;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const validTypes = ['id', 'address', 'selfie'];
    if (!validTypes.includes(docType)) {
      res.status(400).json({ error: 'Invalid document type. Must be: id, address, or selfie' });
      return;
    }

    const userId = req.user!.userId;
    const filePath = `/uploads/${file.filename}`;

    // Build update data based on doc type
    const updateData: Record<string, string | number | undefined> = {};
    if (docType === 'id') {
      updateData.idDocumentPath = filePath;
      updateData.idType = req.body.idType || 'passport';
    } else if (docType === 'address') {
      updateData.addressDocPath = filePath;
    } else if (docType === 'selfie') {
      updateData.selfiePath = filePath;
    }

    // Upsert KYE
    let kye = await prisma.kyeSubmission.findUnique({ where: { userId } });

    if (!kye) {
      kye = await prisma.kyeSubmission.create({
        data: {
          userId,
          ...updateData,
          documentsUploaded: 1,
        } as any,
      });
    } else {
      // Count documents
      const currentDocs = {
        id: docType === 'id' ? filePath : kye.idDocumentPath,
        address: docType === 'address' ? filePath : kye.addressDocPath,
        selfie: docType === 'selfie' ? filePath : kye.selfiePath,
      };
      const docCount = [currentDocs.id, currentDocs.address, currentDocs.selfie].filter(Boolean).length;

      kye = await prisma.kyeSubmission.update({
        where: { userId },
        data: {
          ...updateData,
          documentsUploaded: docCount,
        } as any,
      });
    }

    // Add activity
    const docNames: Record<string, string> = {
      id: 'Government ID',
      address: 'Proof of Address',
      selfie: 'Selfie Verification',
    };
    await prisma.activity.create({
      data: {
        userId,
        type: 'success',
        title: `${docNames[docType]} Uploaded`,
        description: `${docNames[docType]} document has been uploaded successfully.`,
        icon: 'upload_file',
      },
    });

    res.json({ success: true, filePath, documentsUploaded: kye.documentsUploaded });
  } catch (error) {
    console.error('KYE upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/kye/finalize - Submit KYE for review (after all docs uploaded)
router.post('/finalize', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const kye = await prisma.kyeSubmission.findUnique({ where: { userId } });

    if (!kye) {
      res.status(400).json({ error: 'No KYE submission found. Please fill in your details first.' });
      return;
    }

    if (!kye.fullName || !kye.phone || !kye.dob || !kye.address) {
      res.status(400).json({ error: 'Personal details are incomplete' });
      return;
    }

    if (!kye.idDocumentPath || !kye.addressDocPath || !kye.selfiePath) {
      res.status(400).json({ error: 'All 3 documents are required before submitting' });
      return;
    }

    const refId = `DGX-${Math.floor(Math.random() * 90000 + 10000)}-KYE`;

    const updated = await prisma.kyeSubmission.update({
      where: { userId },
      data: {
        status: 'pending_review',
        step: 2,
        stepLabel: 'Document Review',
        refId,
        submittedDate: new Date(),
        riskScore: parseFloat((Math.random() * 0.2).toFixed(2)),
      },
    });

    // Add activity & notification
    await prisma.activity.create({
      data: {
        userId,
        type: 'success',
        title: 'KYE Submitted for Review',
        description: `Your KYE verification has been submitted. Reference: ${refId}`,
        icon: 'send',
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        title: 'KYE Submitted',
        message: `Your KYE documents are now under review. REF: ${refId}`,
        icon: 'task',
      },
    });

    res.json({
      success: true,
      status: updated.status,
      refId: updated.refId,
      submittedDate: updated.submittedDate,
    });
  } catch (error) {
    console.error('KYE finalize error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
