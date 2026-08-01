import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BookRequestsService } from './book-requests.service';
import { BookRequestsController } from './book-requests.controller';
import { BookRequest } from './entities/book-request.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [SequelizeModule.forFeature([BookRequest, User])],
  controllers: [BookRequestsController],
  providers: [BookRequestsService],
  exports: [BookRequestsService],
})
export class BookRequestsModule {}
