import { PartialType } from '@nestjs/mapped-types';
import { CreateCompanyClientDto } from './create-company-client.dto';

export class UpdateCompanyClientDto extends PartialType(CreateCompanyClientDto) {}

