import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { PaymentReceipt } from './entities/payment-receipt.entity';
import { Order } from '../order/entities/order.entity';
import { BankAccount } from '../bank-account/entities/bank-account.entity';
import { PaymentStatus, PaymentMethod } from '../order/entities/order.enums';
import { RecordOrderPaymentDto } from './dto/record-order-payment.dto';

@Injectable()
export class PaymentReceiptService {
  constructor(
    @InjectModel(PaymentReceipt)
    private paymentReceiptModel: typeof PaymentReceipt,
    @InjectModel(Order)
    private orderModel: typeof Order,
    @InjectModel(BankAccount)
    private bankAccountModel: typeof BankAccount,
  ) {}

  private async generatePaymentReceiptNumber(transaction?: any): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PR-${year}-`;

    const last = await this.paymentReceiptModel.findOne({
      where: { receiptNumber: { [Op.like]: `${prefix}%` } },
      order: [['receiptNumber', 'DESC']],
      transaction,
    });

    const sequence = last
      ? parseInt(String(last.receiptNumber).replace(prefix, ''), 10) + 1
      : 1;
    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  /** Sum of PaymentReceipt.amount for an order. */
  async getTotalPaidForOrder(orderId: number, transaction?: any): Promise<number> {
    const rows = await this.paymentReceiptModel.findAll({
      where: { orderId },
      attributes: ['amount'],
      transaction,
    });
    return rows.reduce((s, r) => s + parseFloat(String(r.amount)), 0);
  }

  /**
   * Recompute Order.paymentStatus, paidAt, receiptGenerated, receiptNumber, paymentMethod
   * from PaymentReceipts. Handles legacy: if no PRs but order is PAID with paidAt, leave as-is.
   */
  private async syncOrderPaymentSummaryFromReceipts(
    order: Order,
    transaction?: any,
  ): Promise<void> {
    const totalPaid = await this.getTotalPaidForOrder(order.id, transaction);
    const totalPayable = parseFloat(String(order.totalPayable));

    const receipts = await this.paymentReceiptModel.findAll({
      where: { orderId: order.id },
      order: [['paidAt', 'ASC']],
      transaction,
    });

    // Legacy: no PRs but order already PAID with paidAt -> do not overwrite
    if (receipts.length === 0) {
      if (order.paymentStatus === PaymentStatus.PAID && order.paidAt) {
        return;
      }
      await order.update(
        {
          paymentStatus: PaymentStatus.PENDING,
          paidAt: null,
          receiptGenerated: false,
          receiptNumber: null,
          paymentMethod: null,
        },
        { transaction },
      );
      return;
    }

    const first = receipts[0];
    const last = receipts[receipts.length - 1];

    if (totalPaid >= totalPayable) {
      await order.update(
        {
          paymentStatus: PaymentStatus.PAID,
          paidAt: last.paidAt,
          receiptGenerated: true,
          receiptNumber: first.receiptNumber,
          paymentMethod: last.paymentMethod,
        },
        { transaction },
      );
    } else if (totalPaid > 0) {
      await order.update(
        {
          paymentStatus: PaymentStatus.PARTIAL,
          paidAt: null,
          receiptGenerated: true,
          receiptNumber: first.receiptNumber,
          paymentMethod: last.paymentMethod,
        },
        { transaction },
      );
    } else {
      await order.update(
        {
          paymentStatus: PaymentStatus.PENDING,
          paidAt: null,
          receiptGenerated: false,
          receiptNumber: null,
          paymentMethod: null,
        },
        { transaction },
      );
    }
  }

  /**
   * Create a PaymentReceipt and sync Order payment summary. Use for single or multiple payments.
   * When paymentMethod is not CASH, bankAccountId is required and must reference an existing BankAccount.
   * @param amount - must be <= (totalPayable - totalAlreadyPaid)
   */
  async createPaymentReceipt(
    orderId: number,
    dto: {
      amount: number;
      paymentMethod: PaymentMethod;
      paidAt?: Date;
      transactionId?: string;
      notes?: string;
      bankAccountId?: number;
    },
    transaction?: any,
  ): Promise<PaymentReceipt> {
    const order = await this.orderModel.findByPk(orderId, { transaction });
    if (!order) throw new NotFoundException(`Order with ID ${orderId} not found`);

    const totalPayable = parseFloat(String(order.totalPayable));
    const totalPaid = await this.getTotalPaidForOrder(orderId, transaction);
    const remaining = totalPayable - totalPaid;

    if (remaining <= 0) {
      throw new BadRequestException('Order is already fully paid');
    }
    if (dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }
    if (dto.amount > remaining) {
      throw new BadRequestException(
        `Payment amount ${dto.amount} exceeds remaining balance ${remaining}`,
      );
    }

    let bankAccountId: number | null = null;
    if (dto.paymentMethod !== PaymentMethod.CASH) {
      if (dto.bankAccountId != null && dto.bankAccountId !== undefined) {
        const bank = await this.bankAccountModel.findByPk(dto.bankAccountId, { transaction });
        if (!bank) {
          throw new NotFoundException(`BankAccount with ID ${dto.bankAccountId} not found`);
        }
        bankAccountId = dto.bankAccountId;
      } else {
        // Auto-select the bank account with useForRmaPg (RMA PG / online)
        const rmaAccount = await this.bankAccountModel.findOne({
          where: { useForRmaPg: true },
          transaction,
        });
        if (!rmaAccount) {
          throw new BadRequestException(
            'No bank account with RMA PG (useForRmaPg) is configured. Please set one in Bank Accounts or provide bankAccountId.',
          );
        }
        bankAccountId = rmaAccount.id;
      }
    }

    const paidAt = dto.paidAt || new Date();
    const receiptNumber = await this.generatePaymentReceiptNumber(transaction);

    const pr = await this.paymentReceiptModel.create(
      {
        orderId,
        receiptNumber,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        paidAt,
        notes: dto.notes ?? null,
        bankAccountId,
      },
      { transaction },
    );

    await this.syncOrderPaymentSummaryFromReceipts(order, transaction);
    return pr;
  }

  /**
   * Record a payment (full or partial) for an order. Creates a PaymentReceipt and syncs Order.
   * When paymentMethod is not CASH, bankAccountId is required.
   */
  async recordOrderPayment(orderId: number, dto: RecordOrderPaymentDto): Promise<PaymentReceipt> {
    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
    return this.createPaymentReceipt(orderId, {
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      paidAt,
      transactionId: dto.transactionId,
      notes: dto.notes,
      bankAccountId: dto.bankAccountId,
    });
  }

  /** List PaymentReceipts for an order. */
  async getPaymentReceiptsForOrder(orderId: number): Promise<PaymentReceipt[]> {
    const order = await this.orderModel.findByPk(orderId);
    if (!order) throw new NotFoundException(`Order with ID ${orderId} not found`);
    return this.paymentReceiptModel.findAll({
      where: { orderId },
      include: [{ model: BankAccount, as: 'bankAccount' }],
      order: [['paidAt', 'ASC']],
    });
  }

  /** Get a single PaymentReceipt by id. */
  async findOne(id: number): Promise<PaymentReceipt> {
    const pr = await this.paymentReceiptModel.findByPk(id, {
      include: [{ model: BankAccount, as: 'bankAccount' }],
    });
    if (!pr) throw new NotFoundException(`PaymentReceipt with ID ${id} not found`);
    return pr;
  }
}
