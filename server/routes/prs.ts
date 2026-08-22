import { Router, Response } from 'express';
import { PersonalRecordModel } from '../models/PersonalRecord';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET all PRs
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId || 'default_user';
    const prs = await PersonalRecordModel.find({ userId });
    res.json(prs);
  } catch (err) {
    console.error('Error fetching PRs:', err);
    res.status(500).json({ error: 'Errore nel recupero dei record personali' });
  }
});

// POST save PR
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId || 'default_user';
    const prData = req.body;

    if (!prData.exerciseId || prData.weight === undefined) {
      res.status(400).json({ error: 'exerciseId e peso sono obbligatori' });
      return;
    }

    const saved = await PersonalRecordModel.findOneAndUpdate(
      { userId, exerciseId: prData.exerciseId },
      { ...prData, userId },
      { upsert: true, new: true }
    );

    res.status(201).json(saved);
  } catch (err) {
    console.error('Error saving PR:', err);
    res.status(500).json({ error: 'Errore nel salvataggio del record' });
  }
});

export default router;
