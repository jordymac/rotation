/**
 * Request instrumentation utilities
 * Provides correlation IDs, performance tracking, and standardized logging
 */

import { NextRequest } from 'next/server';

export interface RequestContext {
  requestId: string;
  startTime: number;
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Create request context with correlation ID
 */
export function createRequestContext(request: NextRequest): RequestContext {
  const requestId = request.headers.get('x-request-id') || generateRequestId();
  
  return {
    requestId,
    startTime: Date.now(),
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown'
  };
}

/**
 * Enhanced console logger with request context
 */
export class ContextLogger {
  constructor(private context: RequestContext, private prefix: string = '') {}

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const duration = Date.now() - this.context.startTime;
    return `[${level}] [${this.context.requestId}] [+${duration}ms] ${this.prefix ? `[${this.prefix}] ` : ''}${message}`;
  }

  log(message: string, ...args: any[]) {
    console.log(this.formatMessage('LOG', message), ...args);
  }

  info(message: string, ...args: any[]) {
    console.info(this.formatMessage('INFO', message), ...args);
  }

  warn(message: string, ...args: any[]) {
    console.warn(this.formatMessage('WARN', message), ...args);
  }

  error(message: string, ...args: any[]) {
    console.error(this.formatMessage('ERROR', message), ...args);
  }

  debug(message: string, ...args: any[]) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message), ...args);
    }
  }

  /**
   * Log performance timing
   */
  timing(operation: string, duration?: number) {
    const actualDuration = duration ?? (Date.now() - this.context.startTime);
    this.info(`${operation} completed in ${actualDuration}ms`);
  }

  /**
   * Log cache status
   */
  cache(operation: string, status: 'HIT' | 'MISS' | 'STALE', details?: any) {
    this.info(`Cache ${status}: ${operation}`, details);
  }

  /**
   * Create a child logger with additional prefix
   */
  child(prefix: string): ContextLogger {
    const childPrefix = this.prefix ? `${this.prefix}:${prefix}` : prefix;
    return new ContextLogger(this.context, childPrefix);
  }
}

/**
 * Performance tracker for operations
 */
export class PerformanceTracker {
  private operations: Map<string, number> = new Map();

  constructor(private logger: ContextLogger) {}

  /**
   * Start tracking an operation
   */
  start(operation: string): void {
    this.operations.set(operation, Date.now());
    this.logger.debug(`Started ${operation}`);
  }

  /**
   * End tracking an operation and log the duration
   */
  end(operation: string): number {
    const startTime = this.operations.get(operation);
    if (!startTime) {
      this.logger.warn(`No start time found for operation: ${operation}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.operations.delete(operation);
    this.logger.timing(operation, duration);
    
    return duration;
  }

  /**
   * Get current duration for an operation without ending it
   */
  getCurrentDuration(operation: string): number {
    const startTime = this.operations.get(operation);
    if (!startTime) {
      return 0;
    }
    return Date.now() - startTime;
  }

  /**
   * Get summary of all tracked operations
   */
  getSummary(): Record<string, number> {
    const summary: Record<string, number> = {};
    const now = Date.now();
    
    for (const [operation, startTime] of this.operations) {
      summary[operation] = now - startTime;
    }
    
    return summary;
  }
}

/**
 * Response headers helper
 */
export function addInstrumentationHeaders(
  response: Response,
  context: RequestContext,
  additionalHeaders: Record<string, string> = {}
): Response {
  const duration = Date.now() - context.startTime;
  
  response.headers.set('x-request-id', context.requestId);
  response.headers.set('x-response-time', `${duration}ms`);
  response.headers.set('x-timestamp', new Date().toISOString());
  
  // Add any additional headers
  for (const [key, value] of Object.entries(additionalHeaders)) {
    response.headers.set(key, value);
  }
  
  return response;
}

/**
 * API route wrapper for Next.js App Router
 * Calls handlers as (req, ctx, logger, tracker)
 */
export function withApiInstrumentation(
  handler: (request: NextRequest, ctx: any, logger: ContextLogger, tracker: PerformanceTracker) => Promise<Response>
) {
  return async (request: NextRequest, ctx: any): Promise<Response> => {
    const context = createRequestContext(request);
    const logger = new ContextLogger(context);
    const tracker = new PerformanceTracker(logger);
    
    // Log request ID prominently
    logger.info(`[${context.requestId}] ${context.method} ${request.nextUrl.pathname} started`);
    tracker.start('total_request');
    
    try {
      const response = await handler(request, ctx, logger, tracker);
      
      const duration = tracker.end('total_request');
      logger.info(`[${context.requestId}] Request completed in ${duration}ms with status ${response.status}`);
      
      return addInstrumentationHeaders(response, context);
    } catch (error) {
      const duration = tracker.end('total_request');
      logger.error(`[${context.requestId}] Request failed after ${duration}ms:`, error);
      
      // Create error response with instrumentation
      const errorResponse = new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          requestId: context.requestId 
        }),
        { 
          status: 500,
          headers: { 'content-type': 'application/json' }
        }
      );
      
      return addInstrumentationHeaders(errorResponse, context);
    }
  };
}

/**
 * Legacy wrapper for backward compatibility
 */
export function withInstrumentation<T extends any[]>(
  handler: (context: RequestContext, logger: ContextLogger, tracker: PerformanceTracker, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    const context = createRequestContext(request);
    const logger = new ContextLogger(context);
    const tracker = new PerformanceTracker(logger);
    
    logger.info(`${context.method} ${new URL(context.url).pathname} started`);
    tracker.start('total_request');
    
    try {
      const response = await handler(context, logger, tracker, ...args);
      
      const duration = tracker.end('total_request');
      logger.info(`Request completed in ${duration}ms with status ${response.status}`);
      
      return addInstrumentationHeaders(response, context);
    } catch (error) {
      const duration = tracker.end('total_request');
      logger.error(`Request failed after ${duration}ms:`, error);
      
      // Create error response with instrumentation
      const errorResponse = new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          requestId: context.requestId 
        }),
        { 
          status: 500,
          headers: { 'content-type': 'application/json' }
        }
      );
      
      return addInstrumentationHeaders(errorResponse, context);
    }
  };
}

/**
 * Environment variable helper
 */
export function getDevLimitFromEnv(defaultLimit: number = 10): number {
  const envLimit = process.env.FEED_DEV_LIMIT;
  if (!envLimit) return defaultLimit;
  
  const parsed = parseInt(envLimit, 10);
  return isNaN(parsed) ? defaultLimit : parsed;
}