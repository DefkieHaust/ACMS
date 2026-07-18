import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { connectDB } from './config/db.js';
import { startInvoiceCron } from './cron.js';
import { seedIfNeeded } from './seed.js';

import authRoutes from './routes/auth.js';
import siteAdminRoutes from './routes/siteAdmin.js';
import apartmentAdminRoutes from './routes/apartmentAdmin.js';
import committeeRoutes from './routes/committee.js';
import complaintRoutes from './routes/complaints.js';
import visitorLogRoutes from './routes/visitorLogs.js';
import noticeRoutes from './routes/notices.js';
import dashboardRoutes from './routes/dashboards.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(frontendDist));

app.use('/api/auth', authRoutes);
app.use('/api/admin', siteAdminRoutes);
app.use('/api/apartment', apartmentAdminRoutes);
app.use('/api/committees', committeeRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/visitors', visitorLogRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    await connectDB();
    await seedIfNeeded();
    startInvoiceCron();
    app.listen(config.port, () => {
      console.log(`ACMS backend running on port ${config.port}`);
    });
  } catch (err) {
    console.error('\n❌ Failed to start server:', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.error('   → Is MongoDB running? Start it or set MONGODB_URI in .env');
      console.error('   → Quick start: docker compose up -d mongo');
    }
    process.exit(1);
  }
}

start();
