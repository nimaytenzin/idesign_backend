export class AffiliateMarketerResponseDto {
  id: number;
  name: string;
  cid: string;
  emailAddress: string;
  phoneNumber: string;
  isActive: boolean;
  voucherCode: string | null;
  discountPercentage: number | null;
  commissionPercentage: number | null;
  createdAt: Date;
  updatedAt: Date;
}
