import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class ProductPersonalizationFieldDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsIn(['text', 'tel'])
  type: 'text' | 'tel';

  @IsBoolean()
  required: boolean;

  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(1)
  maxLength?: number;
}
