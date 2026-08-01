import { IsNumber } from 'class-validator';

export class CreateBookRequestDto {
  @IsNumber()
  book_id!: number;
}
