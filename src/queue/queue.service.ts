import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InventoryBatchJob } from './queue.types';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  constructor(@InjectQueue('inventory-batch') private batchQueue: Queue) {}

  async addBatchJob(type: string, data: InventoryBatchJob) {
    return this.batchQueue.add(type, data, {
      attempts: 3,
      backoff: 5000,
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }
}
