import { Router, Response } from 'express';
import { UserSettingsModel } from '../models/UserSettings';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET user settings
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId || 'default_user';
    let settings = await UserSettingsModel.findOne({ userId });
    if (!settings) {
      settings = await UserSettingsModel.create({ userId });
    }
    res.json(settings);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Errore nel recupero delle impostazioni' });
  }
});

// PUT update settings
router.put('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId || 'default_user';
    const settingsData = req.body;

    const updated = await UserSettingsModel.findOneAndUpdate(
      { userId },
      { ...settingsData, userId },
      { upsert: true, new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Errore nel salvataggio delle impostazioni' });
  }
});

export default router;
