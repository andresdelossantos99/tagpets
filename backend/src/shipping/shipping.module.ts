import { Module } from '@nestjs/common';
import { MockShippingProvider } from './providers/mock-shipping.provider';
import { SHIPPING_PROVIDER } from './shipping.constants';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';

@Module({
  controllers: [ShippingController],
  providers: [
    ShippingService,
    {
      provide: SHIPPING_PROVIDER,
      useClass: MockShippingProvider,
    },
  ],
  exports: [ShippingService],
})
export class ShippingModule {}
