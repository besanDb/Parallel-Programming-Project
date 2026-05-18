import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import Redlock from 'redlock';

@Injectable()
export class RedisService extends Redis {
  public redlock: Redlock;
  constructor() {
    super({
      host: 'redis',
      port: 6379,
    });
    this.redlock = new Redlock([this], {
      retryCount: 0,
    });
  }
}
