import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
console.log('CORS Origin configured:', corsOrigin);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: corsOrigin.includes(',') ? corsOrigin.split(',') : corsOrigin as string,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Simple ping endpoint (no DB required)
app.get('/', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
