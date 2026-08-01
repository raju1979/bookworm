import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BookRequest } from './entities/book-request.entity';
import { CreateBookRequestDto } from './dto/create-book-request.dto';
import { UpdateBookRequestDto } from './dto/update-book-request.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class BookRequestsService {
  constructor(
    @InjectModel(BookRequest)
    private readonly bookRequestModel: typeof BookRequest,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async create(
    createBookRequestDto: CreateBookRequestDto,
    firebaseUid: string,
  ): Promise<BookRequest> {
    const user = await this.userModel.findOne({
      where: { firebase_uid: firebaseUid },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const requester_id = user.id;
    // Check if request already exists
    const existingRequest = await this.bookRequestModel.findOne({
      where: {
        requester_id,
        book_id: createBookRequestDto.book_id,
      },
    });

    if (existingRequest) {
      throw new BadRequestException('You have already requested this book');
    }

    return this.bookRequestModel.create({
      requester_id,
      book_id: createBookRequestDto.book_id,
      status: 'pending',
    } as any);
  }

  async findAll(limit = 20, offset = 0): Promise<{ rows: BookRequest[]; count: number }> {
    return this.bookRequestModel.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: ['requester', 'book'],
    });
  }

  async findByRequesterId(
    requester_id: number,
    limit = 20,
    offset = 0,
  ): Promise<{ rows: BookRequest[]; count: number }> {
    return this.bookRequestModel.findAndCountAll({
      where: { requester_id },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: ['requester', 'book'],
    });
  }

  async findByBookId(
    book_id: number,
    limit = 20,
    offset = 0,
  ): Promise<{ rows: BookRequest[]; count: number }> {
    return this.bookRequestModel.findAndCountAll({
      where: { book_id },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: ['requester', 'book'],
    });
  }

  async findById(id: number): Promise<BookRequest> {
    const request = await this.bookRequestModel.findByPk(id, {
      include: ['requester', 'book'],
    });

    if (!request) {
      throw new NotFoundException(`Book request with ID ${id} not found`);
    }

    return request;
  }

  async update(id: number, updateBookRequestDto: UpdateBookRequestDto): Promise<BookRequest> {
    const request = await this.findById(id);
    return request.update(updateBookRequestDto as any);
  }

  async remove(id: number): Promise<void> {
    const request = await this.findById(id);
    await request.destroy();
  }
}
