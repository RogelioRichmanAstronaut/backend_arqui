/**
 * Request Logger Middleware
 * 
 * Logs all incoming HTTP requests and responses for debugging.
 * Useful for monitoring proxy behavior on droplet.
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, body, query, headers } = req;
    const startTime = Date.now();
    const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // Log incoming request
    this.logger.log(`📥 [${requestId}] ────────────────────────────────────────`);
    this.logger.log(`📥 [${requestId}] ${method} ${originalUrl}`);
    
    if (Object.keys(query).length > 0) {
      this.logger.debug(`📥 [${requestId}] Query: ${JSON.stringify(query)}`);
    }
    
    if (body && Object.keys(body).length > 0) {
      // Sanitize sensitive data
      const sanitizedBody = this.sanitizeBody(body);
      this.logger.debug(`📥 [${requestId}] Body: ${JSON.stringify(sanitizedBody)}`);
    }

    // Log authorization header (masked)
    if (headers.authorization) {
      const token = headers.authorization.substring(0, 20) + '...';
      this.logger.debug(`📥 [${requestId}] Auth: ${token}`);
    }

    // Capture response
    const originalSend = res.send.bind(res);
    res.send = (data: any) => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      const statusEmoji = statusCode >= 400 ? '❌' : '✅';

      this.logger.log(`📤 [${requestId}] ${statusEmoji} ${statusCode} (${duration}ms)`);
      
      // Log response body for errors or debug
      if (statusCode >= 400 || process.env.LOG_RESPONSE_BODY === 'true') {
        try {
          const responseData = typeof data === 'string' ? JSON.parse(data) : data;
          const truncated = JSON.stringify(responseData).substring(0, 500);
          this.logger.debug(`📤 [${requestId}] Response: ${truncated}${truncated.length >= 500 ? '...' : ''}`);
        } catch {
          // Not JSON, skip
        }
      }

      this.logger.log(`📤 [${requestId}] ────────────────────────────────────────`);
      return originalSend(data);
    };

    next();
  }

  private sanitizeBody(body: any): any {
    const sensitiveFields = ['password', 'contrasena', 'token', 'secret', 'apiKey'];
    const sanitized = { ...body };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }
    
    return sanitized;
  }
}



