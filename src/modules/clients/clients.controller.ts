import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dtos/create-client.dto';
import { UpdateClientDto } from './dtos/update-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Post()
  create(@Body() dto: CreateClientDto) {
    return this.service.create(dto);
  }

  @Get('me')
  async getMyProfile(@Request() req: any) {
    const client = await this.service.findByEmail(req.user.email);
    if (!client) {
      // Retornar null en lugar de 404 para que el frontend pueda crear el cliente
      return null;
    }
    return client;
  }

  @Patch('me')
  async updateMyProfile(@Request() req: any, @Body() dto: UpdateClientDto) {
    const client = await this.service.findByEmail(req.user.email);
    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }
    return this.service.update(client.id, dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.softDelete(id);
  }
}