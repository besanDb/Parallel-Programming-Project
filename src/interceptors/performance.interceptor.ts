import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { MetricsService } from 'src/metrics/metrics.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const route = req.route?.path ?? req.url;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        if (!this.metrics.httpDuration) return;

        const duration = Date.now() - start;
        const statusCode = String(
          context.switchToHttp().getResponse().statusCode,
        );

        this.metrics.httpDuration
          .labels(method, route, statusCode)
          .observe(duration);

        this.metrics.httpRequestsTotal.labels(method, route, statusCode).inc();
      }),

      catchError((error) => {
        if (this.metrics.httpErrorsTotal) {
          const duration = Date.now() - start;
          const statusCode = String(error.status ?? 500);

          this.metrics.httpDuration
            ?.labels(method, route, statusCode)
            .observe(duration);

          this.metrics.httpErrorsTotal.labels(method, route, statusCode).inc();
        }
        return throwError(() => error);
      }),
    );
  }
}
