import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  staffId: string;
  email: string;
  isAdmin: boolean;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
