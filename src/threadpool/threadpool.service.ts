import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'worker_threads';
import * as os from 'os';
import * as path from 'path';

type Task = {
  data: any;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
};

@Injectable()
export class ThreadPoolService implements OnModuleInit, OnModuleDestroy {
  private workers: Worker[] = [];
  private freeWorkers: Worker[] = [];
  private queue: Task[] = [];

  private poolSize = Math.max(2, os.cpus().length / 2);

  onModuleInit() {
    console.log(__dirname);
    const workerPath = path.resolve(__dirname, '../workers/cpu.worker.js');

    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(workerPath);

      worker.on('message', () => {
        worker['busy'] = false;
        this.freeWorkers.push(worker);

        const next = this.queue.shift();
        if (next) {
          this.run(next.data).then(next.resolve).catch(next.reject);
        }
      });

      worker.on('error', (err) => {
        console.error('Worker error:', err);
      });

      worker['busy'] = false;
      this.workers.push(worker);
      this.freeWorkers.push(worker);
    }

    console.log(`ThreadPool initialized with ${this.poolSize} workers`);
  }

  run(data: any): Promise<number> {
    return new Promise((resolve, reject) => {
      if (this.freeWorkers.length > 0) {
        const worker = this.freeWorkers.pop();
        if (worker) {
          worker['busy'] = true;

          worker.once('message', resolve);
          worker.once('error', reject);

          worker.postMessage(data);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          this.queue.push({ data, resolve, reject });
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.queue.push({ data, resolve, reject });
      }
    });
  }

  async onModuleDestroy() {
    for (const worker of this.workers) {
      await worker.terminate();
    }
    console.log('ThreadPool destroyed');
  }
}
