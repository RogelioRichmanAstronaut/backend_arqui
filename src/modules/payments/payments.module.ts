import { Module, forwardRef } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { BankSignatureService } from './services/bank-signature.service';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [PrismaModule, forwardRef(() => BookingsModule)],
  controllers: [PaymentsController],
  providers: [PaymentsService, BankSignatureService],
  exports: [PaymentsService],
})
export class PaymentsModule {}