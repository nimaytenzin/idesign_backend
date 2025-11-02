import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator';

export class ProductQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsIn(['price_asc', 'price_desc', 'newest', 'rating', 'best_selling', 'size'])
  sortBy?: string;

  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsBoolean()
  availability?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}
