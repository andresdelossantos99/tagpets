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

  const disabledConfig: ProductPersonalizationConfigDto = {
    enabled: false,
    fields: validConfig.fields,
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
      expect(() => service.assertValidConfig(disabledConfig)).not.toThrow();
    });
  });

  describe('validatePayload', () => {
    it('producto sin config + payload undefined -> válido', () => {
      expect(service.validatePayload(undefined, undefined)).toBeUndefined();
    });

    it('producto sin config + payload null -> válido', () => {
      expect(service.validatePayload(null, null)).toBeUndefined();
    });

    it('producto sin config + {} -> válido', () => {
      expect(service.validatePayload(undefined, {})).toBeUndefined();
    });

    it('producto sin config + payload con campos -> BadRequestException', () => {
      expect(() =>
        service.validatePayload(undefined, { petName: 'Milo' }),
      ).toThrow(BadRequestException);
    });

    it('producto sin config + [] -> BadRequestException', () => {
      expect(() => service.validatePayload(undefined, [])).toThrow(
        BadRequestException,
      );
    });

    it('producto sin config + número -> BadRequestException', () => {
      expect(() => service.validatePayload(undefined, 123)).toThrow(
        BadRequestException,
      );
    });

    it.each([[[1]], [true], ['texto'], [{ foo: 'bar' }]])(
      'producto sin config + %p -> BadRequestException',
      (payload) => {
        expect(() => service.validatePayload(undefined, payload)).toThrow(
          BadRequestException,
        );
      },
    );

    it('enabled=false + payload undefined/null/{} -> válido', () => {
      expect(
        service.validatePayload(disabledConfig, undefined),
      ).toBeUndefined();
      expect(service.validatePayload(disabledConfig, null)).toBeUndefined();
      expect(service.validatePayload(disabledConfig, {})).toBeUndefined();
    });

    it('enabled=false + payload con campos -> BadRequestException', () => {
      expect(() =>
        service.validatePayload(disabledConfig, { petName: 'Milo' }),
      ).toThrow(BadRequestException);
    });

    it('enabled=false + [] -> BadRequestException', () => {
      expect(() => service.validatePayload(disabledConfig, [])).toThrow(
        BadRequestException,
      );
    });

    it('rechaza instancias de clase (no son objetos planos)', () => {
      class Foo {}

      expect(() => service.validatePayload(undefined, new Foo())).toThrow(
        BadRequestException,
      );
      expect(() => service.validatePayload(validConfig, new Foo())).toThrow(
        BadRequestException,
      );
    });

    it('enabled=true + payload undefined/null -> se trata como {} y falla por required', () => {
      expect(() => service.validatePayload(validConfig, undefined)).toThrow(
        BadRequestException,
      );
      expect(() => service.validatePayload(validConfig, null)).toThrow(
        BadRequestException,
      );
    });

    it('enabled=true + número -> BadRequestException', () => {
      expect(() => service.validatePayload(validConfig, 123)).toThrow(
        BadRequestException,
      );
    });

    it('enabled=true + string -> BadRequestException', () => {
      expect(() => service.validatePayload(validConfig, 'texto')).toThrow(
        BadRequestException,
      );
    });

    it('enabled=true + boolean -> BadRequestException', () => {
      expect(() => service.validatePayload(validConfig, true)).toThrow(
        BadRequestException,
      );
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
      expect(() => service.validatePayload(validConfig, [])).toThrow(
        BadRequestException,
      );
    });

    describe('keys que coinciden con propiedades de Object.prototype', () => {
      it('field opcional con key "toString" + payload {} -> válido y no lee la propiedad heredada', () => {
        const config: ProductPersonalizationConfigDto = {
          enabled: true,
          fields: [
            { key: 'toString', label: 'Dato', type: 'text', required: false },
          ],
        };

        const result = service.validatePayload(config, {});

        expect(result).toEqual({});
        expect(Object.keys(result ?? {})).toHaveLength(0);
      });

      it('field required con key "toString" + payload {} -> BadRequestException por faltar el campo', () => {
        const config: ProductPersonalizationConfigDto = {
          enabled: true,
          fields: [
            { key: 'toString', label: 'Dato', type: 'text', required: true },
          ],
        };

        expect(() => service.validatePayload(config, {})).toThrow(
          BadRequestException,
        );
        expect(() => service.validatePayload(config, {})).toThrow(
          'es requerido',
        );
      });

      it('key "toString" con propiedad propia en el payload -> válido y devuelve el valor', () => {
        const config: ProductPersonalizationConfigDto = {
          enabled: true,
          fields: [
            { key: 'toString', label: 'Dato', type: 'text', required: true },
          ],
        };

        const result = service.validatePayload(config, { toString: 'valor' });

        expect(Object.prototype.hasOwnProperty.call(result, 'toString')).toBe(
          true,
        );
        expect(result?.['toString']).toBe('valor');
      });

      it('key "__proto__" con propiedad propia en el payload -> el resultado la conserva como propiedad propia', () => {
        const config: ProductPersonalizationConfigDto = {
          enabled: true,
          fields: [
            { key: '__proto__', label: 'Dato', type: 'text', required: true },
          ],
        };
        const payload = Object.fromEntries([['__proto__', 'valor']]);

        const result = service.validatePayload(config, payload);

        expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).toBe(
          true,
        );
        expect(result?.['__proto__']).toBe('valor');
        expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
      });
    });
  });
});
