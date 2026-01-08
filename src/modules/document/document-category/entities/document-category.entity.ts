import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  HasMany,
} from 'sequelize-typescript';
import { DocumentSubCategory } from '../../document-sub-category/entities/document-sub-category.entity';

@Table({
  tableName: 'document_categories',
  timestamps: true,
})
export class DocumentCategory extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  categoryId: number;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
    unique: true,
  })
  categoryName: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

   @HasMany(() => DocumentSubCategory)
   documentSubCategories: DocumentSubCategory[];
}