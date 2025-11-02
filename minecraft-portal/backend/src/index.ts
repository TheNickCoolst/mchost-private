import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { AppDataSource } from './config/database';
import { cacheService } from './services/CacheService';
import { emailService } from './services/EmailService';
import { healthCheckService } from './services/HealthCheckService';
import { errorHandler, errorLogger, notFoundHandler, handleUnhandledRejection, handleUncaughtException } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import serverRoutes from './routes/servers';
import userRoutes from './routes/users';
import minecraftRoutes from './routes/minecraft';
import pluginRoutes from './routes/plugins';
import configRoutes from './routes/config';
import worldRoutes from './routes/worlds';
import playerRoutes from './routes/players';
import subscriptionRoutes from './routes/subscriptions';
import filesRoutes from './routes/files';
import templatesRoutes from './routes/templates';
import notificationsRoutes from './routes/notifications';
import webhooksRoutes from './routes/webhooks';
import healthRoutes from './routes/health';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ["https://localhost", "https://your-domain.com"]
      : ["http://localhost:5173", "http://localhost:4000", "https://localhost"],
    methods: ["GET", "POST"],
    credentials: true
  },
  // Socket.io performance optimizations
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6,
  allowEIO3: true
});

const PORT = process.env.PORT || 3000;

// Setup global error handlers
handleUnhandledRejection();
handleUncaughtException();

// Trust proxy for nginx - only trust first proxy
app.set('trust proxy', 1);

// Request tracking middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  healthCheckService.recordRequest();

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    healthCheckService.recordResponseTime(responseTime);

    if (res.statusCode >= 400) {
      healthCheckService.recordError();
    }
  });

  next();
});

// Custom key generator for rate limiting with proxy
const getClientIp = (req: any) => {
  return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
};

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { error: 'Too many requests from this IP' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  skip: (req) => req.path === '/health',
});

// HTTPS enforcement middleware
const httpsOnly = (req: any, res: any, next: any) => {
  if (process.env.HTTPS_ONLY === 'true' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 login attempts per windowMs (increased)
  message: { error: 'Too many authentication attempts from this IP' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 500, // limit each IP to 500 API requests per minute (increased)
  message: { error: 'Too many API requests from this IP' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
});

app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for frontend assets
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Apply HTTPS enforcement if enabled
if (process.env.HTTPS_ONLY === 'true') {
  app.use(httpsOnly);
}

// Enable compression for better performance
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://localhost', 'https://your-domain.com']
    : true, // Allow all origins in development
  credentials: true
}));
app.use(generalLimiter);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Health check routes (no rate limiting)
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// API routes with specific rate limits
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/servers', apiLimiter, serverRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/minecraft', apiLimiter, minecraftRoutes);
app.use('/api/plugins', apiLimiter, pluginRoutes);
app.use('/api/config', apiLimiter, configRoutes);
app.use('/api/worlds', apiLimiter, worldRoutes);
app.use('/api/players', apiLimiter, playerRoutes);
app.use('/api/subscriptions', apiLimiter, subscriptionRoutes);
app.use('/api/files', apiLimiter, filesRoutes);
app.use('/api/templates', apiLimiter, templatesRoutes);
app.use('/api/notifications', apiLimiter, notificationsRoutes);
app.use('/api/webhooks', apiLimiter, webhooksRoutes);

// Serve frontend app for all non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    next(); // Let error handler handle 404
  } else {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
});

// 404 handler for undefined API routes
app.use('/api/*', notFoundHandler);

// Error logging middleware
app.use(errorLogger);

// Error handler middleware (must be last)
app.use(errorHandler);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join user-specific room for notifications
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`Client ${socket.id} joined user-${userId}`);
  });

  socket.on('leave-user', (userId) => {
    socket.leave(`user-${userId}`);
    console.log(`Client ${socket.id} left user-${userId}`);
  });

  socket.on('join-server', (serverId) => {
    socket.join(`server-${serverId}`);
    console.log(`Client ${socket.id} joined server-${serverId}`);
  });

  socket.on('leave-server', (serverId) => {
    socket.leave(`server-${serverId}`);
    console.log(`Client ${socket.id} left server-${serverId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

AppDataSource.initialize()
  .then(async () => {
    console.log('Database connected successfully');

    // Initialize services
    await cacheService.initialize();
    await emailService.initialize();

    const server = httpServer.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      console.log(`Received ${signal}. Starting graceful shutdown...`);

      server.close(() => {
        console.log('HTTP server closed');

        io.close(async () => {
          console.log('Socket.io server closed');

          // Close services
          await cacheService.disconnect();

          AppDataSource.destroy().then(() => {
            console.log('Database connection closed');
            process.exit(0);
          }).catch((error) => {
            console.error('Error closing database connection:', error);
            process.exit(1);
          });
        });
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });

export { io };