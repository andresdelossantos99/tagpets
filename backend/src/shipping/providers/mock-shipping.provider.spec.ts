import type { ShippingQuoteInput } from '../shipping-provider.interface';
import { MockShippingProvider } from './mock-shipping.provider';

describe('MockShippingProvider', () => {
  let provider: MockShippingProvider;

  const input: ShippingQuoteInput = {
    postalCode: '1900',
    items: [{ productId: '5e86620b-c445-461d-8c14-289e6f506bb2', quantity: 1 }],
  };

  beforeEach(() => {
    provider = new MockShippingProvider();
  });

  it('devuelve exactamente dos opciones', async () => {
    const options = await provider.quote(input);

    expect(options).toHaveLength(2);
  });

  it('la opción standard tiene provider mock, cost "1000.00", ARS y 5 días', async () => {
    const options = await provider.quote(input);
    const standard = options.find((option) => option.service === 'standard');

    expect(standard).toEqual({
      provider: 'mock',
      service: 'standard',
      label: 'Envío estándar',
      cost: '1000.00',
      currency: 'ARS',
      estimatedDeliveryDays: 5,
    });
  });

  it('la opción express tiene provider mock, cost "2000.00", ARS y 2 días', async () => {
    const options = await provider.quote(input);
    const express = options.find((option) => option.service === 'express');

    expect(express).toEqual({
      provider: 'mock',
      service: 'express',
      label: 'Envío express',
      cost: '2000.00',
      currency: 'ARS',
      estimatedDeliveryDays: 2,
    });
  });

  it('es determinista: llamadas repetidas producen la misma respuesta', async () => {
    const first = await provider.quote(input);
    const second = await provider.quote(input);

    expect(second).toEqual(first);
  });

  it('devuelve objetos nuevos en cada llamada (sin estado compartido mutable)', async () => {
    const first = await provider.quote(input);
    first[0].cost = '0.00';

    const second = await provider.quote(input);

    expect(second[0].cost).toBe('1000.00');
  });
});
