import { Controller, Post } from '@nestjs/common';
import { InventoryBatchService } from './inventory-batch.service';
import { Public } from '../decorators/publicRoute.decorator';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryBatchService: InventoryBatchService) {}

  @Public()
  @Post('run-batch')
  async runInventoryBatch() {
    return this.inventoryBatchService.runInventoryBatchProcessing();
  }
}
