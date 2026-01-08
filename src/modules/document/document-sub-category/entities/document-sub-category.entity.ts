import {
  Column,
  DataType,
  Model,
  Table,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { DocumentCategory } from '../../document-category/entities/document-category.entity';
import { Document } from '../../document/entities/document.entity';

@Table({
  tableName: 'document_sub_categories',
  timestamps: true,
})
export class DocumentSubCategory extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  subCategoryId: number;

  @ForeignKey(() => DocumentCategory)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  categoryId: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  subCategoryName: string;

  @BelongsTo(() => DocumentCategory)
  category: DocumentCategory;

  @HasMany(() => Document)
  documents: Document[];
}

