import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'users',
  timestamps: true,
  underscored: true,
})
export class User extends Model {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(255),
    unique: true,
    allowNull: false,
  })
  declare firebase_uid: string;

  @Column({
    type: DataType.STRING(255),
    unique: true,
    allowNull: false,
  })
  declare email: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare full_name: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare bio: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare city: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare favorite_genre: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: 'Base64 or URL to profile picture',
  })
  declare profile_image: string | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
