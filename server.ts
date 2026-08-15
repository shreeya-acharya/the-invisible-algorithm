import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import { DbService } from './server/dbService';

// Custom interface for extending Express Request
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    created_at: string;
  };
  token?: string;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Core Security Middlewares
  app.use(cors({
    origin: '*', // Allow connections from all origins (important for browser extensions)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(express.json());

  // 2. Rate Limiting to prevent brute force
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP, please try again later.' }
  });

  // Apply rate limiting to auth routes
  app.use('/api/signup', apiLimiter);
  app.use('/api/login', apiLimiter);
  app.use('/api/forgot-password', apiLimiter);

  // 3. User Authentication Middleware
  const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or malformed Authorization header. Use Bearer <token>.' });
      }

      const token = authHeader.split(' ')[1];
      const user = await DbService.verifyToken(token);
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid or expired session token.' });
      }

      req.user = user;
      req.token = token;
      next();
    } catch (err: any) {
      console.error('Auth middleware error:', err);
      res.status(500).json({ error: 'Internal security error during validation.' });
    }
  };

  // 4. REST API ROUTES

  // Health check route
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // POST /signup
  app.post('/api/signup', async (req: Request, res: Response) => {
    try {
      const { email, fullName, password } = req.body;
      if (!email || !fullName || !password) {
        return res.status(400).json({ error: 'Email, Full Name, and Password are required.' });
      }

      const result = await DbService.signUp(email, fullName, password);
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json({
        message: 'Account created successfully.',
        user: result.user,
        token: result.token
      });
    } catch (err: any) {
      console.error('Signup error:', err);
      res.status(500).json({ error: 'An internal error occurred during registration.' });
    }
  });

  // POST /login
  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and Password are required.' });
      }

      const result = await DbService.login(email, password);
      if (result.error) {
        return res.status(401).json({ error: result.error });
      }

      res.json({
        message: 'Logged in successfully.',
        user: result.user,
        token: result.token
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'An internal error occurred during authentication.' });
    }
  });

  // POST /logout
  app.post('/api/logout', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.token) {
        await DbService.logout(req.token);
      }
      res.json({ message: 'Logged out successfully.' });
    } catch (err: any) {
      console.error('Logout error:', err);
      res.status(500).json({ error: 'An error occurred during logout.' });
    }
  });

  // POST /forgot-password
  app.post('/api/forgot-password', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
      }

      // In real Supabase, this sends a password reset email
      res.json({ message: 'If this email is registered, a password recovery link has been dispatched.' });
    } catch (err: any) {
      console.error('Forgot password error:', err);
      res.status(500).json({ error: 'An error occurred triggering password reset.' });
    }
  });

  // GET /me
  app.get('/api/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    res.json({ user: req.user });
  });

  // GET /dashboard
  app.get('/api/dashboard', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dashboardData = await DbService.getDashboardData(req.user!.id);
      res.json(dashboardData);
    } catch (err: any) {
      console.error('Get dashboard error:', err);
      res.status(500).json({ error: 'Failed to retrieve analytics dashboard data.' });
    }
  });

  // GET /sessions
  app.get('/api/sessions', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sessions = await DbService.getSessions(req.user!.id);
      res.json({ sessions });
    } catch (err: any) {
      console.error('Get sessions error:', err);
      res.status(500).json({ error: 'Failed to retrieve browsing sessions.' });
    }
  });

  // GET /achievements
  app.get('/api/achievements', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const achievements = await DbService.getAchievements(req.user!.id);
      res.json({ achievements });
    } catch (err: any) {
      console.error('Get achievements error:', err);
      res.status(500).json({ error: 'Failed to retrieve achievements.' });
    }
  });

  // GET /settings
  app.get('/api/settings', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const settings = await DbService.getSettings(req.user!.id);
      res.json({ settings });
    } catch (err: any) {
      console.error('Get settings error:', err);
      res.status(500).json({ error: 'Failed to retrieve user settings.' });
    }
  });

  // PUT /settings
  app.put('/api/settings', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { notifications, dark_mode, email_updates } = req.body;
      const updates = {
        ...(notifications !== undefined && { notifications }),
        ...(dark_mode !== undefined && { dark_mode }),
        ...(email_updates !== undefined && { email_updates })
      };

      const settings = await DbService.updateSettings(req.user!.id, updates);
      res.json({ message: 'Settings updated successfully.', settings });
    } catch (err: any) {
      console.error('Put settings error:', err);
      res.status(500).json({ error: 'Failed to update user settings.' });
    }
  });

  // 5. BROWSER CHROME EXTENSION SUPPORT ENDPOINTS

// POST /extension/reel
app.post('/api/extension/reel', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reel_url, username, caption, hashtags } = req.body;

    if (!reel_url) {
      return res.status(400).json({ error: 'Reel URL is required.' });
    }

    const success = await DbService.recordReel(
      req.user!.id,
      reel_url,
      username || null,
      caption || null,
      Array.isArray(hashtags) ? hashtags : []
    );

    if (!success) {
      return res.status(500).json({ error: 'Failed to store Reel data.' });
    }

    res.status(201).json({
      message: 'Reel data stored successfully.'
    });
  } catch (err: any) {
    console.error('Extension Reel error:', err);
    res.status(500).json({ error: 'Failed to process Reel data.' });
  }
});

  // POST /extension/session
  app.post('/api/extension/session', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { website, duration, diversity_score, reflection } = req.body;
      if (!website || duration === undefined) {
        return res.status(400).json({ error: 'Website address and duration are required.' });
      }

      const score = diversity_score !== undefined ? Number(diversity_score) : 70;
      const refl = reflection || 'Browsed feed.';

      const success = await DbService.recordExtensionActivity(
        req.user!.id,
        website,
        Number(duration),
        score,
        refl
      );

      if (!success) {
        return res.status(500).json({ error: 'Failed to record browsing summary.' });
      }

      res.status(201).json({ message: 'Extension session recorded successfully.' });
    } catch (err: any) {
      console.error('Extension session post error:', err);
      res.status(500).json({ error: 'Failed to process extension session summary.' });
    }
  });

  // POST /extension/reflection
  app.post('/api/extension/reflection', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { reflection, website } = req.body;
      if (!reflection) {
        return res.status(400).json({ error: 'Reflection text is required.' });
      }

      // Record extension activity with 0 duration for standalone reflections if needed
      const success = await DbService.recordExtensionActivity(
        req.user!.id,
        website || 'web-summary',
        0,
        70,
        reflection
      );

      if (!success) {
        return res.status(500).json({ error: 'Failed to store extension reflection.' });
      }

      res.status(201).json({ message: 'Extension reflection recorded successfully.' });
    } catch (err: any) {
      console.error('Extension reflection error:', err);
      res.status(500).json({ error: 'Failed to process extension reflection.' });
    }
  });

  // POST /extension/feed-score
  app.post('/api/extension/feed-score', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { diversity_score, website } = req.body;
      if (diversity_score === undefined) {
        return res.status(400).json({ error: 'Feed diversity score is required.' });
      }

      const success = await DbService.recordExtensionActivity(
        req.user!.id,
        website || 'feed-audit',
        0,
        Number(diversity_score),
        'Audit feed score recorded.'
      );

      if (!success) {
        return res.status(500).json({ error: 'Failed to save feed diversity score.' });
      }

      res.status(201).json({ message: 'Extension feed score recorded successfully.' });
    } catch (err: any) {
      console.error('Extension feed score error:', err);
      res.status(500).json({ error: 'Failed to process feed score.' });
    }
  });

  // 6. Integration of Vite Middleware and Static File Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer();
