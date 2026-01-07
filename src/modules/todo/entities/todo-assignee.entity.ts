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
} from 'sequelize-typescript';
import { Todo } from './todo.entity';
import { User } from '../../auth/entities/user.entity';

@Table({ tableName: 'todo_assignees' })
export class TodoAssignee extends Model<TodoAssignee> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => Todo)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  todoId: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId: number;

  @CreatedAt
  assignedAt: Date;

  // Relationships
  @BelongsTo(() => Todo)
  todo: Todo;

  @BelongsTo(() => User)
  user: User;
}

