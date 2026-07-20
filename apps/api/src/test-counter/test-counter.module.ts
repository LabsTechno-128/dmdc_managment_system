import { Module } from '@nestjs/common';
import { TestCounterController } from './test-counter.controller';
import { TestCounterService } from './test-counter.service';

@Module({
  controllers: [TestCounterController],
  providers: [TestCounterService]
})
export class TestCounterModule {}
