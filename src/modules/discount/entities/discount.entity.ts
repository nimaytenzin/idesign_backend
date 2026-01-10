import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Default,
  CreatedAt,
  UpdatedAt,
  HasMany,
} from 'sequelize-typescript';
import { DiscountProduct } from './discount-product.entity';
import { DiscountCategory } from './discount-category.entity';
import { DiscountSubcategory } from './discount-subcategory.entity';

export enum DiscountType {
  FLAT_ALL_PRODUCTS = 'FLAT_ALL_PRODUCTS',
  FLAT_SELECTED_PRODUCTS = 'FLAT_SELECTED_PRODUCTS',
  FLAT_SELECTED_CATEGORIES = 'FLAT_SELECTED_CATEGORIES',
}

export enum DiscountValueType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum DiscountScope {
  PER_PRODUCT = 'PER_PRODUCT', // Apply to each product
  ORDER_TOTAL = 'ORDER_TOTAL', // Apply to order subtotal
}

@Table
export class Discount extends Model<Discount> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Column({
    type: DataType.ENUM(...Object.values(DiscountType)),
    allowNull: false,
  })
  discountType: DiscountType;

  @Column({
    type: DataType.ENUM(...Object.values(DiscountValueType)),
    allowNull: false,
  })
  valueType: DiscountValueType;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  discountValue: number;

  @Column({
    type: DataType.ENUM(...Object.values(DiscountScope)),
    allowNull: false,
    defaultValue: DiscountScope.PER_PRODUCT,
  })
  discountScope: DiscountScope;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  startDate: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  endDate: Date;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isActive: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  maxUsageCount: number | null; // Optional usage limit

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  minOrderValue: number | null; // Optional minimum order requirement

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  voucherCode: string | null; // Optional voucher code (if requires code)

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  usageCount: number; // Track how many times discount has been used

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  // Relationships
  @HasMany(() => DiscountProduct)
  discountProducts: DiscountProduct[];

  @HasMany(() => DiscountCategory)
  discountCategories: DiscountCategory[];

  @HasMany(() => DiscountSubcategory)
  discountSubcategories: DiscountSubcategory[];
}

