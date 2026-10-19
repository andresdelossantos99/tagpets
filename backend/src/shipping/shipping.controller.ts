import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ShippingQuoteDto } from './dto/shipping-quote.dto';
import type { ShippingOption } from './shipping-provider.interface';
import { ShippingService } from './shipping.service';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  quote(@Body() dto: ShippingQuoteDto): Promise<ShippingOption[]> {
    return this.shippingService.quote(dto);
  }
}
