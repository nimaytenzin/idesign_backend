import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerDetailsDto } from './dto/customer-details.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(Customer)
    private customerModel: typeof Customer,
  ) {}

  async createCustomer(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    // Validate that at least name or email is provided
    if (!createCustomerDto.name && !createCustomerDto.email) {
      throw new BadRequestException(
        'Customer must have at least a name or email',
      );
    }
    return this.customerModel.create(createCustomerDto);
  }

  /**
   * Find or create customer based on email, name, or phone
   * Used by order service when creating orders
   */
  async findOrCreateCustomer(
    customerDetails: CustomerDetailsDto,
  ): Promise<Customer> {
    // Try to find existing customer by email (if provided)
    if (customerDetails.email) {
      const existingCustomer = await this.customerModel.findOne({
        where: { email: customerDetails.email },
      });
      if (existingCustomer) {
        // Update customer details if provided
        const updateData: any = {};
        if (customerDetails.name) updateData.name = customerDetails.name;
        if (customerDetails.phoneNumber)
          updateData.phoneNumber = customerDetails.phoneNumber;
        if (customerDetails.shippingAddress)
          updateData.shippingAddress = customerDetails.shippingAddress;
        if (customerDetails.billingAddress)
          updateData.billingAddress = customerDetails.billingAddress;

        if (Object.keys(updateData).length > 0) {
          await existingCustomer.update(updateData);
          return existingCustomer.reload();
        }
        return existingCustomer;
      }
    }

    // Try to find by phone number (if email not found and phone provided)
    if (customerDetails.phoneNumber && !customerDetails.email) {
      const existingCustomer = await this.customerModel.findOne({
        where: { phoneNumber: customerDetails.phoneNumber },
      });
      if (existingCustomer) {
        // Update customer details if provided
        const updateData: any = {};
        if (customerDetails.name) updateData.name = customerDetails.name;
        if (customerDetails.email) updateData.email = customerDetails.email;
        if (customerDetails.shippingAddress)
          updateData.shippingAddress = customerDetails.shippingAddress;
        if (customerDetails.billingAddress)
          updateData.billingAddress = customerDetails.billingAddress;

        if (Object.keys(updateData).length > 0) {
          await existingCustomer.update(updateData);
          return existingCustomer.reload();
        }
        return existingCustomer;
      }
    }

    // Create new customer if not found
    // Validate that at least name is provided for new customer
    if (!customerDetails.name && !customerDetails.email) {
      throw new BadRequestException(
        'Customer must have at least a name or email',
      );
    }

    return this.customerModel.create(customerDetails);
  }

  async findAllCustomers(): Promise<Customer[]> {
    return this.customerModel.findAll({
      order: [['name', 'ASC']],
    });
  }

  async findOneCustomer(id: number): Promise<Customer> {
    const customer = await this.customerModel.findByPk(id);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async findCustomerByPhoneNumber(phoneNumber: string): Promise<Customer | null> {
    return this.customerModel.findOne({
      where: { phoneNumber },
    });
  }

  async updateCustomer(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    const customer = await this.findOneCustomer(id);
    await customer.update(updateCustomerDto);
    return this.findOneCustomer(id);
  }

  async removeCustomer(id: number): Promise<void> {
    const customer = await this.findOneCustomer(id);
    await customer.destroy();
  }
}

