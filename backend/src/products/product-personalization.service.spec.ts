import { BadRequestException } from '@nestjs/common';
import { ProductPersonalizationService } from './product-personalization.service';
import { ProductPersonalizationConfigDto } from './dto/product-personalization-config.dto';

describe('ProductPersonalizationService', () => {
  let service: ProductPersonalizationService;

  const validConfig: ProductPersonalizationConfigDto = {
    enabled: true,
    fields: [
      {
        key: 'petName',
        label: 'Nombre de la mascota',
        type: 'text',
        required: true,
        maxLength: 20,
      },
      { key: 'phone', label: 'Teléfono', type: 'tel', required: true },
    ],
  };

  beforeEach(() => {
    service = new ProductPersonalizationService();
  });

  describe('assertValidConfig', () => {
    it('acepta una configuración válida con enabled=true', () => {
      expect(() => service.assertValidConfig(validConfig)).not.toThrow();
    });

    it('rechaza enabled=true con fields vacío', () => {
      expect(() =>
        service.assertValidConfig({ enabled: true, fields: [] }),
      ).toThrow(BadRequestException);
    });

    it('rechaza keys duplicadas', () => {
      const config: ProductPersonalizationConfigDto = {
        enabled: true,
        fields: [
          { key: 'petName', label: 'A', type: 'text', required: true },
          { key: 'petName', label: 'B', type: 'text', required: false },
        ],
      };

      expect(() => service.assertValidConfig(config)).toThrow(
        BadRequestException,
      );
    });

    it('permite enabled=false conservando fields', () => {
      const config: ProductPersonalizationConfigDto = {
        enabled: false,
        fields: validConfig.fields,
      };

      expect(() => service.assertValidConfig(config)).not.toThrow();
    });
  });

  describe('validatePayload', () => {
    it('producto sin config + payload undefined -> válido', () => {
      expect(service.validatePayload(undefined, undefined)).toBeUndefined();
    });

    it('producto sin config + {} -> válido', () => {
      expect(service.validatePayload(undefined, {})).toBeUndefined();
    });

    it('producto sin config + payload con campos -> BadRequestException', () => {
      expect(() =>
        service.validatePayload(undefined, { petName: 'Milo' }),
      ).toThrow(BadRequestException);
    });

    it('enabled=false + payload con campos -> BadRequestException', () => {
      const config: ProductPersonalizationConfigDto = {
        enabled: false,
        fields: validConfig.fields,
      };

      expect(() =>
        service.validatePayload(config, { petName: 'Milo' }),
      ).toThrow(BadRequestException);
    });

    it('campo required faltante -> BadRequestException', () => {
      expect(() =>
        service.validatePayload(validConfig, { petName: 'Milo' }),
      ).toThrow(BadRequestException);
    });

    it('required con "" -> BadRequestException', () => {
      expect(() =>
        service.validatePayload(validConfig, {
          petName: '',
          phone: '2804123456',
        }),
      ).toThrow(BadRequestException);
    });

    it('required con solo espacios -> BadRequestException', () => {
      expect(() =>
        service.validatePayload(validConfig, {
          petName: '   ',
          phone: '2804123456',
        }),
      ).toThrow(BadRequestException);
    });

    it('valor no-string -> BadRequestException', () => {
      expect(() =>
        service.validatePayload(validConfig, {
          petName: 123,
          phone: '2804123456',
        }),
      ).toThrow(BadRequestException);
    });

    it('maxLength excedido -> BadRequestException', () => {
      expect(() =>
        service.validatePayload(validConfig, {
          petName: 'Un nombre demasiado largo para el límite',
          phone: '2804123456',
        }),
      ).toThrow(BadRequestException);
    });

    it('valor exactamente igual a maxLength -> válido', () => {
      const exact = 'x'.repeat(20);

      const result = service.validatePayload(validConfig, {
        petName: exact,
        phone: '2804123456',
      });

      expect(result).toEqual({ petName: exact, phone: '2804123456' });
    });

    it('campo desconocido -> BadRequestException', () => {
      expect(() =>
        service.validatePayload(validConfig, {
          petName: 'Milo',
          phone: '2804123456',
          color: 'rojo',
        }),
      ).toThrow(BadRequestException);
    });

    it('payload text válido -> válido', () => {
      const result = service.validatePayload(validConfig, {
        petName: 'Milo',
        phone: '2804123456',
      });

      expect(result).toEqual({ petName: 'Milo', phone: '2804123456' });
    });

    it('payload tel válido como string -> válido', () => {
      const result = service.validatePayload(validConfig, {
        petName: 'Milo',
        phone: '2804123456',
      });

      expect(result?.phone).toBe('2804123456');
    });

    it('payload Array -> BadRequestException', () => {
      expect(() => service.validatePayload(validConfig, [] as unknown)).toThrow(
        BadRequestException,
      );
    });
  });
});
