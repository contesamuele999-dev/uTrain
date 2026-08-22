import { Router, Response } from 'express';
import { RoutineModel } from '../models/Routine';
import { WorkoutSessionModel } from '../models/WorkoutSession';
import { ExerciseModel } from '../models/Exercise';
import { PersonalRecordModel } from '../models/PersonalRecord';
import { UserSettingsModel } from '../models/UserSettings';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET all data for current user in one payload
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId || 'default_user';

    const [routines, workouts, exercises, prs, settings] = await Promise.all([
      RoutineModel.find({ userId }),
      WorkoutSessionModel.find({ userId }).sort({ startTime: -1 }),
      ExerciseModel.find({ $or: [{ userId }, { userId: { $exists: false } }] }),
      PersonalRecordModel.find({ userId }),
      UserSettingsModel.findOne({ userId }),
    ]);

    res.json({
      routines,
      workouts,
      exercises,
      prs,
      settings,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error during full sync pull:', err);
    res.status(500).json({ error: 'Errore durante il download dei dati di sincronizzazione' });
  }
});

// POST bulk sync upload from local storage to MongoDB
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId || 'default_user';
    const { routines, workouts, exercises, prs, settings } = req.body;

    const operations: Promise<unknown>[] = [];

    // Sync Routines
    if (Array.isArray(routines)) {
      for (const r of routines) {
        if (r.id) {
          operations.push(
            RoutineModel.findOneAndUpdate(
              { userId, id: r.id },
              { ...r, userId },
              { upsert: true, new: true }
            )
          );
        }
      }
    }

    // Sync Workouts
    if (Array.isArray(workouts)) {
      for (const w of workouts) {
        if (w.id) {
          operations.push(
            WorkoutSessionModel.findOneAndUpdate(
              { userId, id: w.id },
              { ...w, userId },
              { upsert: true, new: true }
            )
          );
        }
      }
    }

    // Sync Custom Exercises
    if (Array.isArray(exercises)) {
      for (const ex of exercises) {
        if (ex.isCustom && ex.id) {
          operations.push(
            ExerciseModel.findOneAndUpdate(
              { userId, id: ex.id },
              { ...ex, userId },
              { upsert: true, new: true }
            )
          );
        }
      }
    }

    // Sync PRs
    if (Array.isArray(prs)) {
      for (const p of prs) {
        if (p.exerciseId) {
          operations.push(
            PersonalRecordModel.findOneAndUpdate(
              { userId, exerciseId: p.exerciseId },
              { ...p, userId },
              { upsert: true, new: true }
            )
          );
        }
      }
    }

    // Sync Settings
    if (settings) {
      operations.push(
        UserSettingsModel.findOneAndUpdate(
          { userId },
          { ...settings, userId },
          { upsert: true, new: true }
        )
      );
    }

    await Promise.all(operations);

    res.json({
      success: true,
      message: 'Sincronizzazione completata con successo su MongoDB',
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error during full sync push:', err);
    res.status(500).json({ error: 'Errore durante il caricamento dei dati di sincronizzazione' });
  }
});

export default router;
