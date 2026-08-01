import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/entities/user.entity';
import { ChatThread } from '../../chat-threads/entities/chat-thread.entity';

@Table({
  tableName: 'chat_messages',
  timestamps: true,
  underscored: true,
  updatedAt: false,
})
export class ChatMessage extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => ChatThread)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare thread_id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare sender_id: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare message: string;

  @CreatedAt
  declare createdAt: Date;

  @BelongsTo(() => ChatThread, { foreignKey: 'thread_id', as: 'thread' })
  thread?: ChatThread;

  @BelongsTo(() => User, { foreignKey: 'sender_id', as: 'sender' })
  sender?: User;
}
