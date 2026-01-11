import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  Default,
} from 'sequelize-typescript';
import { User } from '../../../auth/entities/user.entity';

@Table
export class CalendarEvent extends Model<CalendarEvent> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  start: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  end: Date | null;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  allDay: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  backgroundColor: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  borderColor: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  textColor: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  location: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  createdById: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  // Relationships
  @BelongsTo(() => User)
  createdBy: User;
}
