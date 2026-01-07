import { Transaction } from '../transaction/entities/transaction.entity';

export interface RevenueAccount {
  accountCode: string;
  accountName: string;
  amount: number;
  transactions?: Transaction[];
}

export interface ExpenseAccount {
  accountCode: string;
  accountName: string;
  amount: number;
  transactions?: Transaction[];
}

export class ProfitLossResponseDto {
  period: {
    startDate: string | null;
    endDate: string | null;
  };
  revenue: {
    total: number;
    breakdown?: RevenueAccount[];
  };
  expenses: {
    total: number;
    breakdown?: ExpenseAccount[];
  };
  grossProfit: number;
  grossProfitMargin: number; // Percentage
  netIncome: number;
  netProfitMargin: number; // Percentage
}
