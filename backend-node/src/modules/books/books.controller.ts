import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  async create(
    @Body() createBookDto: CreateBookDto,
    @CurrentUser() user: any,
  ) {
    const bookData = {
      ...createBookDto,
      firebase_uid: user.sub,
    };
    return this.booksService.create(bookData, user.email);
  }

  @Get()
  async findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('search') search?: string,
    @Query('genre') genre?: string,
  ) {
    return this.booksService.findAll(
      limit ? parseInt(limit, 10) : 10,
      offset ? parseInt(offset, 10) : 0,
      search,
      genre,
    );
  }

  @Get('user/:firebaseUid')
  async findByFirebaseUid(@Param('firebaseUid') firebaseUid: string) {
    return this.booksService.findByFirebaseUid(firebaseUid);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.findById(id);
  }

  @Put(':id')
  @UseGuards(FirebaseAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookDto: UpdateBookDto,
    @CurrentUser() user: any,
  ) {
    const book = await this.booksService.findById(id);
    if (book.firebase_uid !== user.sub) {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }
    return this.booksService.update(id, updateBookDto);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const book = await this.booksService.findById(id);
    if (book.firebase_uid !== user.sub) {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }
    await this.booksService.remove(id);
    return { message: 'Book deleted successfully' };
  }
}
