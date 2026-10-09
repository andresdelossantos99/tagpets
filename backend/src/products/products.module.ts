import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductPersonalizationService } from './product-personalization.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductPersonalizationService],
  exports: [ProductPersonalizationService],
})
export class ProductsModule {}
