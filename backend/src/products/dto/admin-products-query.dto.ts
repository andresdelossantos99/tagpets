import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

function toStrictBoolean({ value }: { value: unknown }) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

export class AdminProductsQueryDto {
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
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Transform(toStrictBoolean)
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Transform(toStrictBoolean)
  @IsBoolean()
  featured?: boolean;
}
