import { Role } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';

export interface CustomJwtPayload {
  id: number;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: CustomJwtPayload;
    }
  }
}
