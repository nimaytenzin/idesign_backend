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
import { ProductCategory } from '../../product-category/entities/product-category.entity';

@Table({ 
  indexes: [
    {
      unique: true,
      fields: ['discountId', 'categoryId'],
    },
  ],
})
export class DiscountCategory extends Model<DiscountCategory> {
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

  @ForeignKey(() => ProductCategory)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  categoryId: number;

  @BelongsTo(() => Discount)
  discount: Discount;

  @BelongsTo(() => ProductCategory)
  category: ProductCategory;
}

