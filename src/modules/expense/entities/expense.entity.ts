import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';

@Table
export class Expense extends Model<Expense> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  amount: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  description: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  date: Date;

  /** Expense type (e.g. "Operating", "Marketing", "Personnel"). */
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  type: string;

  /** Expense subtype under type (e.g. "Rent", "Ads", "Salaries"). */
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  subtype: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes: string;
}
