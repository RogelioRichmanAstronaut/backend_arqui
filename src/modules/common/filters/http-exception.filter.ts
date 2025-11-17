import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
  
  @Catch()
  export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const res = ctx.getResponse();
      const req = ctx.getRequest();
  
      if (exception instanceof HttpException) {
        const status = exception.getStatus();
        const response = exception.getResponse();
        const payload =
          typeof response === 'string'
            ? { statusCode: status, error: 'HttpException', message: response }
            : response;
        return res.status(status).json({
          ...payload,
          path: req.url,
          timestamp: new Date().toISOString(),
        });
      }
  
      // Fallback 500
      const status = HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json({
        statusCode: status,
        error: 'InternalServerError',
        message: 'Unexpected error',
        path: req.url,
        timestamp: new Date().toISOString(),
      });
    }
  }