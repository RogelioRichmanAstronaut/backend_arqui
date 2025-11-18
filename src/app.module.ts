import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { validateEnv } from './config/env.validation';
import { ClientsModule } from './modules/clients/clients.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/observability/health.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { CartModule } from './modules/cart/cart.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      validate: validateEnv,
     }),
    AuthModule,
    HealthModule,
    PrismaModule,
    ClientsModule,
    ReservationsModule,
    PaymentsModule,
    BookingsModule,
    CheckoutModule,
    CartModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
