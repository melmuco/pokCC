import {
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Request,
  ParseIntPipe,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, BearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { PricingService } from './pricing.service';
import { PriceSyncService } from './price-sync.service';
import { ValuationService } from '../collections/valuation.service';
import { PrismaService } from '../prisma/prisma.service';

interface PriceHistoryPoint {
  date: string;
  price: number;
}

interface CardValuation {
  currentValue: number;
  trend: number;
  conditionMultiplier: number;
  gradeMultiplier: number;
  rarityMultiplier: number;
  finalPrice: number;
  priceHistory: PriceHistoryPoint[];
}

@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  constructor(
    private readonly pricingService: PricingService,
    private readonly priceSyncService: PriceSyncService,
    private readonly valuationService: ValuationService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('card/:cardId')
  @BearerAuth()
  @ApiOperation({ summary: 'Get current price and trend for a card' })
  @ApiResponse({ status: 200, description: 'Price and trend data' })
  async getCardPrice(@Param('cardId', ParseIntPipe) cardId: number): Promise<CardValuation> {
    const { price, trend } = await this.pricingService.getCurrentPrice(cardId);

    const history = await this.pricingService.getHistoricalPrices(cardId, 30);
    const priceHistory: PriceHistoryPoint[] = history.map((h) => ({
      date: h.date.toISOString().split('T')[0],
      price: h.mid || 0,
    }));

    return {
      currentValue: price,
      trend,
      conditionMultiplier: 1,
      gradeMultiplier: 1,
      rarityMultiplier: 1,
      finalPrice: price,
      priceHistory,
    };
  }

  @Get('card/:cardId/valuation')
  @BearerAuth()
  @ApiOperation({ summary: 'Get complete valuation for a card with grading multipliers' })
  @ApiResponse({ status: 200, description: 'Detailed valuation' })
  async getCardValuation(
    @Param('cardId', ParseIntPipe) cardId: number,
    @Query('collectionId') collectionId?: string,
    @Query('itemId') itemId?: string,
  ): Promise<CardValuation> {
    const { price, trend } = await this.pricingService.getCurrentPrice(cardId);

    const history = await this.pricingService.getHistoricalPrices(cardId, 30);
    const priceHistory: PriceHistoryPoint[] = history.map((h) => ({
      date: h.date.toISOString().split('T')[0],
      price: h.mid || 0,
    }));

    let conditionMultiplier = 1;
    let gradeMultiplier = 1;
    let rarityMultiplier = 1;
    let finalPrice = price;

    if (collectionId && itemId) {
      const item = await this.prisma.cartaInCollezione.findUnique({
        where: { id: parseInt(itemId) },
        include: { carta: true },
      });

      if (item?.carta) {
        conditionMultiplier = this.valuationService.calculateConditionMultiplier(item.condition);
        gradeMultiplier = this.valuationService.calculateGradeMultiplier(
          item.graded_company,
          item.graded_grade,
        );

        const basePrice = item.carta.basePrice || price;
        finalPrice = basePrice * conditionMultiplier * gradeMultiplier * item.quantity;
      }
    } else if (collectionId) {
      const collection = await this.prisma.collezione.findUnique({
        where: { id: parseInt(collectionId) },
        include: {
          carte: {
            where: { card_id: cardId },
            include: { carta: true },
          },
        },
      });

      if (collection?.carte?.[0]) {
        const item = collection.carte[0];
        conditionMultiplier = this.valuationService.calculateConditionMultiplier(item.condition);
        gradeMultiplier = this.valuationService.calculateGradeMultiplier(
          item.graded_company,
          item.graded_grade,
        );

        finalPrice = price * conditionMultiplier * gradeMultiplier * (item.quantity || 1);
      }
    }

    return {
      currentValue: price,
      trend,
      conditionMultiplier,
      gradeMultiplier,
      rarityMultiplier,
      finalPrice,
      priceHistory,
    };
  }

  @Post('card/:cardId/snapshot')
  @BearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create a manual price snapshot for a card' })
  @ApiResponse({ status: 201, description: 'Snapshot created' })
  async createSnapshot(
    @Param('cardId', ParseIntPipe) cardId: number,
    @Request() req,
  ): Promise<{ snapshotId: number; price: number }> {
    const card = await this.pricingService.findOne(cardId);
    if (!card || !card.tcgplayerId) {
      throw new Error('Card not found or missing TCG player ID');
    }

    const snapshotId = await this.pricingService.createPriceSnapshot(card.tcgplayerId, true);

    const { price } = await this.pricingService.getCurrentPrice(cardId);

    return { snapshotId, price };
  }

  @Post('sync/all')
  @BearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Manually sync prices for all cards' })
  @ApiResponse({ status: 200, description: 'Sync completed' })
  async syncAllPrices(@Request() req) {
    await this.priceSyncService.syncAllPrices();
    return { message: 'Price sync initiated for all cards' };
  }

  @Post('sync/collection/:collectionId')
  @BearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Sync prices for a specific collection' })
  @ApiResponse({ status: 200, description: 'Sync completed' })
  async syncCollectionPrices(
    @Param('collectionId', ParseIntPipe) collectionId: number,
    @Request() req,
  ) {
    await this.priceSyncService.syncCollectionPrices(collectionId);
    return { message: `Price sync completed for collection ${collectionId}` };
  }
}