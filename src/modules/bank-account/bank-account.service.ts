import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { BankAccount } from './entities/bank-account.entity';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

@Injectable()
export class BankAccountService {
  constructor(
    @InjectModel(BankAccount)
    private bankAccountModel: typeof BankAccount,
  ) {}

  async create(dto: CreateBankAccountDto): Promise<BankAccount> {
    const useForRmaPg = dto.useForRmaPg === true;
    if (useForRmaPg) {
      await this.bankAccountModel.update(
        { useForRmaPg: false },
        { where: { useForRmaPg: true } },
      );
    }
    return this.bankAccountModel.create({
      accountName: dto.accountName,
      bankName: dto.bankName,
      accountNumber: dto.accountNumber,
      isActive: dto.isActive ?? true,
      useForRmaPg: useForRmaPg,
    });
  }

  async findAll(activeOnly?: boolean): Promise<BankAccount[]> {
    const where: { isActive?: boolean } = {};
    if (activeOnly === true) {
      where.isActive = true;
    }
    return this.bankAccountModel.findAll({
      where: Object.keys(where).length ? where : undefined,
      order: [['accountName', 'ASC']],
    });
  }

  async findOne(id: number): Promise<BankAccount> {
    const row = await this.bankAccountModel.findByPk(id);
    if (!row) throw new NotFoundException(`BankAccount with ID ${id} not found`);
    return row;
  }

  /** The single account used for RMA PG / online purchases. At most one. */
  async findRmaPgAccount(): Promise<BankAccount | null> {
    return this.bankAccountModel.findOne({ where: { useForRmaPg: true } });
  }

  async update(id: number, dto: UpdateBankAccountDto): Promise<BankAccount> {
    const row = await this.findOne(id);
    if (dto.useForRmaPg === true) {
      await this.bankAccountModel.update(
        { useForRmaPg: false },
        { where: { useForRmaPg: true, id: { [Op.ne]: id } } },
      );
    }
    await row.update({
      ...(dto.accountName !== undefined && { accountName: dto.accountName }),
      ...(dto.bankName !== undefined && { bankName: dto.bankName }),
      ...(dto.accountNumber !== undefined && { accountNumber: dto.accountNumber }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.useForRmaPg !== undefined && { useForRmaPg: dto.useForRmaPg }),
    });
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const row = await this.findOne(id);
    await row.destroy();
  }
}
