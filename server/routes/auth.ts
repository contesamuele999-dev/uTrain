import { Router, Request, Response } from 'express';
import { UserModel } from '../models/User';
import crypto from 'crypto';

const router = Router();

const hashPassword = (password: string, salt: string): string => {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
};

const generateSalt = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

// Register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, password, experienceLevel = 'intermediate' } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, nome e password sono obbligatori' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await UserModel.findOne({ email: cleanEmail });

    if (existing) {
      res.status(409).json({ error: 'Un account con questa email esiste già' });
      return;
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const user = await UserModel.create({
      id: userId,
      email: cleanEmail,
      name: name.trim(),
      passwordHash,
      salt,
      experienceLevel,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`,
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        experienceLevel: user.experienceLevel,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Errore interno durante la registrazione' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email e password sono obbligatori' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: cleanEmail });

    if (!user) {
      res.status(401).json({ error: 'Credenziali non valide o utente non trovato' });
      return;
    }

    const computedHash = hashPassword(password, user.salt);
    if (computedHash !== user.passwordHash) {
      res.status(401).json({ error: 'Password non corretta' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        experienceLevel: user.experienceLevel,
        avatar: user.avatar,
        avatarColor: user.avatarColor,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Errore durante il login' });
  }
});

// List users (for fast switching or profile management)
router.get('/users', async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await UserModel.find({}, { id: 1, email: 1, name: 1, experienceLevel: 1, avatar: 1, avatarColor: 1, createdAt: 1 });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Errore nel recupero degli account' });
  }
});

export default router;
