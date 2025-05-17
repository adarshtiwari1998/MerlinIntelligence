import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users, verificationCodes, pendingUsers } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { passwordResets } from '@shared/schema';
import { desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

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
      return res.status(401).json({ message: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Incorrect password' });
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
      .where(eq(passwordResets.token, token))
      .limit(1);

    if (!resetRequest) {
      console.error('Reset request not found for token:', token);
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    const now = new Date();

    // Check if token is expired
    if (resetRequest.expiresAt < now) {
      console.error('Token expired at:', resetRequest.expiresAt, 'current time:', now);
      await db.delete(passwordResets).where(eq(passwordResets.token, token));
      return res.status(400).json({ message: 'Reset token has expired. Please request a new password reset.' });
    }

    // Check if token is used
    if (resetRequest.used) {
      await db.delete(passwordResets).where(eq(passwordResets.token, token));
      return res.status(400).json({ message: 'This reset token has already been used. Please request a new password reset.' });
    }

    try {
      // Mark token as used in a transaction to prevent race conditions
      await db.transaction(async (tx) => {
        // Mark token as used
        await tx
          .update(passwordResets)
          .set({ used: true })
          .where(eq(passwordResets.token, token));

        // Hash and update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await tx
          .update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, resetRequest.userId));
      });

      // Send confirmation email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, resetRequest.userId));

      let transporter: nodemailer.Transporter;
      if (!transporter) {
        transporter = nodemailer.createTransport({
          host: "smtp.hostinger.com",
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          },
          tls: {
            rejectUnauthorized: false
          }
        });
      }

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Password Changed Successfully',
        html: `
          <h1>Password Changed</h1>
          <p>Your password has been changed successfully.</p>
          <p>If you did not make this change, please contact support immediately.</p>
        `
      });

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
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

  // Store registration data in session
  req.session.pendingRegistration = {
    email,
    username,
    password,
    timestamp: Date.now()
  };

  try {
    // Check if user already exists by email and username
    const existingUserEmail = await db.select().from(users).where(eq(users.email, email));
    const existingUserUsername = await db.select().from(users).where(eq(users.username, username));

    if (existingUserEmail.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    if (existingUserUsername.length > 0) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = `${uuidv4()}_${Date.now()}`; // Add timestamp to make token unique
    const verificationExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Using a transaction to ensure data consistency
    await db.transaction(async (tx) => {
      // First check if email exists in users table
      const existingUser = await tx
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new Error('Email already registered');
      }

      // Insert into pending_users table
      const [pendingUser] = await tx
        .insert(pendingUsers)
        .values({
          email,
          username,
          password: hashedPassword,
          verificationToken,
          expiresAt: verificationExpiry
        })
        .returning();
    let transporter: nodemailer.Transporter;
    if (!transporter) {
      transporter = nodemailer.createTransport({
        host: "smtp.hostinger.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    }

    const verificationUrl = `${process.env.APP_URL}/action-code?mode=verifyEmail&code=${verificationToken}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your email',
      html: `
        <h1>Welcome to our platform!</h1>
        <p>Please click the link below to verify your account:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>This link will expire in 30 minutes.</p>
      `
    });

      res.json({ 
        message: 'Verification email sent',
        email: email 
      });
    });
  } catch (error) {
    console.error('Registration error:', error);
    // If error is about duplicate key, return specific message
    if (error.code === '23505') {
      if (error.detail.includes('email')) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      if (error.detail.includes('username')) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }
    res.status(500).json({ message: 'Registration failed' });
  }
}

export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.body;

  try {
    // Find pending user with this verification token
    const [pendingUser] = await db
      .select()
      .from(pendingUsers)
      .where(eq(pendingUsers.verificationToken, token))
      .limit(1);

    if (!pendingUser) {
      return res.status(404).json({ message: 'Verification token not found' });
    }

    if (pendingUser.expiresAt < new Date()) {
      // Delete expired pending user
      await db
        .delete(pendingUsers)
        .where(eq(pendingUsers.id, pendingUser.id));
      return res.status(400).json({ message: 'Verification link expired' });
    }

    // Move user from pending to active in a transaction
    await db.transaction(async (tx) => {
      // Create verified user
      const [user] = await tx
        .insert(users)
        .values({
          email: pendingUser.email,
          username: pendingUser.username,
          password: pendingUser.password,
          verified: true
        })
        .returning();

      // Delete pending user
      await tx
        .delete(pendingUsers)
        .where(eq(pendingUsers.id, pendingUser.id));

    // Set session and save it
    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ message: 'Error creating session' });
      }
      res.json({ 
        message: 'Email verified successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username
        }
      });
    });
  });
} catch (error) {
  console.error('Verification error:', error);
  res.status(500).json({ message: 'Verification failed' });
}
export async function verifyRouteGuard(req: Request, res: Response, next: NextFunction) {
  const referrer = req.headers.referer;
  const isFromSignup = referrer?.includes('/sign-up');
  const verificationToken = req.query.token || (req.query.mode === 'verifyEmail' && req.query.code);

  if (!verificationToken) {
    return res.status(403).json({ message: 'Invalid verification link' });
  }

  // Check if token exists and is valid
  const [pendingUser] = await db
    .select()
    .from(pendingUsers)
    .where(eq(pendingUsers.verificationToken, verificationToken as string))
    .limit(1);

  if (!pendingUser) {
    return res.status(404).json({ message: 'Verification link expired or invalid' });
  }

  if (pendingUser.expiresAt < new Date()) {
    await db.delete(pendingUsers).where(eq(pendingUsers.id, pendingUser.id));
    return res.status(400).json({ message: 'Verification link expired. Please sign up again.' });
  }

  next();
}