import { Module } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { QueuesModule } from 'src/workers/queue.module';
import { CheckoutProcessor } from 'src/workers/checkout.worker';
import { ThreadPoolModule } from 'src/threadpool/threadpool.module';
import { EmailProcessor } from 'src/workers/email.worker';
import { DLQProcessor } from 'src/workers/dlq.worker';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [PrismaModule, QueuesModule, ThreadPoolModule, RedisModule],
  controllers: [CartsController],
  providers: [CartsService, CheckoutProcessor, EmailProcessor, DLQProcessor],
  exports: [CartsService],
})
export class CartsModule {}
