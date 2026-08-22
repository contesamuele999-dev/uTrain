import { Router, Response } from 'express';
import { ExerciseModel } from '../models/Exercise';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET all exercises for user
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId || 'default_user';
    const exercises = await ExerciseModel.find({
      $or: [{ userId }, { userId: { $exists: false } }],
    });
    res.json(exercises);
  } catch (err) {
    console.error('Error fetching exercises:', err);
    res.status(500).json({ error: 'Errore nel recupero degli esercizi' });
  }
});

// POST save / create custom exercise
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId || 'default_user';
    const exData = req.body;

    if (!exData.name || !exData.muscleGroup) {
      res.status(400).json({ error: 'Nome ed gruppo muscolare sono obbligatori' });
      return;
    }

    const exId = exData.id || `custom-ex-${Date.now()}`;
    const saved = await ExerciseModel.findOneAndUpdate(
      { userId, id: exId },
      { ...exData, id: exId, userId, isCustom: true },
      { upsert: true, new: true }
    );

    res.status(201).json(saved);
  } catch (err) {
    console.error('Error saving custom exercise:', err);
    res.status(500).json({ error: 'Errore nel salvataggio dell\'esercizio' });
  }
});

export default router;
