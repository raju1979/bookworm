import { IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateChatMessageDto {
  @Type(() => Number)
  @IsInt()
  thread_id!: number;

  @IsString()
  message!: string;
}
