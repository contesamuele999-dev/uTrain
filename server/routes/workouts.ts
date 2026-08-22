import { Router, Response } from 'express';
import { WorkoutSessionModel } from '../models/WorkoutSession';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET all sessions for current user
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId || 'default_user';
    const sessions = await WorkoutSessionModel.find({ userId }).sort({ startTime: -1 });
    res.json(sessions);
  } catch (err) {
    console.error('Error fetching workout sessions:', err);
    res.status(500).json({ error: 'Errore nel recupero degli allenamenti' });
  }
});

// POST save / create workout session
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId || 'default_user';
    const sessionData = req.body;

    if (!sessionData.id || !sessionData.startTime) {
      res.status(400).json({ error: 'ID e startTime sessione sono obbligatori' });
      return;
    }

    const saved = await WorkoutSessionModel.findOneAndUpdate(
      { userId, id: sessionData.id },
      { ...sessionData, userId },
      { upsert: true, new: true }
    );

    res.status(201).json(saved);
  } catch (err) {
    console.error('Error saving workout session:', err);
    res.status(500).json({ error: 'Errore nel salvataggio dell\'allenamento' });
  }
});

// DELETE workout session
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId || 'default_user';
    const { id } = req.params;
    await WorkoutSessionModel.deleteOne({ userId, id });
    res.json({ success: true, id });
  } catch (err) {
    console.error('Error deleting workout session:', err);
    res.status(500).json({ error: 'Errore nella cancellazione dell\'allenamento' });
  }
});

export default router;
