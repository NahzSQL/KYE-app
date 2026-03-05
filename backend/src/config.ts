import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'degxifi-kye-secret-change-in-production',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  uploadDir: path.resolve(__dirname, '..', process.env.UPLOAD_DIR || './uploads'),
  jwtExpiresIn: '24h',
};
