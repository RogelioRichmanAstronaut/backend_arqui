import { Global, Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CityMapperService } from './city-mapper.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [CatalogController],
  providers: [CatalogService, CityMapperService],
  exports: [CatalogService, CityMapperService],
})
export class CatalogModule {}

