import { IsString, IsOptional } from 'class-validator';

export class UpdateChecklistItemDto {
  @IsString()
  @IsOptional()
  content?: string;
}
