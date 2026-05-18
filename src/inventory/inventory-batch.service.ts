import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BatchService } from '../batch/batch.service';

@Injectable()
export class InventoryBatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly batchService: BatchService,
  ) {}

  async runInventoryBatchProcessing() {
    const products = await this.prisma.product.findMany({
      select: {
        id: true,
        stock: true,
      },
    });

    await this.batchService.processInventoryInBatches(products);

    return {
      message: 'Inventory batches added to queue successfully',
      totalProducts: products.length,
    };
  }
}
