import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InventoryBatchService } from './inventory-batch.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class InventoryCronService {
  constructor(
    private readonly inventoryBatchService: InventoryBatchService,
    private readonly redisService: RedisService,
  ) {}

  @Cron('0 0 * * *')
  // @Cron('*/10 * * * * *')
  // @Cron('0 * * * * *')
  async handleInventoryCron() {
    let lock;
    try {
      lock = await this.redisService.redlock.acquire(['inventory-cron'], 5000);
      console.log('Cron started: Inventory Batch Job');

      const result =
        await this.inventoryBatchService.runInventoryBatchProcessing();

      console.log('Cron finished:', result);
    } catch (e) {
      console.error(`ERROR CRON: `, e);
    } finally {
      if (lock) {
        await lock.release();
      }
    }
  }
}
