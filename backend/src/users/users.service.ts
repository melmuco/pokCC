import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.utente.findMany();
  }

  async findOne(id: number) {
    return this.prisma.utente.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: any) {
    return this.prisma.utente.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.utente.delete({
      where: { id },
    });
  }
}
