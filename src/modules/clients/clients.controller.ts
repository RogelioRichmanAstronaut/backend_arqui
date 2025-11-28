import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, Req } from '@nestjs/common';
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
    console.debug('Create client attempt with DTO:', dto);
    return this.service.create(dto);
  }

  /**
   * GET /clients/me - Obtener cliente del usuario autenticado
   * Busca por email del JWT
   */
  @Get('me')
  async getMe(@Req() req: any) {
    const email = req.user?.email;
    console.debug('Get client /me for email:', email);
    if (!email) {
      return null;
    }
    return this.service.findByEmail(email);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    console.debug('Get client attempt for id:', id);
    return this.service.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    console.debug('Update client attempt for id:', id, 'with DTO:', dto);
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    console.debug('Soft delete client attempt for id:', id);
    return this.service.softDelete(id);
  }
}