import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUrl,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateHeroSlideDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  ctaText?: string;

  @IsUrl()
  @IsOptional()
  ctaLink?: string;

  @IsString()
  @IsOptional()
  imageUri?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  order?: number;
}

