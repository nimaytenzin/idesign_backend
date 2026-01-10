import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Discount } from './discount.entity';
import { Product } from '../../product/entities/product.entity';

@Table({ 
  indexes: [
    {
      unique: true,
      fields: ['discountId', 'productId'],
    },
  ],
})
export class DiscountProduct extends Model<DiscountProduct> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => Discount)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  discountId: number;

  @ForeignKey(() => Product)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  productId: number;

  @BelongsTo(() => Discount)
  discount: Discount;

  @BelongsTo(() => Product)
  product: Product;
}

