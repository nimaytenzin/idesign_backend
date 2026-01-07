import { Transaction } from '../transaction/entities/transaction.entity';

export interface GeneralLedgerEntry {
  id: number;
  date: string;
  accountCode: string;
  accountName: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  balance: number; // Running balance for this account
  referenceNumber: string | null;
  sourceType: 'ORDER' | 'EXPENSE' | 'MANUAL';
  sourceId: number | null; // Order ID or Expense ID
  sourceReference: string | null; // Order number or expense receipt number
}

export class GeneralLedgerResponseDto {
  period: {
    startDate: string | null;
    endDate: string | null;
  };
  totalTransactions: number;
  entries: GeneralLedgerEntry[];
  summary: {
    totalDebits: number;
    totalCredits: number;
    netBalance: number;
  };
  accounts: {
    accountCode: string;
    accountName: string;
    totalDebits: number;
    totalCredits: number;
    balance: number;
  }[];
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
