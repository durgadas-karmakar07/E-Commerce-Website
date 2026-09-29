import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { connectDatabase } from './config/database.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { seedDatabaseIfEmpty } from './seed/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security and middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Serve uploaded media
const uploadsPath = path.resolve('public/uploads');
app.use('/uploads', express.static(uploadsPath));

// Mount API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Central error handler
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDatabase();

    // Auto-seed if database is empty
    await seedDatabaseIfEmpty();

    const server = app.listen(config.port, () => {
      console.log(`===============================================`);
      console.log(`🚀 AURA E-Commerce Server running on port ${config.port}`);
      console.log(`🔗 API Base: http://localhost:${config.port}/api`);
      console.log(`📦 Media Uploads: http://localhost:${config.port}/uploads`);
      console.log(`===============================================`);
    });

    const shutdown = async () => {
      console.log('\nGracefully shutting down server...');
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Fatal startup error:', error);
    process.exit(1);
  }
};

startServer();

export default app;
