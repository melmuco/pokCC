import { Module } from '@nestjs/common';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { PriceSyncService } from './price-sync.service';

@Module({
  controllers: [PricingController],
  providers: [PricingService, PriceSyncService],
  exports: [PricingService, PriceSyncService],
})
export class PricingModule {}