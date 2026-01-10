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

export enum OrderSource {
  COUNTER = 'COUNTER',
  ONLINE = 'ONLINE',
}

export enum FulfillmentType {
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP',
  INSTORE = 'INSTORE',
}
