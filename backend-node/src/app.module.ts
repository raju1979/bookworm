import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersModule } from './modules/users/users.module';
import { BooksModule } from './modules/books/books.module';
import { TagsModule } from './modules/tags/tags.module';
import { BookRequestsModule } from './modules/book-requests/book-requests.module';
import { ChatThreadsModule } from './modules/chat-threads/chat-threads.module';
import { ChatMessagesModule } from './modules/chat-messages/chat-messages.module';
import { User } from './modules/users/entities/user.entity';
import { Book } from './modules/books/entities/book.entity';
import { Tag } from './modules/tags/entities/tag.entity';
import { BookRequest } from './modules/book-requests/entities/book-request.entity';
import { ChatThread } from './modules/chat-threads/entities/chat-thread.entity';
import { ChatMessage } from './modules/chat-messages/entities/chat-message.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dialect: 'mysql',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get('DB_USER', 'root'),
        password: config.get('DB_PASSWORD', ''),
        database: config.get('DB_NAME', 'bookwork_db'),
        models: [User, Book, Tag, BookRequest, ChatThread, ChatMessage],
        autoLoadModels: true,
        synchronize: false,
        logging: config.get('NODE_ENV') === 'development' ? console.log : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        dialectOptions: {
          connectTimeout: 60000,
          supportBigNumbers: true,
          bigNumberStrings: true,
        },
        retry: {
          max: 3,
          timeout: 5000,
        },
      }),
    }),
    UsersModule,
    BooksModule,
    TagsModule,
    BookRequestsModule,
    ChatThreadsModule,
    ChatMessagesModule,
  ],
})
export class AppModule {}
