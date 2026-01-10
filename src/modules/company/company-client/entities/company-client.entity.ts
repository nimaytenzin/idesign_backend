import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Default,
} from 'sequelize-typescript';

@Table
export class CompanyClient extends Model<CompanyClient> {
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
    type: DataType.STRING(500),
    allowNull: true,
  })
  websiteUrl: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  socialMediaUrl: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  logo: string;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isActive: boolean;
}

