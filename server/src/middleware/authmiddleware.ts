import { Role } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface CustomJwtPayload {
  id: number;
  role: Role;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // console.log('token :', token);

  if (!token) {
    res.status(401).json({ error: 'Access denied' });
    return;
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET as string) as CustomJwtPayload;
    req.user = verified;
    // console.log('verified', verified);
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

export const checkRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.role !== role) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    next();
  };
};
