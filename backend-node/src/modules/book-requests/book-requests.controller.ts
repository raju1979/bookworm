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
  Query,
} from '@nestjs/common';
import { BookRequestsService } from './book-requests.service';
import { CreateBookRequestDto } from './dto/create-book-request.dto';
import { UpdateBookRequestDto } from './dto/update-book-request.dto';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('book-requests')
export class BookRequestsController {
  constructor(private readonly bookRequestsService: BookRequestsService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  async create(
    @Body() createBookRequestDto: CreateBookRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.bookRequestsService.create(createBookRequestDto, user.sub);
  }

  @Get()
  async findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.bookRequestsService.findAll(
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('requester/:requester_id')
  async findByRequesterId(
    @Param('requester_id', ParseIntPipe) requester_id: number,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.bookRequestsService.findByRequesterId(
      requester_id,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('book/:book_id')
  async findByBookId(
    @Param('book_id', ParseIntPipe) book_id: number,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.bookRequestsService.findByBookId(
      book_id,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.bookRequestsService.findById(id);
  }

  @Put(':id')
  @UseGuards(FirebaseAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookRequestDto: UpdateBookRequestDto,
  ) {
    return this.bookRequestsService.update(id, updateBookRequestDto);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.bookRequestsService.remove(id);
    return { message: 'Book request deleted successfully' };
  }
}
