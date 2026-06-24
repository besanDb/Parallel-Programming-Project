import { Test, TestingModule } from '@nestjs/testing';
import { ThreadpoolService } from './threadpool.service';

describe('ThreadpoolService', () => {
  let service: ThreadpoolService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ThreadpoolService],
    }).compile();

    service = module.get<ThreadpoolService>(ThreadpoolService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
