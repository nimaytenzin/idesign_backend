import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
  DefaultValuePipe,
  NotFoundException,
} from '@nestjs/common';
import { BankAccountService } from './bank-account.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { BankAccount } from './entities/bank-account.entity';

@Controller('bank-accounts')
export class BankAccountController {
  constructor(private readonly bankAccountService: BankAccountService) {}

  @Post()
  create(@Body() dto: CreateBankAccountDto): Promise<BankAccount> {
    return this.bankAccountService.create(dto);
  }

  @Get()
  findAll(
    @Query('activeOnly', new DefaultValuePipe(false), ParseBoolPipe)
    activeOnly: boolean,
  ): Promise<BankAccount[]> {
    return this.bankAccountService.findAll(activeOnly);
  }

  /** Account used for RMA PG / online purchases. At most one. 404 if none set. */
  @Get('rma-pg')
  async findRmaPg(): Promise<BankAccount> {
    const a = await this.bankAccountService.findRmaPgAccount();
    if (!a) throw new NotFoundException('No bank account set for RMA PG / online purchases');
    return a;
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<BankAccount> {
    return this.bankAccountService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBankAccountDto,
  ): Promise<BankAccount> {
    return this.bankAccountService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.bankAccountService.remove(id);
  }
}
