import { Module } from '@nestjs/common';

import { InventoryBatchService } from './inventory-batch.service';
import { InventoryCronService } from './inventory-cron.service';

import { InventoryController } from './inventory.controller';

import { PrismaModule } from '../prisma/prisma.module';
import { BatchModule } from '../batch/batch.module';
import { InventoryProcessor } from '../batch/processors/process-inventory-report';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [PrismaModule, BatchModule, RedisModule],

  controllers: [InventoryController],

  providers: [InventoryBatchService, InventoryProcessor, InventoryCronService],

  exports: [InventoryBatchService],
})
export class InventoryModule {}
