
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
  const { email, password } = req.body;
  
  const [user] = await db.select().from(users).where(eq(users.email, email));
  
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  req.session.userId = user.id;
  res.json({ message: 'Logged in successfully' });
}

export async function register(req: Request, res: Response) {
  const { email, username, password } = req.body;
  
  if (!email || !username || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(users)
      .values({ email, username, password: hashedPassword })
      .returning();
      
    req.session.userId = user.id;
    res.json({ user, message: 'Registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ message: 'Registration failed' });
  }
}
