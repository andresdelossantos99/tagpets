import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

function toStrictBoolean({ value }: { value: unknown }) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

export class PublicProductsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 12;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Transform(toStrictBoolean)
  @IsBoolean()
  featured?: boolean;
}
