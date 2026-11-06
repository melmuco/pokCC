import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCartaInCollezioneDto, UpdateCartaInCollezioneDto } from './dto';

@Injectable()
export class CarteInCollezioneService {
  constructor(private prisma: PrismaService) {}

  async findByCollezione(collezioneId: number, userId: number) {
    const collection = await this.prisma.collezione.findUnique({
      where: { id: collezioneId },
    });
    if (!collection) {
      throw new NotFoundException(`Collezione ${collezioneId} non trovata`);
    }
    if (!collection.is_public && collection.owner_id !== userId) {
      throw new UnauthorizedException('Non autorizzato');
    }

    return this.prisma.cartaInCollezione.findMany({
      where: { collezione_id: collezioneId },
      include: { carta: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async add(userId: number, dto: CreateCartaInCollezioneDto) {
    const collection = await this.prisma.collezione.findUnique({
      where: { id: dto.collezione_id },
    });
    if (!collection) {
      throw new NotFoundException(`Collezione ${dto.collezione_id} non trovata`);
    }
    if (collection.owner_id !== userId) {
      throw new UnauthorizedException('Non autorizzato');
    }

    const card = await this.prisma.carta.findUnique({
      where: { id: dto.card_id },
    });
    if (!card) {
      throw new NotFoundException(`Carta ${dto.card_id} non trovata`);
    }

    const existing = await this.prisma.cartaInCollezione.findUnique({
      where: { collezione_id_card_id: { collezione_id: dto.collezione_id, card_id: dto.card_id } },
    });
    if (existing) {
      throw new ConflictException('Carta già presente in questa collezione');
    }

    return this.prisma.cartaInCollezione.create({
      data: {
        collezione_id: dto.collezione_id,
        card_id: dto.card_id,
        condition: dto.condition,
        graded_company: dto.graded_company,
        graded_grade: dto.graded_grade,
        condition_date: dto.condition_date,
        quantity: dto.quantity ?? 1,
        acquired_date: dto.acquired_date,
        acquired_price: dto.acquired_price,
        note: dto.note,
        scan_id: dto.scan_id,
      },
      include: { carta: true },
    });
  }

  async update(userId: number, id: number, dto: UpdateCartaInCollezioneDto) {
    const item = await this.prisma.cartaInCollezione.findUnique({
      where: { id },
      include: { collezione: true },
    });
    if (!item) {
      throw new NotFoundException(`Voce ${id} non trovata`);
    }
    if (item.collezione.owner_id !== userId) {
      throw new UnauthorizedException('Non autorizzato');
    }

    return this.prisma.cartaInCollezione.update({
      where: { id },
      data: {
        condition: dto.condition,
        graded_company: dto.graded_company,
        graded_grade: dto.graded_grade,
        condition_date: dto.condition_date,
        quantity: dto.quantity,
        acquired_date: dto.acquired_date,
        acquired_price: dto.acquired_price,
        note: dto.note,
        scan_id: dto.scan_id,
      },
      include: { carta: true },
    });
  }

  async remove(userId: number, id: number) {
    const item = await this.prisma.cartaInCollezione.findUnique({
      where: { id },
      include: { collezione: true },
    });
    if (!item) {
      throw new NotFoundException(`Voce ${id} non trovata`);
    }
    if (item.collezione.owner_id !== userId) {
      throw new UnauthorizedException('Non autorizzato');
    }

    return this.prisma.cartaInCollezione.delete({
      where: { id },
      include: { carta: true },
    });
  }
}