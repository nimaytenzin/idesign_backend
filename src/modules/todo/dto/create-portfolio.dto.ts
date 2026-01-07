import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreatePortfolioDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;
}

