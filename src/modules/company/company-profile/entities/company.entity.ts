import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Default,
} from 'sequelize-typescript';

export enum ZpssBankName {
  BOB = 'BOB',
  BNB = 'BNB',
  PNB = 'PNB',
  BDBL = 'BDBL',
  TBANK = 'TBANK',
  DKBANK = 'DKBANK',
}

@Table
export class Company extends Model<Company> {
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
    type: DataType.STRING,
    allowNull: true,
  })
  phone1: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  phone2: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  phone3: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  email: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  address: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  dzongkhag: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  thromde: string;

  @Default('Bhutan')
  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'Bhutan',
  })
  country: string;

  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
  })
  lat: number;

  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
  })
  long: number;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  website: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  tpnNumber: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  businessLicenseNumber: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  slogan: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  facebookLink: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  instagramLink: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  tiktokLink: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  vision: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  mission: string;

  @Column({
    type: DataType.STRING,
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

  @Column({
    type: DataType.ENUM(...Object.values(ZpssBankName)),
    allowNull: true,
  })
  zpssBankName: ZpssBankName;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  zpssAccountName: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  zpssAccountNumber: string;
}

