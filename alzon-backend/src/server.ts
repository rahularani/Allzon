import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './utils/logger';

const server = http.createServer(app);

async function start(): Promise<void> {
  // Connect to PostgreSQL
  try {
    await connectDatabase();
    logger.info('✅ PostgreSQL connected');
  } catch (err) {
    logger.error('❌ Failed to connect to PostgreSQL', { err });
    process.exit(1);
  }

  // Start HTTP server
  server.listen(env.PORT, () => {
    logger.info(`🚀 ALLZON API running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`   Health: http://localhost:${env.PORT}/health`);
    logger.info(`   API:    http://localhost:${env.PORT}/api/v1`);
  });
}

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  logger.info(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await disconnectDatabase();
    logger.info('Database connection closed.');
    process.exit(0);
  });
  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error('[UnhandledRejection]', { reason });
});
process.on('uncaughtException', (err) => {
  logger.error('[UncaughtException]', { err });
  process.exit(1);
});

start();
