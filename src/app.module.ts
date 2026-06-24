import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { JwtModule } from '@nestjs/jwt';

import { BullModule } from '@nestjs/bullmq';

import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';

import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';

import { CartsModule } from './carts/carts.module';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

import { RedisModule } from './redis/redis.module';

import { ThreadPoolModule } from './threadpool/threadpool.module';

import { QueuesModule } from './workers/queue.module';

import { QueueModule } from './queue/queue.module';
import { BatchModule } from './batch/batch.module';

import { AuthenticationGuard } from './guards/authentication.guard';

import { ThreadPoolService } from './threadpool/threadpool.service';
//10
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsModule } from './metrics/metrics.module';
import { PerformanceInterceptor } from './interceptors/performance.interceptor';

import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
@Module({
  imports: [
    MetricsModule,
    // Auth
    AuthModule,
    UserModule,

    //Database
    PrismaModule,
    RedisModule,

    //
    ProductsModule,
    InventoryModule,
    CartsModule,

    // Batch Processing
    QueueModule,
    BatchModule,

    // Workers
    QueuesModule,
    ThreadPoolModule,

    ScheduleModule.forRoot(),

    // JWT
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
      }),
    }),

    // BullMQ
    BullModule.forRoot({
      connection: {
        host: 'redis',
        port: Number(6379),
      },
      defaultJobOptions: { attempts: 3 },
    }),

    // Throttler
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 1000,
          limit: 100,
        },
      ],
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          ttl: 10 * 1000,
          socket: {
            host: process.env.BULLMQ_HOST,
            port: Number(6379),
          },
        }),
      }),
    }),
  ],

  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
    {
      // Authentication Guard
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    // Rate Limit Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // Thread Pool
    ThreadPoolService,
  ],
})
export class AppModule {}
