import { IsOptional, IsString, IsInt } from 'class-validator';

export class UpdateColumnDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  order?: number;
}
