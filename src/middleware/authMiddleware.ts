import type { Request, Response, NextFunction } from 'express';
import type { JwtPayload } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export const courierAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Not authorized' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    // @ts-ignore IDK really
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & { courierId: number };

    if (!decoded || typeof decoded !== 'object' || !('courierId' in decoded)) {
      res.status(401).json({ error: 'Invalid token payload' });
      return;
    }

    (req as any).courierId = decoded.courierId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
};

export const adminAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Not authorized' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    // @ts-ignore classic
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & { isAdmin: boolean };
    if (!decoded || typeof decoded !== 'object' || !('isAdmin' in decoded) || !decoded.isAdmin) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    (req as any).isAdmin = decoded.isAdmin;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
};
