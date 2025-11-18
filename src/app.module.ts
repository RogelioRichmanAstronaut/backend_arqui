import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { validateEnv } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/observability/health.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { MarginsModule } from './modules/margins/margins.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { CartModule } from './modules/cart/cart.module';
import { ReportingModule } from './modules/reporting/reporting.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      validate: validateEnv,
     }),
    // Auth and Observability
    AuthModule,
    HealthModule,
    // Global modules (infrastructure)
    PrismaModule,
    CatalogModule,
    MarginsModule,
    NotificationsModule,
    // Business modules
    ClientsModule,
    ReservationsModule,
    PaymentsModule,
    BookingsModule,
    CheckoutModule,
    CartModule,
    ReportingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
