// Comprehensive logging infrastructure for debugging and performance monitoring

export interface LogContext {
  userId?: string;
  sessionId?: string;
  fileId?: string;
  operation?: string;
  requestId?: string;
  timestamp?: number;
  [key: string]: any;
}

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  operation: string;
  context?: LogContext;
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development';
  private isDebugMode = process.env.DEBUG_MODE === 'true';
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();

  // Log levels
  private formatLog(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context) : '';
    return `[${timestamp}] [${level}] ${message} ${contextStr}`;
  }

  // Client-side logging
  debug(message: string, context?: LogContext): void {
    if (this.isDev || this.isDebugMode) {
      console.debug(this.formatLog('DEBUG', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatLog('INFO', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatLog('WARN', message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error ? { ...context, error: error.message, stack: error.stack } : context;
    console.error(this.formatLog('ERROR', message, errorContext));
  }

  // Performance monitoring
  startTimer(operationId: string, operation: string, context?: LogContext): void {
    const startTime = performance.now();
    this.performanceMetrics.set(operationId, {
      startTime,
      operation,
      context
    });
    this.debug(`Started ${operation}`, { operationId, startTime, ...context });
  }

  endTimer(operationId: string): number | null {
    const metric = this.performanceMetrics.get(operationId);
    if (!metric) {
      this.warn(`No timer found for operation: ${operationId}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    metric.endTime = endTime;
    metric.duration = duration;

    this.info(`Completed ${metric.operation}`, {
      operationId,
      duration: `${duration.toFixed(2)}ms`,
      ...metric.context
    });

    // Clean up
    this.performanceMetrics.delete(operationId);
    return duration;
  }

  // State change logging
  logStateChange(component: string, operation: string, before: any, after: any, context?: LogContext): void {
    this.debug(`State change in ${component}`, {
      operation,
      before: JSON.stringify(before),
      after: JSON.stringify(after),
      ...context
    });
  }

  // API operation logging
  logApiOperation(method: string, endpoint: string, status: number, duration: number, context?: LogContext): void {
    this.info(`API ${method} ${endpoint}`, {
      status,
      duration: `${duration.toFixed(2)}ms`,
      ...context
    });
  }

  // File operation logging
  logFileOperation(operation: string, fileId: string, fileName?: string, context?: LogContext): void {
    this.info(`File ${operation}`, {
      fileId,
      fileName,
      ...context
    });
  }

  // UI synchronization logging
  logUiSync(component: string, syncType: string, data: any, context?: LogContext): void {
    this.debug(`UI sync in ${component}`, {
      syncType,
      data: JSON.stringify(data),
      ...context
    });
  }

  // Memory usage logging
  logMemoryUsage(operation: string, context?: LogContext): void {
    if (typeof window === 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      this.info(`Memory usage after ${operation}`, {
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
        ...context
      });
    }
  }

  // Network request logging
  logNetworkRequest(url: string, method: string, startTime: number, endTime: number, status?: number, error?: Error): void {
    const duration = endTime - startTime;
    if (error) {
      this.error(`Network request failed: ${method} ${url}`, error, {
        duration: `${duration.toFixed(2)}ms`,
        status
      });
    } else {
      this.info(`Network request: ${method} ${url}`, {
        duration: `${duration.toFixed(2)}ms`,
        status
      });
    }
  }

  // Image loading logging
  logImageLoad(imageUrl: string, success: boolean, loadTime?: number, error?: Error): void {
    if (success) {
      this.debug(`Image loaded successfully`, {
        imageUrl,
        loadTime: loadTime ? `${loadTime.toFixed(2)}ms` : 'unknown'
      });
    } else {
      this.warn(`Image failed to load`, {
        imageUrl,
        error: error?.message
      });
    }
  }

  // Gallery performance logging
  logGalleryPerformance(totalImages: number, loadedImages: number, failedImages: number, totalTime: number): void {
    this.info(`Gallery performance`, {
      totalImages,
      loadedImages,
      failedImages,
      successRate: `${((loadedImages / totalImages) * 100).toFixed(1)}%`,
      totalTime: `${totalTime.toFixed(2)}ms`,
      averageLoadTime: `${(totalTime / loadedImages).toFixed(2)}ms`
    });
  }
}

// Server-side logging utilities
export class ServerLogger {
  private static instance: ServerLogger;
  private logStream: NodeJS.WritableStream | null = null;

  static getInstance(): ServerLogger {
    if (!ServerLogger.instance) {
      ServerLogger.instance = new ServerLogger();
    }
    return ServerLogger.instance;
  }

  private constructor() {
    // In production, you could initialize file streams here
    // For now, we'll just use console logging
  }

  log(level: string, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context
    };

    // Console output
    console.log(JSON.stringify(logEntry));

    // In production, you would write to log files here
    // if (this.logStream) {
    //   this.logStream.write(JSON.stringify(logEntry) + '\n');
    // }
  }

  info(message: string, context?: LogContext): void {
    this.log('INFO', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error ? { 
      ...context, 
      error: error.message, 
      stack: error.stack 
    } : context;
    this.log('ERROR', message, errorContext);
  }

  warn(message: string, context?: LogContext): void {
    this.log('WARN', message, context);
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_MODE === 'true') {
      this.log('DEBUG', message, context);
    }
  }
}

// Global logger instance
export const logger = new Logger();
export const serverLogger = ServerLogger.getInstance();

// Utility functions for common logging patterns
export function logApiRequest(req: Request, startTime: number) {
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  serverLogger.info('API Request', {
    method: req.method,
    url: req.url,
    duration: `${duration}ms`,
    userAgent: req.headers.get('user-agent'),
    contentType: req.headers.get('content-type')
  });
}

export function logApiError(req: Request, error: Error, statusCode: number) {
  serverLogger.error('API Error', error, {
    method: req.method,
    url: req.url,
    statusCode,
    userAgent: req.headers.get('user-agent')
  });
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}