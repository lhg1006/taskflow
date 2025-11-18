import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateLabelDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid hex color code (e.g., #FF5733)',
  })
  color: string;

  @IsNotEmpty()
  @IsString()
  boardId: string;
}
