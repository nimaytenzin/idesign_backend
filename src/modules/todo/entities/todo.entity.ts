import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
  Default,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { Portfolio } from './portfolio.entity';
import { User } from '../../auth/entities/user.entity';
import { TodoAssignee } from './todo-assignee.entity';

export enum TodoStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

@Table
export class Todo extends Model<Todo> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  task: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Default(TodoStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(TodoStatus)),
    allowNull: false,
    defaultValue: TodoStatus.PENDING,
  })
  status: TodoStatus;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  assignedDate: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  dueBy: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  remarks: string;

  @ForeignKey(() => Portfolio)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  portfolioId: number;

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
  @BelongsTo(() => Portfolio)
  portfolio: Portfolio;

  @BelongsTo(() => User)
  createdBy: User;

  @BelongsToMany(() => User, () => TodoAssignee)
  assignedUsers: User[];
}

