import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateBookDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsString()
  @MaxLength(1000)
  genre!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  cover_image?: string; // Base64 encoded image (data URL)
}
