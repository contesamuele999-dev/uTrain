import { Router, Response } from 'express';
import { RoutineModel } from '../models/Routine';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET all routines for current user
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId || 'default_user';
    const routines = await RoutineModel.find({ userId });
    res.json(routines);
  } catch (err) {
    console.error('Error fetching routines:', err);
    res.status(500).json({ error: 'Errore nel recupero delle schede' });
  }
});

// POST save / create routine
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId || 'default_user';
    const routineData = req.body;

    if (!routineData.id || !routineData.title) {
      res.status(400).json({ error: 'ID e titolo scheda sono obbligatori' });
      return;
    }

    const saved = await RoutineModel.findOneAndUpdate(
      { userId, id: routineData.id },
      { ...routineData, userId },
      { upsert: true, new: true }
    );

    res.status(201).json(saved);
  } catch (err) {
    console.error('Error saving routine:', err);
    res.status(500).json({ error: 'Errore nel salvataggio della scheda' });
  }
});

// DELETE routine
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId || 'default_user';
    const { id } = req.params;
    await RoutineModel.deleteOne({ userId, id });
    res.json({ success: true, id });
  } catch (err) {
    console.error('Error deleting routine:', err);
    res.status(500).json({ error: 'Errore nella cancellazione della scheda' });
  }
});

export default router;
