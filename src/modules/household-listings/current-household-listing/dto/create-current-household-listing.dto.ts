import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateCurrentHouseholdListingDto {
  @IsInt()
  @IsNotEmpty()
  eaId: number;

  @IsString()
  @IsNotEmpty()
  structureNumber: string;

  @IsString()
  @IsNotEmpty()
  householdIdentification: string;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  householdSerialNumber: number;

  @IsString()
  @IsNotEmpty()
  nameOfHOH: string;

  @IsInt()
  @IsNotEmpty()
  @Min(0)
  totalMale: number;

  @IsInt()
  @IsNotEmpty()
  @Min(0)
  totalFemale: number;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
