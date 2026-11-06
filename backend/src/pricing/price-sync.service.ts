import { Injectable, Logger } from '@nestjs/common';
import { Cron } from 'node-cron';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from './pricing.service';

@Injectable()
export class PriceSyncService {
  private readonly logger = new Logger(PriceSyncService.name);

  constructor(
    private prisma: PrismaService,
    private pricingService: PricingService,
  ) {}

  @Cron('0 2 * * *')
  async syncAllPrices() {
    this.logger.log('Starting daily price sync...');

    const cards = await this.prisma.carta.findMany({
      where: { tcgplayerId: { not: null } },
      select: { id: true, tcgplayerId: true },
    });

    let synced = 0;
    let failed = 0;

    for (const card of cards) {
      try {
        await this.pricingService.createPriceSnapshot(card.tcgplayerId!);
        synced++;
      } catch (error) {
        this.logger.error(`Failed to sync price for card ${card.id}`, error);
        failed++;
      }
    }

    this.logger.log(`Price sync complete: ${synced} synced, ${failed} failed`);
  }

  async syncCollectionPrices(collectionId: number) {
    const items = await this.prisma.cartaInCollezione.findMany({
      where: { collezione_id: collectionId },
      include: { carta: true },
    });

    for (const item of items) {
      if (item.carta.tcgplayerId) {
        try {
          await this.pricingService.createPriceSnapshot(item.carta.tcgplayerId);
        } catch (error) {
          this.logger.error(
            `Failed to sync price for card ${item.carta.id}`,
            error,
          );
        }
      }
    }
  }
}