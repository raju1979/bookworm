import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform, plainToInstance } from 'class-transformer';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  full_name?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  favorite_genre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  favoriteGenre?: string;

  @IsOptional()
  @IsString()
  profile_image?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;
}
