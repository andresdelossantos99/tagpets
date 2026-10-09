import { Type } from 'class-transformer';
import { IsArray, IsBoolean, ValidateNested } from 'class-validator';
import { ProductPersonalizationFieldDto } from './product-personalization-field.dto';

export class ProductPersonalizationConfigDto {
  @IsBoolean()
  enabled: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductPersonalizationFieldDto)
  fields: ProductPersonalizationFieldDto[];
}
