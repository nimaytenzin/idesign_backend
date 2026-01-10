import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeProfileDto } from './create-employee-profile.dto';
import { IsDateString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateEmployeeProfileDto extends PartialType(CreateEmployeeProfileDto) {

    @IsDateString()
    @IsOptional()
    terminationDate: Date;

}
