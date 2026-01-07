import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Index,
  Default,
} from 'sequelize-typescript';

@Table
export class VisitorMonthlyStats extends Model<VisitorMonthlyStats> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Index
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  yearMonth: string; // Format: "YYYY-MM" (e.g., "2024-01")

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  year: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  month: number; // 1-12

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  totalVisitors: number;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  uniqueVisitors: number;

  // Store breakdowns as JSON for flexibility
  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  visitorsByCountry: { [country: string]: number };

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  visitorsByDevice: { [deviceType: string]: number };

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  visitorsByReferrer: { [referrerSource: string]: number };

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  visitorsByDistrict: Array<{ country: string; district: string; count: number }>;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  createdAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  updatedAt: Date;
}

