import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

@Table
export class BankAccount extends Model<BankAccount> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  accountName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  bankName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  accountNumber: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isActive: boolean;

  /**
   * If true, this account is used for RMA PG / online purchases.
   * All online order payments route to this account. Only one account can have this set to true.
   */
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  useForRmaPg: boolean;
}
