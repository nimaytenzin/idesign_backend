import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsIn,
} from 'class-validator';

export class CreateProductImageDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsString()
  @IsNotEmpty()
  imagePath: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsIn(['portrait', 'landscape', 'square'])
  @IsOptional()
  orientation?: 'portrait' | 'landscape' | 'square';

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsString()
  @IsOptional()
  altText?: string;
}
