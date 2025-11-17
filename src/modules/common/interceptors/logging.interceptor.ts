import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const req = context.switchToHttp().getRequest();
    const method = req?.method;
    const url = req?.url;

    return next.handle().pipe(
      tap(() => {
        // eslint-disable-next-line no-console
        console.log(`[${method}] ${url} ${Date.now() - now}ms`);
      }),
    );
  }
}