import 'dotenv/config';
import app from './app';
import prisma from './config/database';

// Catch all uncaught errors
process.on('uncaughtException', (error) => {
  console.error('=== UNCAUGHT EXCEPTION ===');
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('=== UNHANDLED REJECTION ===');
  console.error('Reason:', reason);
  process.exit(1);
});

const PORT = parseInt(process.env.PORT || '3001', 10);

console.log('=== Server Startup ===');
console.log('Time:', new Date().toISOString());
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  // Show partial URL for debugging (hide password)
  const url = process.env.DATABASE_URL;
  const masked = url.replace(/:([^:@]+)@/, ':****@');
  console.log('DATABASE_URL (masked):', masked);
}

async function main() {
  try {
    console.log('Step 1: Connecting to database...');
    await prisma.$connect();
    console.log('Step 2: Database connected successfully');

    console.log('Step 3: Starting HTTP server...');
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('=== Server Started Successfully ===');
      console.log(`Port: ${PORT}`);
      console.log('Health check: /api/health');
    });

    server.on('error', (error) => {
      console.error('=== SERVER ERROR ===');
      console.error(error);
      process.exit(1);
    });
  } catch (error) {
    console.error('=== STARTUP ERROR ===');
    console.error(error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

main();
