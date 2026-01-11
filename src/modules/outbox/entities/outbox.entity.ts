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
  indexes: [
    { fields: ['eventType'], name: 'idx_outbox_event_type' },
    { fields: ['orderId'], name: 'idx_outbox_order_id' },
    { fields: ['scheduledFor'], name: 'idx_outbox_scheduled_for' },
    { fields: ['status'], name: 'idx_outbox_status' },
  ],
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
  eventType: OutboxEventType;

  @Column({ type: DataType.INTEGER, allowNull: false })
  orderId: number;

  @Column({ type: DataType.JSON, allowNull: false })
  payload: any; // SMS details, email content, etc.

  @Column({ type: DataType.DATE, allowNull: false })
  scheduledFor: Date; // When to process (for delayed SMS)

  @Column({
    type: DataType.ENUM(...Object.values(OutboxStatus)),
    allowNull: false,
    defaultValue: OutboxStatus.PENDING,
  })
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

