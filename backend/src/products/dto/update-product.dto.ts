import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductPersonalizationConfigDto } from './product-personalization-config.dto';

export class UpdateProductDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message:
      'slug debe estar en minúsculas, usar solo letras, números y guiones, sin espacios',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sku?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  weightGrams?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lengthCm?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  widthCm?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  heightCm?: number | null;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ProductPersonalizationConfigDto)
  personalizationConfig?: ProductPersonalizationConfigDto | null;
}
