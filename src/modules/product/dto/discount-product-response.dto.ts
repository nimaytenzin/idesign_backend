import { DiscountResponseDto } from '../../discount/dto/discount-response.dto';

export class DiscountProductResponseDto {
  id: number;
  discountId: number;
  productId: number;
  discount?: DiscountResponseDto;
}

