export class BFSResponse {
  static responseCodes: { [key: string]: string } = {
    '00': 'Approved',
    '03': 'Invalid Beneficiary',
    '05': 'Beneficiary Account Closed',
    '12': 'Invalid Transaction',
    '13': 'Invalid Amount',
    '14': 'Invalid Remitter Account',
    '20': 'Invalid Response',
    '30': 'Transaction Not Supported Or Format Error',
    '45': 'Duplicate Beneficiary Order Number',
    '47': 'Invalid Currency',
    '48': 'Transaction Limit Exceeded',
    '51': 'Insufficient Funds',
    '53': 'No Savings Account',
    '57': 'Transaction Not Permitted',
    '61': 'Withdrawal Limit Exceeded',
    '65': 'Withdrawal Frequency Exceeded',
    '76': 'Transaction Not Found',
    '78': 'Decryption Failed',
    '80': 'Buyer Cancel Transaction',
    '84': 'Invalid Transaction Type',
    '85': 'Internal Error At Bank System',
    BC: 'Transaction Cancelled By Customer',
    FE: 'Internal Error',
    OA: 'Session Timeout at BFS Secure Entry Page',
    OE: 'Transaction Rejected As Not In Operating Hours',
    OF: 'Transaction Timeout',
    SB: 'Invalid Beneficiary Bank Code',
    XE: 'Invalid Message',
    XT: 'Invalid Transaction Type',
    '91': 'Unknown Error Code.Amount Deducted. Record failed to updated in BFS',
    UN: 'unkonwn error',
    '55': 'Wrong OTP entered during debit request',
  };

  static getResponseDescription(code): string {
    return this.responseCodes[code];
  }
  static isSuccess(code: string): boolean {
    return code === '00'; // Only '00' indicates success
  }
}
