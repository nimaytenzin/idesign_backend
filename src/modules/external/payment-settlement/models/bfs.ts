class FormDataExport {
  toFormData(): URLSearchParams {
    const formData = new URLSearchParams();
    const keys = Object.keys(this);
    keys.forEach((key, idx) => {
      formData.append(key, this[key]);
    });
    return formData;
  }
}

//Send AR(Authorization request) and receive RC(Request Confirmation) message (bankList + Txn ID) as response
interface IBfsARReqeust {
  bfs_msgType: string;
  bfs_benfTxnTime: string;
  bfs_orderNo: string;
  bfs_benfId: string;
  bfs_benfBankCode: string;
  bfs_txnCurrency: string;
  bfs_txnAmount: string;
  bfs_remitterEmail: string;
  bfs_paymentDesc: string;
  bfs_checkSum: string;
  bfs_version: string;
}
export class RCMessage {
  bfs_bfsTxnId: string;
  bfs_responseDesc: string;
  bfs_bankList: PGBank[];
  bfs_responseCode: string;
  bfs_msgType: string;
}

export interface ClientARRequest {
  amount: number;
  paymentAdviceIds: number[];
}

// send AE (Account Enquiry) Request(Account validation request) and receive EC(Enquiry Confirmation) message
export interface IAERequest {
  bfs_benfId: string;
  bfs_bfsTxnId: string;
  bfs_msgType: string;
  bfs_remitterAccNo: string;
  bfs_remitterBankId: string;
  bfs_checkSum: string;
}

export interface ClientAERequest {
  transactionId: string;
  bankCode: string;
  accountNumber: string;
}

export interface ECMessage {
  bfs_bfsTxnId: string;
  bfs_responseDesc: string;
  bfs_responseCode: string;
  bfs_msgType: string;
}

//Send DR (Debit Request) Request (OTP Validation) and get AC(Authorization confirmation) message(final Acknowledgement)
export interface IDRRequest {
  bfs_benfId: string;
  bfs_bfsTxnId: string;
  bfs_msgType: string;
  bfs_remitterOtp: string;
  bfs_checkSum: string;
}

export interface ClientDRRequest {
  transactionId: string;
  otp: string;
}

export class ACMessage {
  bfs_bfsTxnId: string;
  bfs_debitAuthNo: string;
  bfs_bfsTxnTime: string;
  bfs_orderNo: string;
  bfs_debitAuthCode: string;
  bfs_txnAmount: string;
}

//other interfaces

export class PGBank {
  bankCode: string;
  bankName: string;
  status: string;
}

export class DRRequest extends FormDataExport implements IDRRequest {
  constructor(benfId: string, txnId: string, otp: string) {
    super();
    this.bfs_benfId = benfId;
    this.bfs_bfsTxnId = txnId;
    this.bfs_remitterOtp = otp;
  }
  bfs_benfId: string;
  bfs_bfsTxnId: string;
  bfs_checkSum: string;
  bfs_msgType = 'DR';
  bfs_remitterOtp: string;
}
export class BfsARRequest extends FormDataExport implements IBfsARReqeust {
  constructor(
    amount: string,
    benfId: string,
    bankCode: string,
    txnTime: string,
    orderNo: string,
    description: string,
  ) {
    super();
    this.bfs_txnAmount = amount;
    this.bfs_benfId = benfId;
    this.bfs_benfBankCode = bankCode;
    this.bfs_benfTxnTime = txnTime;
    this.bfs_orderNo = orderNo;
    this.bfs_paymentDesc = description;
  }
  bfs_msgType = 'AR';
  bfs_benfTxnTime: string;
  bfs_orderNo: string;
  bfs_benfId: string;
  bfs_benfBankCode: string;
  bfs_txnCurrency = 'BTN';
  bfs_txnAmount: string;
  bfs_remitterEmail = 'customer@gmail.com';
  bfs_paymentDesc: string;
  bfs_checkSum: string;
  bfs_version = '1.0';
}

export class ASRequest extends FormDataExport implements IBfsARReqeust {
  constructor(
    amount: string,
    benfId: string,
    bankCode: string,
    txnTime: string,
    orderNo: string,
  ) {
    super();
    this.bfs_txnAmount = amount;
    this.bfs_benfId = benfId;
    this.bfs_benfBankCode = bankCode;
    this.bfs_benfTxnTime = txnTime;
    this.bfs_orderNo = orderNo;
  }
  bfs_msgType = 'AS';
  bfs_benfTxnTime: string;
  bfs_orderNo: string;
  bfs_benfId: string;
  bfs_benfBankCode: string;
  bfs_txnCurrency = 'BTN';
  bfs_txnAmount: string;
  bfs_remitterEmail = 'customer@gmail.com';
  bfs_paymentDesc = 'OrderPayment';
  bfs_checkSum: string;
  bfs_version = '1.0';
}

export class AERequest extends FormDataExport implements IAERequest {
  constructor(
    benfId: string,
    txnId: string,
    accountNo: string,
    bankId: string,
  ) {
    super();
    this.bfs_benfId = benfId;
    this.bfs_bfsTxnId = txnId;
    this.bfs_remitterAccNo = accountNo;
    this.bfs_remitterBankId = bankId;
  }
  bfs_benfId: string;
  bfs_bfsTxnId: string;
  bfs_msgType = 'AE';
  bfs_remitterAccNo: string;
  bfs_remitterBankId: string;
  bfs_checkSum: string;
}
