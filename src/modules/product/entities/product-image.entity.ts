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
import { Product } from './product.entity';

@Table({
  tableName: 'product_images',
  timestamps: true,
})
export class ProductImage extends Model<ProductImage> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => Product)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  productId: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  imagePath: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  fileName: string;

  @Column({
    type: DataType.ENUM('portrait', 'landscape', 'square'),
    allowNull: false,
    defaultValue: 'square',
  })
  orientation: 'portrait' | 'landscape' | 'square';

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isPrimary: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  altText: string;

  @BelongsTo(() => Product)
  product: Product;
}
