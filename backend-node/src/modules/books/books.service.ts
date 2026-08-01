import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, where, fn, col } from 'sequelize';
import { Book } from './entities/book.entity';
import { User } from '../users/entities/user.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book)
    private readonly bookModel: typeof Book,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  private async ensureUserExists(firebaseUid: string, email?: string): Promise<User> {
    let user = await this.userModel.findOne({
      where: { firebase_uid: firebaseUid },
    });

    if (user) {
      return user;
    }

    // Same email may already exist from the old Supabase auth UID — reclaim it
    if (email) {
      user = await this.userModel.findOne({ where: { email } });
      if (user) {
        await user.update({ firebase_uid: firebaseUid } as any);
        return user;
      }

      try {
        user = await this.userModel.create({
          firebase_uid: firebaseUid,
          email,
        } as any);
        return user;
      } catch (error: any) {
        // Race / unique: fetch again
        user = await this.userModel.findOne({
          where: {
            [Op.or]: [{ firebase_uid: firebaseUid }, { email }],
          },
        });
        if (user) {
          if (user.firebase_uid !== firebaseUid) {
            await user.update({ firebase_uid: firebaseUid } as any);
          }
          return user;
        }
        throw error;
      }
    }

    throw new BadRequestException(
      'User profile not found. Please complete your profile first.',
    );
  }

  async create(
    createBookDto: CreateBookDto & { firebase_uid: string },
    email?: string,
  ): Promise<Book> {
    await this.ensureUserExists(createBookDto.firebase_uid, email);
    return this.bookModel.create(createBookDto as any);
  }

  async findAll(
    limit = 10,
    offset = 0,
    search?: string,
    genre?: string,
  ): Promise<{ rows: Book[]; count: number }> {
    const whereConditions: any[] = [];

    if (search && search.trim()) {
      whereConditions.push(
        where(
          fn('LOWER', col('title')),
          Op.like,
          `%${search.toLowerCase()}%`,
        ),
      );
    }

    if (genre && genre.trim()) {
      whereConditions.push(
        where(
          fn('LOWER', col('genre')),
          Op.like,
          `%${genre.toLowerCase()}%`,
        ),
      );
    }

    const whereClause = whereConditions.length > 0
      ? { [Op.and]: whereConditions }
      : {};

    const result = await this.bookModel.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const rows = result.rows.map((book) => {
      const bookData = book.toJSON();
      return bookData;
    });

    return { rows, count: result.count };
  }

  async findById(id: number): Promise<Book> {
    const book = await this.bookModel.findByPk(id);
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    return book;
  }

  async findByFirebaseUid(
    firebaseUid: string,
    limit = 10,
    offset = 0,
  ): Promise<{ rows: Book[]; count: number }> {
    const result = await this.bookModel.findAndCountAll({
      where: { firebase_uid: firebaseUid },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const rows = result.rows.map((book) => book.toJSON());
    return { rows, count: result.count };
  }

  async update(id: number, updateBookDto: UpdateBookDto): Promise<Book> {
    const book = await this.findById(id);
    return book.update(updateBookDto as any);
  }

  async remove(id: number): Promise<void> {
    const book = await this.findById(id);
    await book.destroy();
  }
}
