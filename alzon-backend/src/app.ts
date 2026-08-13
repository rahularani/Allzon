import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { prisma } from './config/database';
import { sendSuccess } from './utils/response';
import { logger } from './utils/logger';

// Module Routes
import authRoutes from './modules/auth/auth.routes';
import buyersRoutes from './modules/buyers/buyers.routes';
import suppliersRoutes from './modules/suppliers/suppliers.routes';
import categoriesRoutes from './modules/categories/categories.routes';
import productsRoutes from './modules/products/products.routes';
import enquiriesRoutes from './modules/enquiries/enquiries.routes';
import verificationRoutes from './modules/verification/verification.routes';
import wishlistRoutes from './modules/wishlist/wishlist.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import adminRoutes from './modules/admin/admin.routes';

const app: Application = express();

// ─── Security Headers ────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  }),
);

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  env.CLIENT_BUYER_URL,
  env.CLIENT_SUPPLIER_URL,
  env.CLIENT_ADMIN_URL,
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. Postman, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      logger.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true, // Required for httpOnly refresh-token cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ─── Cookie Parser ───────────────────────────────────────────────────────────
app.use(cookieParser());

// ─── Body Parsers ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Global Rate Limiter ─────────────────────────────────────────────────────
app.use(globalLimiter);

// ─── Root & Health Check Endpoints ───────────────────────────────────────────
app.get('/health', async (_req: Request, res: Response) => {
  let dbStatus = 'connected';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'disconnected';
  }

  sendSuccess(
    res,
    {
      status: 'ok',
      db: dbStatus,
      env: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
    'ALLZON API is running',
    dbStatus === 'connected' ? 200 : 503,
  );
});

// API Root Information Endpoint
app.get(['/', '/api/v1'], (_req: Request, res: Response) => {
  sendSuccess(
    res,
    {
      name: 'ALLZON Centralized B2B Wholesale Marketplace API',
      version: '1.0.0',
      status: 'active',
      documentation: 'http://localhost:3000/health',
      endpoints: {
        health: '/health',
        auth: '/api/v1/auth',
        buyers: '/api/v1/buyers',
        suppliers: '/api/v1/suppliers',
        categories: '/api/v1/categories',
        products: '/api/v1/products',
        enquiries: '/api/v1/enquiries',
        verification: '/api/v1/verification',
        wishlist: '/api/v1/wishlist',
        notifications: '/api/v1/notifications',
        admin: '/api/v1/admin',
      },
    },
    'Welcome to ALLZON API v1',
  );
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/buyers', buyersRoutes);
app.use('/api/v1/suppliers', suppliersRoutes);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/enquiries', enquiriesRoutes);
app.use('/api/v1/verification', verificationRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/admin', adminRoutes);

// ─── 404 + Error Handlers ────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
