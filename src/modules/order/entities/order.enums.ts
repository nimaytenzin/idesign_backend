export enum FulfillmentStatus {
  PLACED = 'PLACED',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',
  CANCELED = 'CANCELED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

export enum AffiliatePaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

export enum PaymentMethod {
  CASH = 'CASH',
  MBOB = 'MBOB',
  BDB_EPAY = 'BDB_EPAY',
  TPAY = 'TPAY',
  BNB_MPAY = 'BNB_MPAY',
  ZPSS = 'ZPSS',
}

export enum OrderType {
  COUNTER = 'COUNTER',
  ONLINE = 'ONLINE',
}

