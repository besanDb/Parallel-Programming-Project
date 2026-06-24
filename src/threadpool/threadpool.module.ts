import { Module } from '@nestjs/common';
import { ThreadPoolService } from './threadpool.service';

@Module({
  providers: [ThreadPoolService],
  exports: [ThreadPoolService],
})
export class ThreadPoolModule {}
