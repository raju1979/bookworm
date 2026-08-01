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
import { ChatMessagesService } from './chat-messages.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('chat-messages')
export class ChatMessagesController {
  constructor(private readonly chatMessagesService: ChatMessagesService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  async create(
    @Body() createChatMessageDto: CreateChatMessageDto,
    @CurrentUser() user: any,
  ) {
    return this.chatMessagesService.create(createChatMessageDto, user.sub);
  }

  @Get('thread/:thread_id')
  async findByThreadId(
    @Param('thread_id', ParseIntPipe) thread_id: number,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.chatMessagesService.findByThreadId(
      thread_id,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.chatMessagesService.findById(id);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    const message = await this.chatMessagesService.findById(id);
    if (message.sender_id !== user.id) {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }
    await this.chatMessagesService.remove(id);
    return { message: 'Chat message deleted successfully' };
  }
}
