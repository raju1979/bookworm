import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { User } from '../../users/entities/user.entity';
import { Book } from '../../books/entities/book.entity';
import { ChatMessage } from '../../chat-messages/entities/chat-message.entity';

@Table({
  tableName: 'chat_threads',
  timestamps: true,
  underscored: true,
})
export class ChatThread extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => Book)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare book_id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare requester_id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare uploader_id: number;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => Book, { foreignKey: 'book_id', as: 'book' })
  book?: Book;

  @BelongsTo(() => User, { foreignKey: 'requester_id', as: 'requester' })
  requester?: User;

  @BelongsTo(() => User, { foreignKey: 'uploader_id', as: 'uploader' })
  uploader?: User;

  @HasMany(() => ChatMessage, { foreignKey: 'thread_id', as: 'messages' })
  messages?: ChatMessage[];
}
