import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateBoardDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  workspaceId: string;
}
