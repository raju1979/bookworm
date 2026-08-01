import { IsArray, IsString, MaxLength, ArrayMinSize } from 'class-validator';

export class BulkCreateTagDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  tags!: string[];
}
