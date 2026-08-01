import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ChatThread } from './entities/chat-thread.entity';
import { ChatMessage } from '../chat-messages/entities/chat-message.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ChatThreadsService {
  constructor(
    @InjectModel(ChatThread)
    private readonly chatThreadModel: typeof ChatThread,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async create(
    book_id: number,
    requesterFirebaseUid: string,
    uploaderFirebaseUid: string,
  ): Promise<ChatThread> {
    const requester = await this.userModel.findOne({
      where: { firebase_uid: requesterFirebaseUid },
    });
    const uploader = await this.userModel.findOne({
      where: { firebase_uid: uploaderFirebaseUid },
    });

    if (!requester || !uploader) {
      throw new BadRequestException('User not found');
    }

    const ChatOp = require('sequelize').Op;

    // Reuse thread regardless of who opens chat (I Want vs uploader dashboard)
    const existingThread = await this.chatThreadModel.findOne({
      where: {
        book_id,
        [ChatOp.or]: [
          { requester_id: requester.id, uploader_id: uploader.id },
          { requester_id: uploader.id, uploader_id: requester.id },
        ],
      },
    });

    if (existingThread) {
      return existingThread;
    }

    return this.chatThreadModel.create({
      book_id,
      requester_id: requester.id,
      uploader_id: uploader.id,
    } as any);
  }

  async findAll(limit = 20, offset = 0): Promise<{ rows: ChatThread[]; count: number }> {
    return this.chatThreadModel.findAndCountAll({
      limit,
      offset,
      order: [['updatedAt', 'DESC']],
      include: [
        { association: 'book' },
        { association: 'requester' },
        { association: 'uploader' },
      ],
    });
  }

  async findByUserId(
    user_id: number,
    limit = 20,
    offset = 0,
  ): Promise<{ rows: ChatThread[]; count: number }> {
    const ChatOp = require('sequelize').Op;

    return this.chatThreadModel.findAndCountAll({
      where: {
        [ChatOp.or]: [
          { requester_id: user_id },
          { uploader_id: user_id },
        ],
      },
      limit,
      offset,
      order: [['updatedAt', 'DESC']],
      include: [
        { association: 'book' },
        { association: 'requester' },
        { association: 'uploader' },
      ],
    });
  }

  async findById(id: number): Promise<ChatThread> {
    const thread = await this.chatThreadModel.findByPk(id, {
      include: [
        { association: 'book' },
        { association: 'requester' },
        { association: 'uploader' },
        { association: 'messages' },
      ],
    });

    if (!thread) {
      throw new NotFoundException(`Chat thread with ID ${id} not found`);
    }

    return thread;
  }

  async findByBookId(book_id: number): Promise<ChatThread[]> {
    return this.chatThreadModel.findAll({
      where: { book_id },
      include: [
        { association: 'requester' },
        { association: 'uploader' },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  async remove(id: number): Promise<void> {
    const thread = await this.findById(id);
    await thread.destroy();
  }
}
