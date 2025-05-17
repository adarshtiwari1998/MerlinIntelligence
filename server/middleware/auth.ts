
import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
}

export async function login(req: Request, res: Response) {
  const { username, password } = req.body;
  
  const [user] = await db.select().from(users).where(eq(users.username, username));
  
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  req.session.userId = user.id;
  res.json({ message: 'Logged in successfully' });
}

export async function register(req: Request, res: Response) {
  const { username, password } = req.body;
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    const [user] = await db
      .insert(users)
      .values({ username, password: hashedPassword })
      .returning();
      
    req.session.userId = user.id;
    res.json({ message: 'Registered successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Username already exists' });
  }
}
