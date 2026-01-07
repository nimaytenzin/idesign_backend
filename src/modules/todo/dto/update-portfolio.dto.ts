import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdatePortfolioDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  name?: string;
}

