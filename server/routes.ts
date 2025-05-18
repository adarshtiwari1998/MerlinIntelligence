// routes.ts
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { modelRequestSchema, modelResponseSchema, users, passwordResets } from "@shared/schema";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { LLMGateway } from "./ai/llmGateway";
import { MemVectorDB } from "./ai/vectorDb";
import nodemailer from 'nodemailer';
import { storage } from './storage';
import { checkVerificationToken } from './middleware/auth';

const transporter = nodemailer.createTransport({
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

const vectorDb = new MemVectorDB();

export async function registerRoutes(app: Express, llmGateway: LLMGateway): Promise<Server> {
    // Auth check route
    app.get("/api/auth/check", (req: Request, res: Response) => {
        if (!req.session?.userId) {
            return res.status(200).json({ 
                authenticated: false,
                user: null 
            });
        }
        res.json({ 
            authenticated: true, 
            user: req.session.user 
        });
    });

    // Health check route
    app.get("/api/health", (_req, res) => {
        res.json({ status: "ok" });
    });

    app.get("/api/auth/verify/check", checkVerificationToken);

    // LLM gateway route
    app.post("/api/llm", async (req: Request, res: Response) => {
        try {
            const validatedRequest = modelRequestSchema.parse(req.body);

            const startTime = Date.now();
            const result = await llmGateway.routeRequest(validatedRequest);

            // Track response time
            const endTime = Date.now();
            const latencyMs = endTime - startTime;

            // Store request and response in storage (optional)
            if (req.session?.user?.id) {
                const aiRequest = await storage.createAIRequest({
                    userId: req.session.user.id,
                    modelType: validatedRequest.modelType,
                    prompt: validatedRequest.prompt,
                    context: validatedRequest.context || {},
                    maxTokens: validatedRequest.maxTokens,
                    temperature: validatedRequest.temperature.toString(),
                });

                await storage.createAIResponse({
                    requestId: aiRequest.id,
                    text: result.text,
                    modelUsed: result.modelUsed,
                    tokensUsed: result.tokensUsed,
                    latencyMs: Math.round(latencyMs),
                });
            }

            // Return response to client
            res.json({
                text: result.text,
                modelUsed: result.modelUsed,
                tokensUsed: result.tokensUsed,
                latencyMs: Math.round(latencyMs),
            });
        } catch (error) {
            console.error("Error processing LLM request:", error);

            if (error instanceof ZodError) {
                const validationError = fromZodError(error);
                res.status(400).json({ error: validationError.message });
            } else {
                res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
            }
        }
    });

    // Embeddings route
    app.post("/api/embeddings", async (req: Request, res: Response) => {
        try {
            const { text } = req.body;

            if (!text || typeof text !== "string") {
                return res.status(400).json({ error: "Text is required" });
            }

            const embedding = await llmGateway.generateEmbedding(text);

            // Store embedding in vector DB
            const id = await vectorDb.addItem(text, embedding);

            res.json({ id, embedding });
        } catch (error) {
            console.error("Error generating embedding:", error);
            res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
        }
    });

    // Similarity search route
    app.post("/api/similarity", async (req: Request, res: Response) => {
        try {
            const { embedding, limit = 5 } = req.body;

            if (!embedding || !Array.isArray(embedding)) {
                return res.status(400).json({ error: "Valid embedding array is required" });
            }

            const results = await vectorDb.searchSimilar(embedding, limit);
            res.json(results);
        } catch (error) {
            console.error("Error performing similarity search:", error);
            res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
        }
    });

    // LLM status route
    app.get("/api/llm/status", async (_req: Request, res: Response) => {
        try {
            const status = await llmGateway.getStatus();
            res.json(status);
        } catch (error) {
            console.error("Error getting LLM status:", error);
            res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
        }
    });

    app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
        try {
            const { email } = req.body;
            
            // Find user by email
            const [user] = await db.select().from(users).where(eq(users.email, email));
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Generate secure reset token
            const resetToken = await import('crypto').then(crypto => crypto.randomBytes(32).toString('hex'));
            
            // Store token in database
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 1); // Token expires in 1 hour
            
            await storage.db.insert(passwordResets).values({
                userId: user.id,
                token: resetToken,
                expiresAt: expiryDate,
                used: false
            });

            // Send reset email
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Password Reset Request',
                html: `
                    <h1>Password Reset Request</h1>
                    <p>Click the link below to reset your password:</p>
                    <a href="${process.env.APP_URL}/reset-password?token=${resetToken}">Reset Password</a>
                `
            };

            await transporter.sendMail(mailOptions);

            res.json({ message: 'Password reset email sent' });
        } catch (error) {
            console.error("Error sending password reset email:", error);
            res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
        }
    });

    const httpServer = createServer(app);
    return httpServer;
}