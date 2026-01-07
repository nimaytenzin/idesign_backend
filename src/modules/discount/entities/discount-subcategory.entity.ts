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
import { ProductSubCategory } from '../../product-sub-category/entities/product-sub-category.entity';

@Table({ 
  tableName: 'discount_subcategories',
  indexes: [
    {
      unique: true,
      fields: ['discountId', 'subCategoryId'],
    },
  ],
})
export class DiscountSubcategory extends Model<DiscountSubcategory> {
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

  @ForeignKey(() => ProductSubCategory)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  subCategoryId: number;

  @BelongsTo(() => Discount)
  discount: Discount;

  @BelongsTo(() => ProductSubCategory)
  subCategory: ProductSubCategory;
}

