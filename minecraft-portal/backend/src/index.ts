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
import authRoutes from './routes/auth';
import serverRoutes from './routes/servers';
import userRoutes from './routes/users';
import minecraftRoutes from './routes/minecraft';
import pluginRoutes from './routes/plugins';
import configRoutes from './routes/config';
import worldRoutes from './routes/worlds';
import playerRoutes from './routes/players';

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

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { error: 'Too many requests from this IP' },
  standardHeaders: true,
  legacyHeaders: false,
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
  max: 50, // limit each IP to 50 login attempts per windowMs
  message: { error: 'Too many authentication attempts from this IP' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // limit each IP to 200 API requests per minute
  message: { error: 'Too many API requests from this IP' },
  standardHeaders: true,
  legacyHeaders: false,
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
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:4000', 'http://31.220.85.204:3001', 'https://localhost'],
  credentials: true
}));
app.use(generalLimiter);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// API routes with specific rate limits
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/servers', apiLimiter, serverRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/minecraft', apiLimiter, minecraftRoutes);
app.use('/api/plugins', apiLimiter, pluginRoutes);
app.use('/api/config', apiLimiter, configRoutes);
app.use('/api/worlds', apiLimiter, worldRoutes);
app.use('/api/players', apiLimiter, playerRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve frontend app for all non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

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
  .then(() => {
    console.log('Database connected successfully');
    const server = httpServer.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      console.log(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close(() => {
        console.log('HTTP server closed');
        
        io.close(() => {
          console.log('Socket.io server closed');
          
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