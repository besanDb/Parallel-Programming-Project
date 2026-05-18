import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'inventory-batch',
    }),
  ],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
