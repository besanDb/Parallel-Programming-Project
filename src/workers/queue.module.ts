import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'checkout' },
      { name: 'dlq' },
      { name: 'email' },
    ),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
