import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import authRoutes from './routes/auth';
import staffRoutes from './routes/staff';
import kyeRoutes from './routes/kye';
import adminRoutes from './routes/admin';

const app = express();

// Middleware
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(config.uploadDir));

// Serve frontend static files
app.use(express.static(path.resolve(__dirname, '../../')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/kye', kyeRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Degxifi KYE Backend running on http://localhost:${config.port}`);
  console.log(`📁 Uploads directory: ${config.uploadDir}`);
  console.log(`🌐 CORS origin: ${config.corsOrigin}`);
});

export default app;
