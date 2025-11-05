import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';

const router = Router();

// Check if initial setup is required
router.get('/setup-status', async (req, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const userCount = await userRepository.count();

    res.json({
      setupRequired: userCount === 0,
      message: userCount === 0
        ? 'Erstelle deinen Admin-Account um zu beginnen'
        : 'System bereits eingerichtet'
    });
  } catch (error) {
    console.error('Setup status check error:', error);
    res.status(500).json({ error: 'Interner Server-Fehler' });
  }
});

const loginSchema = Joi.object({
  emailOrUsername: Joi.string().required(),
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

router.post('/login', async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { emailOrUsername, password } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    // Check if the input is an email or username
    const isEmail = emailOrUsername.includes('@');
    const user = await userRepository.findOne({ 
      where: isEmail 
        ? { email: emailOrUsername } 
        : { username: emailOrUsername }
    });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    // Set secure HTTP-only cookies if HTTPS is enabled
    const isHttps = process.env.HTTPS_ONLY === 'true';
    if (isHttps) {
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      accessToken: isHttps ? undefined : accessToken,
      refreshToken: isHttps ? undefined : refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initial setup registration - first user becomes admin (Pterodactyl-style)
router.post('/register', async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { username, email, password } = req.body;
    const userRepository = AppDataSource.getRepository(User);

    // Check if any users exist
    const userCount = await userRepository.count();

    // Only allow registration if no users exist (initial setup)
    if (userCount > 0) {
      return res.status(403).json({
        error: 'Registrierung deaktiviert. Das System wurde bereits eingerichtet.'
      });
    }

    // Check if username or email already exists
    const existingUser = await userRepository.findOne({
      where: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Benutzername oder E-Mail bereits vergeben'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create first user as admin
    const user = userRepository.create({
      username,
      email,
      passwordHash,
      role: UserRole.ADMIN, // First user is always admin
      isActive: true
    });

    await userRepository.save(user);

    const { accessToken, refreshToken } = generateTokens(user.id);

    // Set secure HTTP-only cookies if HTTPS is enabled
    const isHttps = process.env.HTTPS_ONLY === 'true';
    if (isHttps) {
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      accessToken: isHttps ? undefined : accessToken,
      refreshToken: isHttps ? undefined : refreshToken,
      message: 'Admin-Account erfolgreich erstellt! 🎉'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Interner Server-Fehler' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { error } = refreshSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { refreshToken } = req.body;

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret'
    ) as { userId: string; type: string };

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.userId } });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

    // Set secure HTTP-only cookies if HTTPS is enabled
    const isHttps = process.env.HTTPS_ONLY === 'true';
    if (isHttps) {
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }

    res.json({
      accessToken: isHttps ? undefined : accessToken,
      refreshToken: isHttps ? undefined : newRefreshToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', (req, res) => {
  // Clear HTTP-only cookies
  const isHttps = process.env.HTTPS_ONLY === 'true';
  if (isHttps) {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict'
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict'
    });
  }
  
  res.json({ message: 'Logged out successfully' });
});

export default router;