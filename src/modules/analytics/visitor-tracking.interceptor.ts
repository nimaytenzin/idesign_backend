import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class VisitorTrackingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(VisitorTrackingInterceptor.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    // Track visitor asynchronously without blocking the request
    // Skip tracking for analytics endpoints to avoid infinite loops
    if (!request.url?.startsWith('/analytics') && request.url !== '/' && request.url !== '/health') {
      // Fire and forget - don't await to avoid blocking the request
      this.analyticsService.trackVisitor(request).catch((error) => {
        // Log error but don't fail the request
        this.logger.error(`Failed to track visitor in interceptor: ${error.message}`);
      });
    }

    return next.handle();
  }
}

