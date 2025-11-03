import { IsOptional, IsString, IsArray, IsEnum } from 'class-validator';

export class SearchCardDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsEnum(['overdue', 'upcoming', 'none'])
  dueDateFilter?: 'overdue' | 'upcoming' | 'none';
}
