import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateTagDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tag_name?: string;
}
