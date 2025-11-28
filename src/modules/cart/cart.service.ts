import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CartAddItemDto, CartItemKindDto } from './dtos/cart-add-item.dto';
import { CartViewResponseDto } from './dtos/cart-response.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureCart(clientId: string, currency: string) {
    const existing = await this.prisma.cart.findFirst({ where: { clientId } });
    if (existing) {
      if (existing.currency.toUpperCase() !== currency.toUpperCase()) {
        throw new BadRequestException('La moneda del carrito existente no coincide');
      }
      return existing;
    }
    return this.prisma.cart.create({ data: { clientId, currency: currency.toUpperCase() } });
  }

  private toView(cart: any): CartViewResponseDto {
    const total = cart.items.reduce((acc: number, it: any) => acc + Number(it.price) * it.quantity, 0);
    return {
      id: cart.id,
      clientId: cart.clientId,
      currency: cart.currency,
      total,
      items: cart.items.map((it: any) => ({
        id: it.id,
        kind: it.kind,
        refId: it.refId,
        quantity: it.quantity,
        price: Number(it.price),
        currency: it.currency,
        metadata: it.metadata ?? {},
      })),
    };
  }

  async addItem(dto: CartAddItemDto): Promise<CartViewResponseDto> {
    const cart = await this.ensureCart(dto.clientId, dto.currency);

    // Validación mínima por tipo
    if (dto.kind === CartItemKindDto.HOTEL) {
      const m = dto.metadata ?? {};
      if (!m.hotelId || !m.roomId || !m.checkIn || !m.checkOut) {
        throw new BadRequestException('metadata para HOTEL requiere hotelId, roomId, checkIn, checkOut');
      }
    } else if (dto.kind === CartItemKindDto.AIR) {
      const m = dto.metadata ?? {};
      if (!m.flightId || !Array.isArray(m.passengers) || m.passengers.length < 1) {
        throw new BadRequestException('metadata para AIR requiere flightId y passengers[]');
      }
    }

    // NOTA: El precio ya incluye comisión (aplicada en búsqueda)
    // Search aplica: 10% hoteles, 5% vuelos
    await this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        kind: dto.kind as any,
        refId: dto.refId,
        quantity: dto.quantity,
        price: dto.price, // Precio YA incluye comisión desde búsqueda
        currency: dto.currency.toUpperCase(),
        metadata: dto.metadata ?? {},
      },
    });

    const fresh = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: true },
    });
    return this.toView(fresh);
  }

  async getCart(clientId: string): Promise<CartViewResponseDto> {
    const cart = await this.prisma.cart.findFirst({
      where: { clientId },
      include: { items: true },
    });
    if (!cart) {
      return { id: '', clientId, currency: 'COP', total: 0, items: [] };
    }
    return this.toView(cart);
  }

  async removeItem(clientId: string, itemId: string): Promise<CartViewResponseDto> {
    const cart = await this.prisma.cart.findFirst({ where: { clientId } });
    if (!cart) throw new NotFoundException('Carrito no encontrado');
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    const fresh = await this.prisma.cart.findUnique({ where: { id: cart.id }, include: { items: true } });
    return this.toView(fresh);
  }

  async clear(clientId: string): Promise<CartViewResponseDto> {
    const cart = await this.prisma.cart.findFirst({ where: { clientId } });
    if (!cart) return { id: '', clientId, currency: 'COP', total: 0, items: [] };
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    const fresh = await this.prisma.cart.findUnique({ where: { id: cart.id }, include: { items: true } });
    return this.toView(fresh);
  }
}