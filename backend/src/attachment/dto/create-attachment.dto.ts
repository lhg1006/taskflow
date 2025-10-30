import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAttachmentDto {
  @IsNotEmpty()
  @IsString()
  cardId: string;
}
