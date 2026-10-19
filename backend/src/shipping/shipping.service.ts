import { Inject, Injectable } from '@nestjs/common';
import { SHIPPING_PROVIDER } from './shipping.constants';
import type {
  ShippingOption,
  ShippingProvider,
  ShippingQuoteInput,
} from './shipping-provider.interface';

@Injectable()
export class ShippingService {
  constructor(
    @Inject(SHIPPING_PROVIDER) private readonly provider: ShippingProvider,
  ) {}

  quote(input: ShippingQuoteInput): Promise<ShippingOption[]> {
    return this.provider.quote({
      postalCode: input.postalCode,
      items: input.items.map(({ productId, quantity }) => ({
        productId,
        quantity,
      })),
    });
  }
}
