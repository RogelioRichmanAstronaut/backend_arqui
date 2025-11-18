import { Global, Module } from '@nestjs/common';
import { MarginsService } from './margins.service';

@Global()
@Module({
  providers: [MarginsService],
  exports: [MarginsService],
})
export class MarginsModule {}

