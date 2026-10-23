import { Module } from '@nestjs/common';
import { SampleCollectionController } from './sample-collection.controller';
import { SampleCollectionService } from './sample-collection.service';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [SampleCollectionController],
  providers: [SampleCollectionService]
})
export class SampleCollectionModule { }
