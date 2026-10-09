import { BadRequestException, Injectable } from '@nestjs/common';
import { ProductPersonalizationConfigDto } from './dto/product-personalization-config.dto';

/**
 * Semántica de retorno de validatePayload:
 * - undefined: no hay nada que persistir (el producto no admite personalización
 *   y el payload estaba ausente, era null o era un objeto plano vacío).
 * - Record<string, string>: payload válido, con exactamente los valores
 *   recibidos para cada field definido (sin transformarlos).
 * Cualquier otro caso lanza BadRequestException.
 *
 * El payload es una entrada externa no confiable (en Checkout llegará desde
 * JSON), por eso se recibe como `unknown` y este servicio determina su forma.
 */
@Injectable()
export class ProductPersonalizationService {
  assertValidConfig(config: ProductPersonalizationConfigDto): void {
    if (config.enabled && config.fields.length === 0) {
      throw new BadRequestException(
        'La personalización está habilitada pero no define ningún campo',
      );
    }

    const keys = config.fields.map((field) => field.key);
    const uniqueKeys = new Set(keys);

    if (uniqueKeys.size !== keys.length) {
      throw new BadRequestException(
        'La configuración de personalización tiene keys duplicadas',
      );
    }
  }

  validatePayload(
    config: ProductPersonalizationConfigDto | null | undefined,
    payload: unknown,
  ): Record<string, string> | undefined {
    if (!config || config.enabled !== true) {
      if (payload === undefined || payload === null) {
        return undefined;
      }

      if (!this.isPlainObject(payload)) {
        throw new BadRequestException(
          'El payload de personalización debe ser un objeto',
        );
      }

      if (Object.keys(payload).length === 0) {
        return undefined;
      }

      throw new BadRequestException('Este producto no admite personalización');
    }

    let effectivePayload: Record<string, unknown>;

    if (payload === undefined || payload === null) {
      effectivePayload = {};
    } else if (this.isPlainObject(payload)) {
      effectivePayload = payload;
    } else {
      throw new BadRequestException(
        'El payload de personalización debe ser un objeto',
      );
    }

    const fieldsByKey = new Map(
      config.fields.map((field) => [field.key, field]),
    );

    for (const key of Object.keys(effectivePayload)) {
      if (!fieldsByKey.has(key)) {
        throw new BadRequestException(
          `El campo de personalización "${key}" no está definido para este producto`,
        );
      }
    }

    const entries: Array<[string, string]> = [];

    for (const field of config.fields) {
      const hasValue = Object.prototype.hasOwnProperty.call(
        effectivePayload,
        field.key,
      );

      if (!hasValue) {
        if (field.required) {
          throw new BadRequestException(`El campo "${field.key}" es requerido`);
        }
        continue;
      }

      const value = effectivePayload[field.key];

      if (typeof value !== 'string') {
        throw new BadRequestException(
          `El campo "${field.key}" debe ser un string`,
        );
      }

      if (field.required && value.trim().length === 0) {
        throw new BadRequestException(`El campo "${field.key}" es requerido`);
      }

      if (field.maxLength !== undefined && value.length > field.maxLength) {
        throw new BadRequestException(
          `El campo "${field.key}" supera la longitud máxima de ${field.maxLength}`,
        );
      }

      entries.push([field.key, value]);
    }

    return Object.fromEntries(entries);
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false;
    }

    const prototype = Object.getPrototypeOf(value);

    return prototype === Object.prototype || prototype === null;
  }
}
