import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatThread } from '../chat-threads/entities/chat-thread.entity';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ChatMessagesService {
  constructor(
    @InjectModel(ChatMessage)
    private readonly chatMessageModel: typeof ChatMessage,
    @InjectModel(ChatThread)
    private readonly chatThreadModel: typeof ChatThread,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async create(
    createChatMessageDto: CreateChatMessageDto,
    senderFirebaseUid: string,
  ): Promise<ChatMessage> {
    const sender = await this.userModel.findOne({
      where: { firebase_uid: senderFirebaseUid },
    });

    if (!sender) {
      throw new BadRequestException('User not found');
    }

    const message = await this.chatMessageModel.create({
      thread_id: createChatMessageDto.thread_id,
      sender_id: sender.id,
      message: createChatMessageDto.message,
    } as any);

    // Bump thread so it sorts to top of chat list
    await this.chatThreadModel.update(
      { updatedAt: new Date() },
      { where: { id: createChatMessageDto.thread_id } },
    );

    return message;
  }

  async findByThreadId(thread_id: number, limit = 50, offset = 0): Promise<{ rows: ChatMessage[]; count: number }> {
    return this.chatMessageModel.findAndCountAll({
      where: { thread_id: Number(thread_id) },
      limit,
      offset,
      order: [['created_at', 'ASC']],
      include: [{ association: 'sender', required: false }],
    });
  }

  async findById(id: number): Promise<ChatMessage> {
    const message = await this.chatMessageModel.findByPk(id, {
      include: [{ association: 'sender' }],
    });

    if (!message) {
      throw new NotFoundException(`Chat message with ID ${id} not found`);
    }

    return message;
  }

  async remove(id: number): Promise<void> {
    const message = await this.findById(id);
    await message.destroy();
  }
}
