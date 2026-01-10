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
import { EventType } from './event-type.entity';
import { EventCategory } from './event-category.entity';
import { User } from '../../auth/entities/user.entity';

@Table
export class Event extends Model<Event> {
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
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  startDate: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  endDate: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  location: string;

  @ForeignKey(() => EventType)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  eventTypeId: number;

  @ForeignKey(() => EventCategory)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  eventCategoryId: number | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  createdById: number;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isAllDay: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  // Relationships
  @BelongsTo(() => EventType)
  eventType: EventType;

  @BelongsTo(() => EventCategory)
  eventCategory: EventCategory;

  @BelongsTo(() => User)
  createdBy: User;
}

