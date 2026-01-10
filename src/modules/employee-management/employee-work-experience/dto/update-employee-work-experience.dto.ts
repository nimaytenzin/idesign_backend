import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeWorkExperienceDto } from './create-employee-work-experience.dto';

export class UpdateEmployeeWorkExperienceDto extends PartialType(CreateEmployeeWorkExperienceDto) {}
