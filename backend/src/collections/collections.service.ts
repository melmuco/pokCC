import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollezioneDto, UpdateCollezioneDto } from './dto';

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  async findAllByUser(userId: number) {
    return this.prisma.collezione.findMany({
      where: { owner_id: userId },
      include: {
        carte: {
          include: {
            carta: true,
          },
        },
      },
    });
  }

  async findOne(id: number, userId?: number) {
    const collection = await this.prisma.collezione.findUnique({
      where: { id },
      include: {
        carte: {
          include: {
            carta: true,
          },
        },
      },
    });
    if (!collection) return null;
    if (!collection.is_public && collection.owner_id !== userId) {
      throw new UnauthorizedException('Not authorized');
    }
    return collection;
  }

  async create(ownerId: number, data: CreateCollezioneDto) {
    return this.prisma.collezione.create({
      data: {
        ...data,
        owner_id: ownerId,
      },
    });
  }

  async update(id: number, userId: number, data: UpdateCollezioneDto) {
    const collection = await this.prisma.collezione.findUnique({
      where: { id },
    });
    if (!collection || collection.owner_id !== userId) {
      throw new UnauthorizedException('Not authorized');
    }
    return this.prisma.collezione.update({
      where: { id },
      data,
    });
  }

  async remove(id: number, userId: number) {
    const collection = await this.prisma.collezione.findUnique({
      where: { id },
    });
    if (!collection || collection.owner_id !== userId) {
      throw new UnauthorizedException('Not authorized');
    }
    return this.prisma.collezione.delete({
      where: { id },
    });
  }
}