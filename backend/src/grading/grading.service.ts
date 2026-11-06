import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Condition, GradedCompany } from '@prisma/client';

@Injectable()
export class GradingService {
  private readonly logger = new Logger(GradingService.name);

  private readonly CONDITION_MULTIPLIERS: Record<Condition, number> = {
    [Condition.NearMint]: 1.0,
    [Condition.LightPlay]: 0.7,
    [Condition.Play]: 0.5,
    [Condition.Moderate]: 0.3,
    [Condition.Heavy]: 0.2,
    [Condition.Damaged]: 0.1,
  };

  private readonly GRADE_MULTIPLIERS: Record<string, Record<number, number>> = {
    PSA: {
      10: 5,
      9: 3,
      8: 2,
      7: 1.5,
      6: 1.2,
    },
    BGS: {
      10: 4.5,
      9: 2.5,
      8: 1.8,
      7: 1.3,
      6: 1.1,
    },
    CGC: {
      10: 4,
      9: 2.5,
      8: 1.5,
      7: 1.1,
      6: 1,
    },
  };

  constructor(private prisma: PrismaService) {}

  calculateConditionMultiplier(condition: Condition | null): number {
    if (!condition) return 1;
    return this.CONDITION_MULTIPLIERS[condition] || 1;
  }

  calculateGradeMultiplier(gradedCompany: GradedCompany | null, gradedGrade: number | null): number {
    if (!gradedCompany || !gradedGrade) return 1;

    const companyMultipliers = this.GRADE_MULTIPLIERS[gradedCompany];
    if (!companyMultipliers) return 1;

    return companyMultipliers[gradedGrade] || 1;
  }

  calculateFinalPrice(basePrice: number, condition: Condition | null, gradedCompany: GradedCompany | null, gradedGrade: number | null): number {
    const conditionMultiplier = this.calculateConditionMultiplier(condition);
    const gradeMultiplier = this.calculateGradeMultiplier(gradedCompany, gradedGrade);
    return basePrice * conditionMultiplier * gradeMultiplier;
  }

  async updateGrading(
    userId: number,
    cardId: number,
    collectionId: number,
    body: { condition?: Condition; graded_company?: GradedCompany; graded_grade?: number }
  ): Promise<{ finalPrice: number; condition: Condition | null; graded_company: GradedCompany | null; graded_grade: number | null }> {
    const item = await this.prisma.cartaInCollezione.findFirst({
      where: {
        card_id: cardId,
        collezione_id: collectionId,
        collezione: { owner_id: userId },
      },
      include: { carta: true },
    });

    if (!item) {
      throw new NotFoundException('Card not found in collection');
    }

    const basePrice = item.carta.basePrice || 0;

    const updatedItem = await this.prisma.cartaInCollezione.update({
      where: { id: item.id },
      data: {
        condition: body.condition,
        graded_company: body.graded_company,
        graded_grade: body.graded_grade,
      },
    });

    const finalPrice = this.calculateFinalPrice(
      basePrice,
      body.condition ?? item.condition,
      body.graded_company ?? item.graded_company,
      body.graded_grade ?? item.graded_grade,
    );

    return {
      finalPrice,
      condition: updatedItem.condition,
      graded_company: updatedItem.graded_company,
      graded_grade: updatedItem.graded_grade,
    };
  }
}