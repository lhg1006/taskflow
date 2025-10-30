import { IsNotEmpty, IsString, IsInt } from 'class-validator';

export class MoveCardDto {
  @IsNotEmpty()
  @IsString()
  columnId: string;

  @IsNotEmpty()
  @IsInt()
  order: number;
}
