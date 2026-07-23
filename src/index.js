import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config/index.js';
import { validateEnv } from './config/validate.js';
import { connectDB, disconnectDB } from './config/db.js';
import { startInvoiceCron } from './cron.js';
import { seedIfNeeded } from './seed.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/logger.js';
import { setupWebSocket } from './websocket.js';

import authRoutes from './routes/auth.js';
import siteAdminRoutes from './routes/siteAdmin.js';
import apartmentAdminRoutes from './routes/apartmentAdmin.js';
import committeeRoutes from './routes/committee.js';
import complaintRoutes from './routes/complaints.js';
import visitorLogRoutes from './routes/visitorLogs.js';
import noticeRoutes from './routes/notices.js';
import dashboardRoutes from './routes/dashboards.js';
import userRoutes from './routes/users.js';
import exportRoutes from './routes/export.js';
import uploadRoutes from './routes/uploads.js';
import facilityRoutes from './routes/facilities.js';
import notificationRoutes from './routes/notifications.js';
import documentRoutes from './routes/documents.js';
import serviceRequestRoutes from './routes/serviceRequests.js';
import paymentRoutes from './routes/payments.js';
import auditLogRoutes from './routes/auditLogs.js';
import analyticsRoutes from './routes/analytics.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');

const app = express();

const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:5173', 'http://localhost:5000'];
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true,
  credentials: true,
}));
app.use(express.json());
app.use(express.static(frontendDist));

app.use(requestLogger);
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/admin', siteAdminRoutes);
app.use('/api/apartment', apartmentAdminRoutes);
app.use('/api/committees', committeeRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/visitors', visitorLogRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: dbState === 1 ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    db: dbStatus[dbState] || 'unknown',
    node: process.version,
    env: process.env.NODE_ENV || 'development',
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

let server;

function gracefulShutdown(signal) {
  console.log(`\n[${signal}] Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      await disconnectDB();
      console.log('Server closed');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('Forced shutdown after 10s timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

async function start() {
  validateEnv();
  try {
    await connectDB();
    await seedIfNeeded();
    startInvoiceCron();
    server = http.createServer(app);
    setupWebSocket(server);
    server.listen(config.port, () => {
      console.log(`ACMS backend running on port ${config.port}`);
    });
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (err) {
    console.error('\nFailed to start server:', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.error('   -> Is MongoDB running? Start it or set MONGODB_URI in .env');
      console.error('   -> Quick start: docker compose up -d mongo');
    }
    process.exit(1);
  }
}

start();
