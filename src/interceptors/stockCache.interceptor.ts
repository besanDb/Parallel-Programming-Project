import { CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ProductStockCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.method !== 'GET') {
      return undefined;
    }

    const productId = request.params.id;
    if (!productId || Array.isArray(productId)) {
      return undefined;
    }

    return `stock:product:${productId}`;
  }
}
