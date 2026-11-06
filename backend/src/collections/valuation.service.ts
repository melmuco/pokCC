import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { Condition } from '@prisma/client';

export interface ValuationMultiplier {
  rarity: string;
  multiplier: number;
}

export interface CollectionValuation {
  totalValue: number;
  cardCount: number;
  breakdown: {
    setName: string;
    cardName: string;
    currentPrice: number;
    collectionValue: number;
    quantity: number;
    condition: string | null;
    graded: boolean;
  }[];
}

const RARITY_MULTIPLIERS: Record<string, number> = {
  'Common': 1,
  'Uncommon': 1.5,
  'Rare': 2,
  'Rare Holo': 3,
  'Rare V': 3.5,
  'Rare VMAX': 4,
  'Ultra Rare': 5,
  'Legend': 8,
  'Promo': 1.2,
};

const CONDITION_MULTIPLIERS: Record<Condition, number> = {
  [Condition.NearMint]: 1.0,
  [Condition.LightPlay]: 0.7,
  [Condition.Play]: 0.5,
  [Condition.Moderate]: 0.3,
  [Condition.Heavy]: 0.2,
  [Condition.Damaged]: 0.1,
};

@Injectable()
export class ValuationService {
  private readonly logger = new Logger(ValuationService.name);

  constructor(
    private prisma: PrismaService,
    private pricingService: PricingService,
  ) {}

  calculateRarityMultiplier(rarity: string | null): number {
    if (!rarity) return 1;
    return RARITY_MULTIPLIERS[rarity] || 1;
  }

  calculateConditionMultiplier(condition: Condition | null): number {
    if (!condition) return 1;
    return CONDITION_MULTIPLIERS[condition] || 1;
  }

  calculateGradeMultiplier(gradedCompany: string | null, gradedGrade: number | null): number {
    if (!gradedCompany || !gradedGrade) {
      return 1;
    }

    if (gradedCompany === 'PSA') {
      if (gradedGrade === 10) return 5;
      if (gradedGrade === 9) return 3;
      if (gradedGrade === 8) return 2;
      if (gradedGrade === 7) return 1.5;
      if (gradedGrade === 6) return 1.2;
    }

    if (gradedCompany === 'BGS') {
      if (gradedGrade === 10) return 4.5;
      if (gradedGrade === 9) return 2.5;
      if (gradedGrade === 8) return 1.8;
      if (gradedGrade === 7) return 1.3;
      if (gradedGrade === 6) return 1.1;
    }

    if (gradedCompany === 'CGC') {
      if (gradedGrade === 10) return 4;
      if (gradedGrade === 9) return 2.5;
      if (gradedGrade === 8) return 1.5;
      if (gradedGrade === 7) return 1.1;
      if (gradedGrade === 6) return 1;
    }

    return 1;
  }

  calculateSetCompletionBonus(setCardsCount: number, ownedCardsCount: number): number {
    if (setCardsCount === 0) return 1;

    const completionPercentage = ownedCardsCount / setCardsCount;

    if (completionPercentage >= 0.9) {
      return 1.15;
    } else if (completionPercentage >= 0.75) {
      return 1.1;
    } else if (completionPercentage >= 0.5) {
      return 1.05;
    }
    return 1;
  }

  async calculateCardValue(cardInCollezione: any): Promise<number> {
    const card = cardInCollezione.carta;
    if (!card) return 0;

    const basePrice = card.basePrice || 0;

    const rarityMultiplier = this.calculateRarityMultiplier(card.rarity);
    const gradeMultiplier = this.calculateGradeMultiplier(
      cardInCollezione.graded_company,
      cardInCollezione.graded_grade,
    );
    const conditionMultiplier = this.calculateConditionMultiplier(cardInCollezione.condition);

    const totalMultiplier = rarityMultiplier * gradeMultiplier * conditionMultiplier;
    const collectionValue = basePrice * totalMultiplier * (cardInCollezione.quantity || 1);

    return collectionValue;
  }

  async calculateCollectionValue(collezioneId: number): Promise<CollectionValuation> {
    const collezione = await this.prisma.collezione.findUnique({
      where: { id: collezioneId },
      include: {
        carte: {
          include: {
            carta: {
              include: {
                set: true,
              },
            },
          },
        },
      },
    });

    if (!collezione) {
      throw new Error('Collezione not found');
    }

    let totalValue = 0;
    const breakdown = [];

    for (const item of collezione.carte) {
      const { price, trend } = await this.pricingService.getCurrentPrice(item.carta.id);

      const rarityMultiplier = this.calculateRarityMultiplier(item.carta.rarity);
      const gradeMultiplier = this.calculateGradeMultiplier(
        item.graded_company,
        item.graded_grade,
      );
      const conditionMultiplier = this.calculateConditionMultiplier(item.condition);

      const totalMultiplier = rarityMultiplier * gradeMultiplier * conditionMultiplier;
      const collectionValue = price * totalMultiplier * (item.quantity || 1);

      totalValue += collectionValue;

      breakdown.push({
        setName: item.carta.set?.name || 'Unknown',
        cardName: item.carta.name,
        currentPrice: price,
        collectionValue,
        quantity: item.quantity || 1,
        condition: item.condition,
        graded: !!(item.graded_company && item.graded_grade),
        trend,
      });
    }

    const setInfo = await this.prisma.set.findMany({
      where: {
        carte: {
          some: { id: { in: collezione.carte.map((c) => c.carta.id) } },
        },
      },
    });

    const setCompletionBonuses: Record<number, number> = {};
    for (const set of setInfo) {
      const setCardIds = await this.prisma.carta.findMany({
        where: { setId: set.id },
        select: { id: true },
      });

      const ownedIds = collezione.carte.map((c) => c.carta.id);
      const setCompletion = setCompletionBonuses[set.id] || 1;

      const bonus = this.calculateSetCompletionBonus(setCardIds.length, ownedIds.length);
      setCompletionBonuses[set.id] = bonus;
    }

    return {
      totalValue,
      cardCount: collezione.carte.length,
      breakdown,
    };
  }

  async getUserTotalCollectionValue(userId: number): Promise<{
    totalValue: number;
    bySet: { setName: string; value: number; cardCount: number }[];
  }> {
    const collections = await this.prisma.collezione.findMany({
      where: { owner_id: userId },
      include: {
        carte: {
          include: {
            carta: {
              select: {
                id: true,
                name: true,
                set: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    let totalValue = 0;
    const setMap = new Map<string, number>();
    const setCountMap = new Map<string, number>();

    for (const collection of collections) {
      for (const item of collection.carte) {
        const { price } = await this.pricingService.getCurrentPrice(item.carta.id);

        const rarityMultiplier = this.calculateRarityMultiplier(item.carta.rarity);
        const gradeMultiplier = this.calculateGradeMultiplier(
          item.graded_company,
          item.graded_grade,
        );
        const conditionMultiplier = this.calculateConditionMultiplier(item.condition);

        const totalMultiplier = rarityMultiplier * gradeMultiplier * conditionMultiplier;
        const itemValue = price * totalMultiplier * (item.quantity || 1);

        totalValue += itemValue;

        const setName = item.carta.set?.name || 'Unknown';
        setMap.set(setName, (setMap.get(setName) || 0) + itemValue);
        setCountMap.set(setName, (setCountMap.get(setName) || 0) + 1);
      }
    }

    const bySet = Array.from(setMap.entries()).map(([setName, value]) => ({
      setName,
      value,
      cardCount: setCountMap.get(setName) || 0,
    }));

    return {
      totalValue,
      bySet,
    };
  }
}