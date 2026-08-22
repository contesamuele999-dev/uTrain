import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { authMiddleware } from './middleware/auth';
import authRoutes from './routes/auth';
import routinesRoutes from './routes/routines';
import workoutsRoutes from './routes/workouts';
import exercisesRoutes from './routes/exercises';
import prsRoutes from './routes/prs';
import settingsRoutes from './routes/settings';
import syncRoutes from './routes/sync';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/utrain';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

let isDatabaseConnected = false;

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log(`[MongoDB] Connessione in corso a: ${MONGODB_URI.replace(/:([^:@]{3,})@/, ':****@')}...`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isDatabaseConnected = true;
    console.log('✅ [MongoDB] Database uTrain connesso con successo!');
  } catch (err: unknown) {
    isDatabaseConnected = false;
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️ [MongoDB] Impossibile connettersi a MongoDB (${msg}).`);
    console.warn('ℹ️ [MongoDB] uTrain funzionerà in modalità offline (cache locale). Per connettere MongoDB Atlas, imposta MONGODB_URI nel file .env');
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  isDatabaseConnected = true;
});
mongoose.connection.on('disconnected', () => {
  isDatabaseConnected = false;
});
mongoose.connection.on('error', (err) => {
  isDatabaseConnected = false;
  console.error('[MongoDB] Errore di connessione:', err.message);
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    database: isDatabaseConnected ? 'connected' : 'disconnected',
    databaseUri: MONGODB_URI.startsWith('mongodb+srv://') ? 'MongoDB Atlas (Cloud)' : 'MongoDB Locale (127.0.0.1)',
    serverTime: new Date().toISOString(),
  });
});

// Register API routes with authMiddleware
app.use('/api/auth', authRoutes);
app.use('/api/routines', authMiddleware, routinesRoutes);
app.use('/api/workouts', authMiddleware, workoutsRoutes);
app.use('/api/exercises', authMiddleware, exercisesRoutes);
app.use('/api/prs', authMiddleware, prsRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/sync', authMiddleware, syncRoutes);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 [Server uTrain] API Server in esecuzione su http://localhost:${PORT}`);
  await connectDB();
});
