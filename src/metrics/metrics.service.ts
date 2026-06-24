// src/metrics/metrics.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry = new Registry();

  httpDuration!: Histogram;
  httpRequestsTotal!: Counter;
  httpErrorsTotal!: Counter;
  queueDepth!: Gauge;
  dbQueryDuration!: Histogram;
  checkoutTotal!: Counter;

  onModuleInit() {
    this.registry.clear();

    this.httpDuration = new Histogram({
      name: 'http_request_duration_ms',
      help: 'Duration of HTTP requests in ms',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [50, 100, 200, 500, 1000, 2000, 5000],
      registers: [this.registry],
    });

    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpErrorsTotal = new Counter({
      name: 'http_errors_total',
      help: 'Total number of failed HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.queueDepth = new Gauge({
      name: 'queue_depth',
      help: 'Number of jobs waiting in queue',
      labelNames: ['queue_name'],
      registers: [this.registry],
    });

    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_ms',
      help: 'Duration of database queries in ms',
      labelNames: ['operation', 'model'],
      buckets: [5, 10, 25, 50, 100, 250, 500, 1000],
      registers: [this.registry],
    });

    this.checkoutTotal = new Counter({
      name: 'checkout_total',
      help: 'Total checkout attempts',
      labelNames: ['status'],
      registers: [this.registry],
    });

    collectDefaultMetrics({
      register: this.registry,
      prefix: 'ecommerce_',
    });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
