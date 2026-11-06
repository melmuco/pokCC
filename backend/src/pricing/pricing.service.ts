import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

export interface TCGPriceResponse {
  data: {
    url: string;
    cardId: string;
    region: string;
    object: string;
    prices: {
      low?: number;
      high?: number;
      mid?: number;
      market?: number;
      trend?: number;
      vipLow?: number;
      vipHigh?: number;
      vipMid?: number;
      cightlyLow?: number;
      cightlyHigh?: number;
      cightlyMid?: number;
    };
    updatedAt: string;
    verboseCenterprice?: number;
    collectorCenterPrice?: number;
  }[];
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);
  private readonly tcgBaseUrl = 'https://api.pokemontcg.io/v2';
  private readonly tcgApiKey: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.tcgApiKey = this.config.get<string>('TCG_API_KEY') || '';
  }

  async fetchPricesFromAPI(cardId: string): Promise<TCGPriceResponse | null> {
    try {
      const response = await axios.get(`${this.tcgBaseUrl}/cards/${cardId}/prices`, {
        headers: { 'X-Api-Key': this.tcgApiKey },
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching prices for card ${cardId}`, error);
      return null;
    }
  }

  async createPriceSnapshot(cardId: string, manually: boolean = false): Promise<number> {
    const card = await this.prisma.carta.findUnique({
      where: { tcgplayerId: cardId },
    });

    if (!card) {
      throw new BadRequestException(`Card with ID ${cardId} not found`);
    }

    const priceData = await this.fetchPricesFromAPI(cardId);

    if (!priceData || !priceData.data || priceData.data.length === 0) {
      throw new BadRequestException('No price data available from TCG API');
    }

    const primaryPrice = priceData.data[0].prices;
    const midPrice = primaryPrice.mid || primaryPrice.market || primaryPrice.verboseCenterprice || 0;

    const snapshot = await this.prisma.priceSnapshot.create({
      data: {
        card_id: card.id,
        source: manually ? 'manual' : 'api',
        date: new Date(),
        low: primaryPrice.low || 0,
        high: primaryPrice.high || 0,
        mid: midPrice,
        volume: primaryPrice.tcgVolume || 0,
      },
    });

    await this.prisma.carta.update({
      where: { id: card.id },
      data: { basePrice: midPrice },
    });

    this.logger.log(`Created price snapshot for card ${cardId}: ${midPrice}`);
    return snapshot.id;
  }

  async getCurrentPrice(cardId: number): Promise<{ price: number; trend: number }> {
    const card = await this.prisma.carta.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw new BadRequestException('Card not found');
    }

    const snapshots = await this.prisma.priceSnapshot.findMany({
      where: {
        card_id: cardId,
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { date: 'desc' },
      take: 30,
    });

    if (snapshots.length === 0) {
      return { price: 0, trend: 0 };
    }

    const sortedByDate = [...snapshots].sort((a, b) => a.date.getTime() - b.date.getTime());
    const midPrices = sortedByDate.map((s) => s.mid || 0);
    const currentPrice = midPrices[midPrices.length - 1] || 0;

    const thirtyDaysAgoPrice = sortedByDate[0]?.mid || currentPrice;
    const trend = thirtyDaysAgoPrice > 0
      ? ((currentPrice - thirtyDaysAgoPrice) / thirtyDaysAgoPrice) * 100
      : 0;

    return { price: currentPrice, trend };
  }

  async getHistoricalPrices(cardId: number, days: number = 30) {
    return await this.prisma.priceSnapshot.findMany({
      where: {
        card_id: cardId,
        date: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { date: 'asc' },
    });
  }
}