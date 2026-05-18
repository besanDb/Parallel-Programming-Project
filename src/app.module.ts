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

import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
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

    // Prometheus
    PrometheusModule.register(),
  ],
  controllers: [],
  providers: [
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
