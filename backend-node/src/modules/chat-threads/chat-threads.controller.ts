import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  Body,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ChatThreadsService } from './chat-threads.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('chat-threads')
export class ChatThreadsController {
  constructor(private readonly chatThreadsService: ChatThreadsService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  async create(
    @Body() body: { book_id: number; uploader_id: string },
    @CurrentUser() user: any,
  ) {
    return this.chatThreadsService.create(body.book_id, user.sub, body.uploader_id);
  }

  @Get()
  async findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.chatThreadsService.findAll(
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('user/:user_id')
  async findByUserId(
    @Param('user_id', ParseIntPipe) user_id: number,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.chatThreadsService.findByUserId(
      user_id,
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('book/:book_id')
  async findByBookId(@Param('book_id', ParseIntPipe) book_id: number) {
    return this.chatThreadsService.findByBookId(book_id);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.chatThreadsService.findById(id);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const thread = await this.chatThreadsService.findById(id);
    if (thread.requester_id !== user.id && thread.uploader_id !== user.id) {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }
    await this.chatThreadsService.remove(id);
    return { message: 'Chat thread deleted successfully' };
  }
}
