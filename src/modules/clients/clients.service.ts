import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from './dtos/create-client.dto';
import { UpdateClientDto } from './dtos/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientDto) {
    const exists = await this.prisma.client.findFirst({
      where: { clientId: dto.clientId, isDeleted: false },
      select: { id: true },
    });
    if (exists) throw new ConflictException('clientId ya existe');

    return this.prisma.client.create({
      data: {
        clientId: dto.clientId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
      },
    });
  }

  async findById(id: string) {
    const client = await this.prisma.client.findFirst({ where: { id, isDeleted: false } });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
  }

  async findByEmail(email: string) {
    const client = await this.prisma.client.findFirst({ 
      where: { email, isDeleted: false } 
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.ensureExists(id);
    return this.prisma.client.update({
      where: { id },
      data: { ...dto },
    });
  }

  async softDelete(id: string) {
    await this.ensureExists(id);
    return this.prisma.client.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.client.findFirst({ where: { id, isDeleted: false } });
    if (!found) throw new NotFoundException('Cliente no encontrado');
  }
}