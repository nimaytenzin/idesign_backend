import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  async createCustomer(
    @Body() createCustomerDto: CreateCustomerDto,
  ): Promise<Customer> {
    return this.customerService.createCustomer(createCustomerDto);
  }

  @Get()
  async findAllCustomers(): Promise<Customer[]> {
    return this.customerService.findAllCustomers();
  }

  @Get(':id')
  async findOneCustomer(@Param('id') id: string): Promise<Customer> {
    return this.customerService.findOneCustomer(+id);
  }

  @Patch(':id')
  async updateCustomer(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    return this.customerService.updateCustomer(+id, updateCustomerDto);
  }

  @Delete(':id')
  async removeCustomer(@Param('id') id: string): Promise<void> {
    return this.customerService.removeCustomer(+id);
  }
}

