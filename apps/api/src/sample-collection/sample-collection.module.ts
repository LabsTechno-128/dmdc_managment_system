import { Module } from '@nestjs/common';
import { SampleCollectionController } from './sample-collection.controller';
import { SampleCollectionService } from './sample-collection.service';

@Module({
  controllers: [SampleCollectionController],
  providers: [SampleCollectionService]
})
export class SampleCollectionModule { }
