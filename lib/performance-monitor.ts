import { logger } from './logger';

export interface PerformanceMetrics {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: any;
  additionalData?: Record<string, any>;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    if (typeof window === 'undefined') return;

    try {
      // Navigation timing observer
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            logger.info('Navigation performance', {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
              domInteractive: navEntry.domInteractive - navEntry.navigationStart,
              firstPaint: navEntry.fetchStart - navEntry.navigationStart
            });
          }
        });
      });

      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);

      // Resource timing observer
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            
            // Log slow resources
            if (resourceEntry.duration > 1000) {
              logger.warn('Slow resource load detected', {
                name: resourceEntry.name,
                duration: `${resourceEntry.duration.toFixed(2)}ms`,
                size: resourceEntry.transferSize,
                type: resourceEntry.initiatorType
              });
            }
            
            // Track image loading specifically
            if (resourceEntry.name.includes('uploadthing') || resourceEntry.name.includes('image')) {
              logger.debug('Image resource loaded', {
                name: resourceEntry.name,
                duration: `${resourceEntry.duration.toFixed(2)}ms`,
                size: resourceEntry.transferSize
              });
            }
          }
        });
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // Paint timing observer
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'paint') {
            logger.info(`Paint timing: ${entry.name}`, {
              time: `${entry.startTime.toFixed(2)}ms`
            });
          }
        });
      });

      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);

      // Largest contentful paint observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          logger.info('Largest Contentful Paint', {
            time: `${entry.startTime.toFixed(2)}ms`,
            size: (entry as any).size,
            element: (entry as any).element?.tagName
          });
        });
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

    } catch (error) {
      logger.warn('Performance observers not supported', { error: (error as Error).message });
    }
  }

  startTimer(operationId: string, operation: string, additionalData?: Record<string, any>): void {
    const startTime = performance.now();
    const memoryUsage = (performance as any).memory ? {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
    } : undefined;

    this.metrics.set(operationId, {
      operation,
      startTime,
      memoryUsage,
      additionalData
    });

    logger.debug(`Performance timer started: ${operation}`, {
      operationId,
      memoryUsage,
      ...additionalData
    });
  }

  endTimer(operationId: string, additionalData?: Record<string, any>): number | null {
    const metric = this.metrics.get(operationId);
    if (!metric) {
      logger.warn(`No performance timer found for operation: ${operationId}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    const endMemoryUsage = (performance as any).memory ? {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
    } : undefined;

    const memoryDelta = endMemoryUsage && metric.memoryUsage ? {
      usedJSHeapDelta: endMemoryUsage.usedJSHeapSize - metric.memoryUsage.usedJSHeapSize,
      totalJSHeapDelta: endMemoryUsage.totalJSHeapSize - metric.memoryUsage.totalJSHeapSize
    } : undefined;

    logger.info(`Performance timer completed: ${metric.operation}`, {
      operationId,
      duration: `${duration.toFixed(2)}ms`,
      memoryDelta,
      ...metric.additionalData,
      ...additionalData
    });

    // Clean up
    this.metrics.delete(operationId);
    return duration;
  }

  measureUserInteraction(interaction: string, callback: () => void | Promise<void>): void {
    const operationId = `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.startTimer(operationId, `User interaction: ${interaction}`);
    
    const startTime = performance.now();
    
    Promise.resolve(callback()).then(() => {
      const duration = this.endTimer(operationId);
      
      // Log slow interactions
      if (duration && duration > 100) {
        logger.warn('Slow user interaction detected', {
          interaction,
          duration: `${duration.toFixed(2)}ms`
        });
      }
    }).catch(error => {
      this.endTimer(operationId, { error: error.message });
      logger.error('User interaction failed', error, { interaction });
    });
  }

  measureAPICall(url: string, method: string, callback: () => Promise<any>): Promise<any> {
    const operationId = `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.startTimer(operationId, `API call: ${method} ${url}`, { url, method });
    
    const startTime = performance.now();
    
    return callback().then(result => {
      const duration = this.endTimer(operationId, { success: true });
      
      // Log slow API calls
      if (duration && duration > 2000) {
        logger.warn('Slow API call detected', {
          url,
          method,
          duration: `${duration.toFixed(2)}ms`
        });
      }
      
      return result;
    }).catch(error => {
      this.endTimer(operationId, { success: false, error: error.message });
      logger.error('API call failed', error, { url, method });
      throw error;
    });
  }

  trackImageLoad(imageUrl: string, img: HTMLImageElement): void {
    const operationId = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.startTimer(operationId, `Image load: ${imageUrl}`, { imageUrl });
    
    const onLoad = () => {
      const duration = this.endTimer(operationId, { 
        success: true, 
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      });
      
      // Log slow image loads
      if (duration && duration > 3000) {
        logger.warn('Slow image load detected', {
          imageUrl,
          duration: `${duration.toFixed(2)}ms`,
          size: `${img.naturalWidth}x${img.naturalHeight}`
        });
      }
      
      cleanup();
    };
    
    const onError = () => {
      this.endTimer(operationId, { success: false });
      logger.error('Image load failed', new Error('Image load failed'), { imageUrl });
      cleanup();
    };
    
    const cleanup = () => {
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
    };
    
    img.addEventListener('load', onLoad);
    img.addEventListener('error', onError);
  }

  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Global instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Convenience functions
export function measureOperation<T>(
  operation: string, 
  callback: () => T | Promise<T>,
  additionalData?: Record<string, any>
): T | Promise<T> {
  const operationId = `operation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  performanceMonitor.startTimer(operationId, operation, additionalData);
  
  try {
    const result = callback();
    
    if (result instanceof Promise) {
      return result.then(value => {
        performanceMonitor.endTimer(operationId, { success: true });
        return value;
      }).catch(error => {
        performanceMonitor.endTimer(operationId, { success: false, error: error.message });
        throw error;
      });
    } else {
      performanceMonitor.endTimer(operationId, { success: true });
      return result;
    }
  } catch (error) {
    performanceMonitor.endTimer(operationId, { success: false, error: (error as Error).message });
    throw error;
  }
}

export function measureUserInteraction(interaction: string, callback: () => void | Promise<void>): void {
  performanceMonitor.measureUserInteraction(interaction, callback);
}

export function measureAPICall(url: string, method: string, callback: () => Promise<any>): Promise<any> {
  return performanceMonitor.measureAPICall(url, method, callback);
}