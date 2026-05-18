import { Module } from '@nestjs/common';
import { BatchService } from './batch.service';
import { QueueModule } from '../queue/queue.module';
import { InventoryProcessor } from './processors/process-inventory-report';
// import { ProductsProcessor } from './processors/products.processor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [QueueModule, PrismaModule],
  providers: [BatchService, InventoryProcessor],
  exports: [BatchService],
})
export class BatchModule {}
