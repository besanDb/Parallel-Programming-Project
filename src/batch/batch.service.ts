import { Injectable } from '@nestjs/common';
import { QueueService } from 'src/queue/queue.service';

@Injectable()
export class BatchService {
  constructor(private queueService: QueueService) {}
  async processInventoryInBatches(orders: any[]) {
    const chunkSize = 50;
    for (let i = 0; i < orders.length; i += chunkSize) {
      const chunk = orders.slice(i, i + chunkSize);

      await this.queueService.addBatchJob('process-inventory', {
        chunk,
      });
    }
  }
}
