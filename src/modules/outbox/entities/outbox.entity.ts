import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Default,
  Index,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

export enum OutboxEventType {
  SEND_SMS = 'SEND_SMS',
  SEND_EMAIL = 'SEND_EMAIL',
  WEBHOOK = 'WEBHOOK',
}

export enum OutboxStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Table({
  tableName: 'outbox',
})
export class Outbox extends Model<Outbox> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({
    type: DataType.ENUM(...Object.values(OutboxEventType)),
    allowNull: false,
  })
  @Index
  eventType: OutboxEventType;

  @Column({ type: DataType.INTEGER, allowNull: false })
  @Index
  orderId: number;

  @Column({ type: DataType.JSON, allowNull: false })
  payload: any; // SMS details, email content, etc.

  @Column({ type: DataType.DATE, allowNull: false })
  @Index
  scheduledFor: Date; // When to process (for delayed SMS)

  @Column({
    type: DataType.ENUM(...Object.values(OutboxStatus)),
    allowNull: false,
    defaultValue: OutboxStatus.PENDING,
  })
  @Index
  status: OutboxStatus;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  retryCount: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  errorMessage: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

