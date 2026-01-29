import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  HasMany,
  Default,
} from 'sequelize-typescript';
import { ProductSubCategory } from '../../product-sub-category/entities/product-sub-category.entity';
import { ProductImage } from './product-image.entity';
import { DiscountProduct } from '../../discount/entities/discount-product.entity';

@Table
export class Product extends Model<Product> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  shortDescription: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  detailedDescription: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  dimensions: string;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  weight: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  price: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  material: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isAvailable: boolean;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isFeatured: boolean;

  @ForeignKey(() => ProductSubCategory)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  productSubCategoryId: number;

  @Default(0)
  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    defaultValue: 0,
  })
  rating: number;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  salesCount: number;

  @BelongsTo(() => ProductSubCategory)
  productSubCategory: ProductSubCategory;

  @HasMany(() => ProductImage)
  images: ProductImage[];

  @HasMany(() => DiscountProduct)
  discountProducts: DiscountProduct[];
}
