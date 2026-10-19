import { Injectable } from '@nestjs/common';
import type {
  ShippingOption,
  ShippingProvider,
  ShippingQuoteInput,
} from '../shipping-provider.interface';

/**
 * Provider temporal de desarrollo. Los valores son fixtures técnicas y NO
 * representan tarifas comerciales reales. Ignora por completo el contenido del
 * input (código postal, items) y es determinista.
 */
@Injectable()
export class MockShippingProvider implements ShippingProvider {
  quote(input: ShippingQuoteInput): Promise<ShippingOption[]> {
    void input;
    const options: ShippingOption[] = [
      {
        provider: 'mock',
        service: 'standard',
        label: 'Envío estándar',
        cost: '1000.00',
        currency: 'ARS',
        estimatedDeliveryDays: 5,
      },
      {
        provider: 'mock',
        service: 'express',
        label: 'Envío express',
        cost: '2000.00',
        currency: 'ARS',
        estimatedDeliveryDays: 2,
      },
    ];

    return Promise.resolve(options);
  }
}
