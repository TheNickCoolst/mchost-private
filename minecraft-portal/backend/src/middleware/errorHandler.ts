import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/AuditService';
import { AuditAction, AuditSeverity } from '../models/AuditLog';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(`${service} is currently unavailable`, 503);
  }
}

interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  requestId?: string;
  stack?: string;
  details?: any;
}

// Centralized error handler middleware
export const errorHandler = async (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  // Convert non-AppError errors to AppError
  if (!(error instanceof AppError)) {
    const statusCode = (error as any).statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new AppError(message, statusCode, false);
  }

  const appError = error as AppError;
  const statusCode = appError.statusCode || 500;

  // Log error for monitoring
  if (statusCode >= 500) {
    console.error('ERROR:', {
      message: appError.message,
      stack: appError.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      user: (req as any).user?.id
    });

    // Log critical errors to audit system
    try {
      await auditService.log({
        action: AuditAction.SECURITY_VIOLATION,
        severity: AuditSeverity.CRITICAL,
        userId: (req as any).user?.id,
        description: `Server error: ${appError.message}`,
        metadata: {
          statusCode,
          stack: appError.stack,
          url: req.originalUrl,
          method: req.method
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    } catch (auditError) {
      console.error('Failed to log error to audit system:', auditError);
    }
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    error: getErrorName(statusCode),
    message: appError.message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    requestId: (req as any).id
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = appError.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError('Route');
  next(error);
};

// Async error wrapper to catch async errors
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Get error name from status code
function getErrorName(statusCode: number): string {
  const errorNames: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };

  return errorNames[statusCode] || 'Error';
}

// Error logger middleware
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${req.method} ${req.originalUrl} - ${err.message}`;

  if (err instanceof AppError && err.statusCode >= 500) {
    console.error(logMessage);
    console.error(err.stack);
  } else {
    console.warn(logMessage);
  }

  next(err);
};

// Unhandled rejection handler
export const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error('Reason:', reason);

    // Log to audit system
    auditService.log({
      action: AuditAction.SECURITY_VIOLATION,
      severity: AuditSeverity.CRITICAL,
      description: `Unhandled Promise Rejection: ${reason}`,
      metadata: { reason: String(reason) }
    }).catch(console.error);

    // Give time to log, then exit
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
};

// Uncaught exception handler
export const handleUncaughtException = () => {
  process.on('uncaughtException', (error: Error) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error('Error:', error);

    // Log to audit system
    auditService.log({
      action: AuditAction.SECURITY_VIOLATION,
      severity: AuditSeverity.CRITICAL,
      description: `Uncaught Exception: ${error.message}`,
      metadata: { stack: error.stack }
    }).catch(console.error);

    // Give time to log, then exit
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
};
