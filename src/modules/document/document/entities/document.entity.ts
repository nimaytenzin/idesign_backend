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
import { DocumentSubCategory } from '../../document-sub-category/entities/document-sub-category.entity';
import { User } from 'src/modules/auth/entities/user.entity';

@Table({
  tableName: 'documents',
  timestamps: true,
})
export class Document extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  documentId: number;

  @ForeignKey(() => DocumentSubCategory)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onDelete: 'CASCADE',
  })
  subCategoryId: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  documentTitle: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  fileName: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  fileUrl: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
  })
  fileSize: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  fileType: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  versionNumber: number;

  @BelongsTo(() => DocumentSubCategory)
  subCategory: DocumentSubCategory;

  @BelongsTo(() => User)
  user: User;
}


