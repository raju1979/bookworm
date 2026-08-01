import { IsString, IsOptional } from 'class-validator';

export class UpdateBookRequestDto {
  @IsOptional()
  @IsString()
  status?: string;
}
