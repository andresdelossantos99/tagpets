import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import type { ShippingQuoteInput } from '../shipping-provider.interface';

export class ShippingQuoteItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class ShippingQuoteDto implements ShippingQuoteInput {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, {
    message: 'postalCode no puede estar compuesto solo por espacios',
  })
  postalCode: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ShippingQuoteItemDto)
  items: ShippingQuoteItemDto[];
}
