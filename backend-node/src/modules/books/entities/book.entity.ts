import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  AllowNull,
} from 'sequelize-typescript';

@Table({
  tableName: 'books',
  timestamps: true,
  underscored: true,
})
export class Book extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare firebase_uid: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare genre: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null;

  @Column({
    type: DataType.TEXT('long'),
    allowNull: true,
  })
  declare cover_image: string | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  toJSON() {
    const values = super.toJSON();

    // Convert Buffer back to string if needed
    if (values.cover_image && Buffer.isBuffer(values.cover_image)) {
      values.cover_image = values.cover_image.toString('utf-8');
    }

    return values;
  }
}
