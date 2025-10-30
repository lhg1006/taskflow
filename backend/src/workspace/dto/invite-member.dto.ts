import { IsEmail, IsString, IsIn } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsIn(['OWNER', 'ADMIN', 'MEMBER'])
  role: string;
}
