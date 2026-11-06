import { Module } from '@nestjs/common';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import { ValuationService } from './valuation.service';
import { ValuationController } from './valuation.controller';
import { GradingController } from '../grading/grading.controller';
import { GradingService } from '../grading/grading.service';

@Module({
  controllers: [CollectionsController, ValuationController, GradingController],
  providers: [CollectionsService, ValuationService, GradingService],
  exports: [CollectionsService, ValuationService, GradingService],
})
export class CollectionsModule {}