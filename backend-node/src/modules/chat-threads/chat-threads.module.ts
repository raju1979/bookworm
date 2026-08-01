import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ChatThreadsService } from './chat-threads.service';
import { ChatThreadsController } from './chat-threads.controller';
import { ChatThread } from './entities/chat-thread.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [SequelizeModule.forFeature([ChatThread, User])],
  controllers: [ChatThreadsController],
  providers: [ChatThreadsService],
  exports: [ChatThreadsService],
})
export class ChatThreadsModule {}
