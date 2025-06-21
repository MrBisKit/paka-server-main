import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET!;

const generateToken = (courierId: number) => {
  return jwt.sign({ courierId }, JWT_SECRET, { expiresIn: '7d' });
};

export const registerCourier = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const existing = await prisma.courier.findUnique({ where: { username } });
    if (existing)
      return res.status(400).json({ error: 'User with this username is already registered.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const courier = await prisma.courier.create({
      data: {
        username,
        hashedPassword,
      },
    });

    res.status(201).json({
      courier: { id: courier.id, username: courier.username },
    });
  } catch (err) {
    console.error('Courier registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const loginCourier = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const courier = await prisma.courier.findUnique({ where: { username } });
    if (!courier) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, courier.hashedPassword);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(courier.id);

    res.json({
      courier: { id: courier.id, username: courier.username },
      token,
    });
  } catch (err) {
    console.error('Courier login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCurrentCourier = async (req: Request, res: Response) => {
  const courierId = (req as any).courierId;

  try {
    const courier = await prisma.courier.findUnique({
      where: { id: courierId },
      select: { id: true, username: true },
    });

    if (!courier) return res.status(404).json({ error: 'Courier not found' });

    res.json({ courier });
  } catch (err) {
    console.error('Get courier error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const loginAdmin = async (req: Request, res: Response) => {
  const { login, password } = req.body;
  if (login !== process.env.ADMIN_LOGIN || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  try {
    const token = jwt.sign({ isAdmin: true }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
