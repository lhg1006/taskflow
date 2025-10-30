import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

export class CreateColumnDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  boardId: string;

  @IsOptional()
  @IsInt()
  order?: number;
}
