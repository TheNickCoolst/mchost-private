import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';

const router = Router();

// Enhanced error handling wrapper
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Standardized response helpers
const sendSuccess = (res: Response, data: any, message?: string, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const sendError = (res: Response, message: string, statusCode = 400, errors?: any) => {
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(errors && { errors })
  });
};

// Check if initial setup is required
router.get('/setup-status', asyncHandler(async (req: Request, res: Response) => {
  const userRepository = AppDataSource.getRepository(User);
  const userCount = await userRepository.count();

  sendSuccess(res, {
    setupRequired: userCount === 0,
    message: userCount === 0
      ? 'Erstelle deinen Admin-Account um zu beginnen'
      : 'System bereits eingerichtet'
  });
}));

// Enhanced validation schemas with better messages
const loginSchema = Joi.object({
  emailOrUsername: Joi.string()
    .required()
    .min(3)
    .messages({
      'string.empty': 'Benutzername oder E-Mail ist erforderlich',
      'string.min': 'Benutzername muss mindestens 3 Zeichen haben',
      'any.required': 'Benutzername oder E-Mail ist erforderlich'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'Passwort ist erforderlich',
      'string.min': 'Passwort muss mindestens 6 Zeichen haben',
      'any.required': 'Passwort ist erforderlich'
    })
});

const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Benutzername darf nur Buchstaben und Zahlen enthalten',
      'string.min': 'Benutzername muss mindestens 3 Zeichen haben',
      'string.max': 'Benutzername darf maximal 30 Zeichen haben',
      'any.required': 'Benutzername ist erforderlich'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Ungültige E-Mail-Adresse',
      'any.required': 'E-Mail ist erforderlich'
    }),
  password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      'string.min': 'Passwort muss mindestens 6 Zeichen haben',
      'string.max': 'Passwort ist zu lang',
      'any.required': 'Passwort ist erforderlich'
    })
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

// Validate JWT secrets
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  console.warn('⚠️  WARNING: JWT secrets not set! Using fallback (INSECURE for production)');
}

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId },
    JWT_SECRET || 'fallback-secret-CHANGE-IN-PRODUCTION',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    JWT_REFRESH_SECRET || 'fallback-refresh-secret-CHANGE-IN-PRODUCTION',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Helper to set secure cookies
const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const isHttps = process.env.HTTPS_ONLY === 'true';

  if (isHttps) {
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'strict' as const,
    };

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }
};

router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  // Validate request
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return sendError(res, error.details[0].message, 400);
  }

  const { emailOrUsername, password } = req.body;
  const userRepository = AppDataSource.getRepository(User);

  // Determine if input is email or username
  const isEmail = emailOrUsername.includes('@');
  const user = await userRepository.findOne({
    where: isEmail
      ? { email: emailOrUsername.toLowerCase().trim() }
      : { username: emailOrUsername.trim() }
  });

  // Use consistent error message for security
  if (!user) {
    return sendError(res, 'Ungültige Anmeldedaten', 401);
  }

  if (!user.isActive) {
    return sendError(res, 'Account ist deaktiviert. Kontaktiere den Administrator.', 403);
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return sendError(res, 'Ungültige Anmeldedaten', 401);
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  // Set secure cookies
  setAuthCookies(res, accessToken, refreshToken);

  // Update last login
  user.lastLogin = new Date();
  await userRepository.save(user);

  const isHttps = process.env.HTTPS_ONLY === 'true';

  sendSuccess(res, {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    ...((!isHttps) && { accessToken, refreshToken })
  }, 'Login erfolgreich');
}));

// Initial setup registration - first user becomes admin
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  // Validate request
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return sendError(res, error.details[0].message, 400);
  }

  const { username, email, password } = req.body;
  const userRepository = AppDataSource.getRepository(User);

  // Check if any users exist
  const userCount = await userRepository.count();

  // Only allow registration if no users exist (initial setup)
  if (userCount > 0) {
    return sendError(res, 'Registrierung deaktiviert. Das System wurde bereits eingerichtet.', 403);
  }

  // Check if username or email already exists
  const existingUser = await userRepository.findOne({
    where: [
      { username: username.trim() },
      { email: email.toLowerCase().trim() }
    ]
  });

  if (existingUser) {
    if (existingUser.username === username) {
      return sendError(res, 'Dieser Benutzername ist bereits vergeben', 409);
    }
    return sendError(res, 'Diese E-Mail-Adresse ist bereits registriert', 409);
  }

  // Hash password with appropriate cost factor
  const passwordHash = await bcrypt.hash(password, 12);

  // Create first user as admin
  const user = userRepository.create({
    username: username.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role: UserRole.ADMIN, // First user is always admin
    isActive: true,
    lastLogin: new Date()
  });

  await userRepository.save(user);

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  // Set secure cookies
  setAuthCookies(res, accessToken, refreshToken);

  const isHttps = process.env.HTTPS_ONLY === 'true';

  console.log(`✅ Admin account created: ${user.username} (${user.email})`);

  sendSuccess(res, {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    ...((!isHttps) && { accessToken, refreshToken })
  }, '🎉 Admin-Account erfolgreich erstellt!', 201);
}));

router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { error } = refreshSchema.validate(req.body);
  if (error) {
    return sendError(res, error.details[0].message, 400);
  }

  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(
      refreshToken,
      JWT_REFRESH_SECRET || 'fallback-refresh-secret-CHANGE-IN-PRODUCTION'
    ) as { userId: string; type: string };

    if (decoded.type !== 'refresh') {
      return sendError(res, 'Ungültiger Token-Typ', 401);
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.userId } });

    if (!user) {
      return sendError(res, 'Benutzer nicht gefunden', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Account ist deaktiviert', 403);
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

    // Set secure cookies
    setAuthCookies(res, accessToken, newRefreshToken);

    const isHttps = process.env.HTTPS_ONLY === 'true';

    sendSuccess(res, {
      ...((!isHttps) && { accessToken, refreshToken: newRefreshToken })
    }, 'Token erfolgreich erneuert');
  } catch (error) {
    console.error('Token refresh error:', error);
    return sendError(res, 'Ungültiger oder abgelaufener Refresh-Token', 401);
  }
}));

router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  // Clear HTTP-only cookies
  const isHttps = process.env.HTTPS_ONLY === 'true';
  if (isHttps) {
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'strict' as const
    };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
  }

  sendSuccess(res, null, 'Erfolgreich abgemeldet');
}));

export default router;