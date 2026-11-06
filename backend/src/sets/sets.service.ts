import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SetsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.set.findMany();
  }

  async findOne(id: number) {
    return this.prisma.set.findUnique({
      where: { id },
      include: {
        carte: true,
      },
    });
  }

  async findByCode(code: string) {
    return this.prisma.set.findUnique({
      where: { codice: code },
      include: {
        carte: true,
      },
    });
  }

  async create(data: any) {
    return this.prisma.set.create({
      data,
    });
  }

  async update(id: number, data: any) {
    return this.prisma.set.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.set.delete({
      where: { id },
    });
  }
}
