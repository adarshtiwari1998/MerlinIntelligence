
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
  
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ message: 'Error creating session' });
      }
      res.json({ 
        message: 'Logged in successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username
        }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function resetPassword(req: Request, res: Response) {
  const { token, newPassword } = req.body;
  
  try {
    // Verify token and get user
    const [resetRequest] = await db
      .select()
      .from(passwordResets)
      .where(eq(passwordResets.token, token));
      
    if (!resetRequest || resetRequest.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, resetRequest.userId));

    // Delete used token
    await db
      .delete(passwordResets)
      .where(eq(passwordResets.token, token));

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
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
