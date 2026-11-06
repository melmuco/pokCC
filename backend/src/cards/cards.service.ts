import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FindCardsDto } from './dto';

@Injectable()
export class CardsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: FindCardsDto = {}) {
    const where: any = {};

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }
    if (query.set_id !== undefined) {
      where.setId = Number(query.set_id);
    }
    if (query.rarity) {
      where.rarity = query.rarity;
    }
    if (query.supertype) {
      where.supertype = query.supertype;
    }
    if (query.types) {
      const types = query.types.split(',').map((t) => t.trim()).filter(Boolean);
      if (types.length > 0) {
        where.types = { hasSome: types };
      }
    }

    const take = query.limit ? Number(query.limit) : 100;
    const skip = query.offset ? Number(query.offset) : 0;

    const [data, total] = await Promise.all([
      this.prisma.carta.findMany({
        where,
        include: {
          set: true,
        },
        take,
        skip,
        orderBy: { name: 'asc' },
      }),
      this.prisma.carta.count({ where }),
    ]);

    return { data, total, limit: take, offset: skip };
  }

  async findOne(id: number) {
    return this.prisma.carta.findUnique({
      where: { id },
      include: {
        set: true,
        inCollezioni: true,
        priceSnapshots: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        imageReferences: true,
      },
    });
  }

  async findBySet(setId: number) {
    return this.prisma.carta.findMany({
      where: { setId },
      include: { set: true },
      orderBy: { name: 'asc' },
    });
  }

  async findByTcgPlayerId(tcgplayerId: string) {
    return this.prisma.carta.findUnique({
      where: { tcgplayerId },
      include: {
        set: true,
        priceSnapshots: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });
  }

  async updateBasePrice(id: number, price: number) {
    return this.prisma.carta.update({
      where: { id },
      data: { basePrice: price },
    });
  }

  async create(data: any) {
    return this.prisma.carta.create({
      data,
    });
  }

  async update(id: number, data: any) {
    return this.prisma.carta.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.carta.delete({
      where: { id },
    });
  }
}