// Database operation retry logic with exponential backoff
import { serverLogger } from './logger';
import { dbMonitor } from './db-monitor';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: Error) => boolean;
}

export class DatabaseRetryError extends Error {
  constructor(
    message: string,
    public readonly originalError: Error,
    public readonly attemptCount: number
  ) {
    super(message);
    this.name = 'DatabaseRetryError';
  }
}

/**
 * Retry database operations with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = (error) => isRetryableError(error)
  } = options;

  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const startTime = Date.now();
      const result = await operation();
      const queryTime = Date.now() - startTime;
      
      if (attempt > 1) {
        serverLogger.info(`Database operation succeeded after retry: ${operationName}`, {
          operationName,
          attemptNumber: attempt,
          queryTime: `${queryTime}ms`,
          success: true
        });
      }
      
      dbMonitor.recordQuery(queryTime);
      return result;
      
    } catch (error) {
      lastError = error as Error;
      
      serverLogger.warn(`Database operation failed (attempt ${attempt}): ${operationName}`, {
        operationName,
        attemptNumber: attempt,
        errorMessage: lastError.message,
        errorType: lastError.constructor.name,
        willRetry: attempt <= maxRetries && retryCondition(lastError)
      });
      
      dbMonitor.recordError();
      
      // If this is the last attempt or error is not retryable, throw
      if (attempt > maxRetries || !retryCondition(lastError)) {
        throw new DatabaseRetryError(
          `Database operation failed after ${attempt} attempts: ${operationName}`,
          lastError,
          attempt
        );
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );
      
      serverLogger.info(`Retrying database operation: ${operationName}`, {
        operationName,
        attemptNumber: attempt,
        nextAttemptIn: `${delay}ms`,
        maxRetries
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached, but TypeScript requires it
  throw new DatabaseRetryError(
    `Database operation failed after ${maxRetries + 1} attempts: ${operationName}`,
    lastError!,
    maxRetries + 1
  );
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: Error): boolean {
  const errorMessage = error.message.toLowerCase();
  
  // Common retryable database errors
  const retryableErrorPatterns = [
    'connection',
    'timeout',
    'network',
    'server_error',
    'temporary',
    'unavailable',
    'busy',
    'locked',
    'deadlock'
  ];
  
  return retryableErrorPatterns.some(pattern => 
    errorMessage.includes(pattern)
  );
}

/**
 * Wrapper that combines retry logic with monitoring
 */
export async function withRetryAndMonitoring<T>(
  operation: () => Promise<T>,
  operationName: string,
  retryOptions: RetryOptions = {}
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await withRetry(operation, operationName, retryOptions);
    
    const totalTime = Date.now() - startTime;
    serverLogger.info(`Database operation completed with retry: ${operationName}`, {
      operationName,
      totalTime: `${totalTime}ms`,
      success: true
    });
    
    return result;
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    
    if (error instanceof DatabaseRetryError) {
      serverLogger.error(`Database operation failed after retries: ${operationName}`, error.originalError, {
        operationName,
        totalTime: `${totalTime}ms`,
        attemptCount: error.attemptCount,
        success: false
      });
    } else {
      serverLogger.error(`Database operation failed: ${operationName}`, error as Error, {
        operationName,
        totalTime: `${totalTime}ms`,
        success: false
      });
    }
    
    throw error;
  }
}

// Pre-configured retry options for common scenarios
export const retryOptions = {
  // Standard retry for most database operations
  standard: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffFactor: 2
  },
  
  // Quick retry for fast operations
  quick: {
    maxRetries: 2,
    baseDelay: 500,
    maxDelay: 2000,
    backoffFactor: 2
  },
  
  // Patient retry for critical operations
  patient: {
    maxRetries: 5,
    baseDelay: 2000,
    maxDelay: 15000,
    backoffFactor: 1.5
  }
} as const;