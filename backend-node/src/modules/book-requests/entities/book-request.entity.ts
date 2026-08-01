import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/entities/user.entity';
import { Book } from '../../books/entities/book.entity';

@Table({
  tableName: 'book_requests',
  timestamps: true,
  underscored: true,
})
export class BookRequest extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare requester_id: number;

  @ForeignKey(() => Book)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare book_id: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    defaultValue: 'pending',
  })
  declare status: string;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @BelongsTo(() => User, 'requester_id')
  requester?: User;

  @BelongsTo(() => Book)
  book?: Book;
}
