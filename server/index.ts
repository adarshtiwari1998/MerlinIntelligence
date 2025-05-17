// index.ts
import express, { type Request, Response, NextFunction } from "express";
import session from 'express-session';
import { Pool } from 'pg';
import connectPgSimple from 'connect-pg-simple';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { LLMGateway } from "./ai/llmGateway";
import { login, register, isAuthenticated } from "./middleware/auth";

const pgSession = connectPgSimple(session);
const pool = new Pool({
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: true
}); // Import LLMGateway

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  store: new pgSession({
    pool,
    tableName: 'user_sessions'
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Auth routes
app.post('/api/auth/login', login);
app.post('/api/auth/register', register);
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out successfully' });
  });
});

// Logger middleware
app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;
    const originalResJson = res.json;

    res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            let logLine = `\${req.method} \${path} \${res.statusCode} in \${duration}ms`;
            if (capturedJsonResponse) {
                logLine += ` :: \${JSON.stringify(capturedJsonResponse)}`;
            }
            if (logLine.length > 80) {
                logLine = logLine.slice(0, 79) + "…";
            }
            log(logLine);
        }
    });
    next();
});

(async () => {
    // Initialize LLMGateway
    const llmGateway = await LLMGateway.create();

    // Register routes, passing the LLMGateway instance
    const server = await registerRoutes(app, llmGateway);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
        throw err;
    });

    // Vite setup (development) or static serving (production)
    if (app.get("env") === "development") {
        await setupVite(app, server);
    } else {
        serveStatic(app);
    }

    const port = process.env.PORT || 3001;
    server.listen({
        port,
        host: "0.0.0.0",
    }, () => {
        log(`Server listening on http://0.0.0.0:${port}`);
    });
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
    });
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
})();