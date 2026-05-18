import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';

import { ProductsService } from './products.service';
// import { ProductsBatchService } from './products-batch.service';

import { PrismaModule } from 'src/prisma/prisma.module';
import { BatchModule } from '../batch/batch.module';

@Module({
  imports: [PrismaModule, BatchModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
