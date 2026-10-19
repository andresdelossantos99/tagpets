import { Test } from '@nestjs/testing';
import { SHIPPING_PROVIDER } from './shipping.constants';
import type {
  ShippingOption,
  ShippingQuoteInput,
} from './shipping-provider.interface';
import { ShippingService } from './shipping.service';

describe('ShippingService', () => {
  let service: ShippingService;

  const quoteMock = jest.fn();
  const providerMock = { quote: quoteMock };

  const productId = '5e86620b-c445-461d-8c14-289e6f506bb2';

  const providerOptions: ShippingOption[] = [
    {
      provider: 'fake-provider',
      service: 'standard',
      label: 'Opción de prueba',
      cost: '1234.56',
      currency: 'ARS',
      estimatedDeliveryDays: 7,
    },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ShippingService,
        { provide: SHIPPING_PROVIDER, useValue: providerMock },
      ],
    }).compile();

    service = moduleRef.get(ShippingService);
  });

  it('delega la cotización al provider registrado con SHIPPING_PROVIDER', async () => {
    quoteMock.mockResolvedValue(providerOptions);

    const input: ShippingQuoteInput = {
      postalCode: '1900',
      items: [{ productId, quantity: 1 }],
    };

    await service.quote(input);

    expect(quoteMock).toHaveBeenCalledTimes(1);
  });

  it('pasa postalCode e items tal cual, preservando productIds repetidos', async () => {
    quoteMock.mockResolvedValue(providerOptions);

    await service.quote({
      postalCode: '1900',
      items: [
        { productId, quantity: 2 },
        { productId, quantity: 1 },
      ],
    });

    expect(quoteMock).toHaveBeenCalledWith({
      postalCode: '1900',
      items: [
        { productId, quantity: 2 },
        { productId, quantity: 1 },
      ],
    });
  });

  it('no reenvía propiedades ajenas al contrato (precios, costos, etc.)', async () => {
    quoteMock.mockResolvedValue(providerOptions);

    const inputWithExtras = {
      postalCode: '1900',
      shippingCost: '1',
      items: [{ productId, quantity: 1, price: '10.00' }],
    };

    await service.quote(inputWithExtras);

    expect(quoteMock).toHaveBeenCalledWith({
      postalCode: '1900',
      items: [{ productId, quantity: 1 }],
    });
  });

  it('devuelve las opciones entregadas por el provider sin transformarlas', async () => {
    quoteMock.mockResolvedValue(providerOptions);

    const result = await service.quote({
      postalCode: '1900',
      items: [{ productId, quantity: 1 }],
    });

    expect(result).toEqual(providerOptions);
    expect(result[0].cost).toBe('1234.56');
  });

  it('funciona con cualquier implementación de ShippingProvider, no solo con el mock', async () => {
    const otherOptions: ShippingOption[] = [
      {
        provider: 'otro-proveedor',
        service: 'prioritario',
        label: 'Prioritario',
        cost: '999.99',
        currency: 'ARS',
        estimatedDeliveryDays: 1,
      },
    ];
    quoteMock.mockResolvedValue(otherOptions);

    const result = await service.quote({
      postalCode: '8000',
      items: [{ productId, quantity: 3 }],
    });

    expect(result).toEqual(otherOptions);
  });

  it('propaga los errores del provider sin capturarlos', async () => {
    quoteMock.mockRejectedValue(new Error('provider caído'));

    await expect(
      service.quote({
        postalCode: '1900',
        items: [{ productId, quantity: 1 }],
      }),
    ).rejects.toThrow('provider caído');
  });
});
