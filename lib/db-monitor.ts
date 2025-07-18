// Database connection health monitoring and metrics
import { db, files } from './db';
import { serverLogger } from './logger';
import { sql } from 'drizzle-orm';

export interface DatabaseMetrics {
  isHealthy: boolean;
  latency: number;
  connectionCount: number;
  lastHealthCheck: Date;
  errorCount: number;
  queryCount: number;
  slowQueryCount: number;
}

export class DatabaseMonitor {
  private static instance: DatabaseMonitor;
  private metrics: DatabaseMetrics;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private queryCount = 0;
  private errorCount = 0;
  private slowQueryCount = 0;

  private constructor() {
    this.metrics = {
      isHealthy: true,
      latency: 0,
      connectionCount: 0,
      lastHealthCheck: new Date(),
      errorCount: 0,
      queryCount: 0,
      slowQueryCount: 0
    };
  }

  static getInstance(): DatabaseMonitor {
    if (!DatabaseMonitor.instance) {
      DatabaseMonitor.instance = new DatabaseMonitor();
    }
    return DatabaseMonitor.instance;
  }

  /**
   * Perform a health check on the database connection
   */
  async healthCheck(): Promise<DatabaseMetrics> {
    const startTime = Date.now();
    
    try {
      // Simple query to test connection
      await db.select().from(files).limit(1);
      
      const latency = Date.now() - startTime;
      
      this.metrics = {
        ...this.metrics,
        isHealthy: true,
        latency,
        lastHealthCheck: new Date(),
        queryCount: this.queryCount,
        errorCount: this.errorCount,
        slowQueryCount: this.slowQueryCount
      };

      serverLogger.info('Database health check completed', {
        isHealthy: true,
        latency: `${latency}ms`,
        queryCount: this.queryCount,
        errorCount: this.errorCount,
        slowQueryCount: this.slowQueryCount
      });

    } catch (error) {
      this.errorCount++;
      this.metrics = {
        ...this.metrics,
        isHealthy: false,
        lastHealthCheck: new Date(),
        errorCount: this.errorCount
      };

      serverLogger.error('Database health check failed', error as Error, {
        isHealthy: false,
        errorCount: this.errorCount,
        totalQueries: this.queryCount
      });
    }

    return this.metrics;
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks(intervalMs: number = 60000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.healthCheck();
    }, intervalMs);

    serverLogger.info('Database health monitoring started', {
      intervalMs,
      checkFrequency: `${intervalMs / 1000}s`
    });
  }

  /**
   * Stop periodic health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      
      serverLogger.info('Database health monitoring stopped');
    }
  }

  /**
   * Record a database query execution
   */
  recordQuery(queryTime: number): void {
    this.queryCount++;
    
    // Track slow queries (> 1000ms)
    if (queryTime > 1000) {
      this.slowQueryCount++;
    }
  }

  /**
   * Record a database error
   */
  recordError(): void {
    this.errorCount++;
  }

  /**
   * Get current database metrics
   */
  getMetrics(): DatabaseMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset counters (useful for testing or periodic resets)
   */
  resetCounters(): void {
    this.queryCount = 0;
    this.errorCount = 0;
    this.slowQueryCount = 0;
    
    serverLogger.info('Database metrics counters reset');
  }

  /**
   * Get database connection status as a simple boolean
   */
  async isHealthy(): Promise<boolean> {
    const metrics = await this.healthCheck();
    return metrics.isHealthy;
  }
}

// Export singleton instance
export const dbMonitor = DatabaseMonitor.getInstance();

// Wrapper function for monitoring database operations
export async function withDatabaseMonitoring<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const queryTime = Date.now() - startTime;
    
    dbMonitor.recordQuery(queryTime);
    
    serverLogger.info(`Database operation completed: ${operationName}`, {
      operationName,
      queryTime: `${queryTime}ms`,
      success: true
    });
    
    return result;
  } catch (error) {
    const queryTime = Date.now() - startTime;
    dbMonitor.recordError();
    
    serverLogger.error(`Database operation failed: ${operationName}`, error as Error, {
      operationName,
      queryTime: `${queryTime}ms`,
      success: false
    });
    
    throw error;
  }
}