import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Status } from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from 'src/prisma/prisma.service';

type DLQJobData = {
  originalJob: { userId: number; [key: string]: unknown };
  error: string;
  failedAt?: string | Date;
};

@Processor('dlq', { concurrency: 2 })
@Injectable()
export class DLQProcessor extends WorkerHost {
  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<DLQJobData>) {
    console.log('added to dlq');
    const { originalJob, error, failedAt } = job.data;

    await this.prisma.loggings.create({
      data: { userId: originalJob.userId, log: { error }, createdAt: failedAt },
    });

    if (!originalJob.orderId && originalJob.orderId instanceof Number) {
      await this.prisma.order.update({
        where: { id: +originalJob.orderId },
        data: { status: Status.FAILED, updatedAt: failedAt },
      });
    }

    return true;
  }
}
