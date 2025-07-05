// DTO cho đăng nhập
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @ApiProperty({ 
    description: 'Email đăng nhập',
    example: 'user@example.com' 
  })
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @ApiProperty({ 
    description: 'Mật khẩu đăng nhập',
    example: 'password123',
    minLength: 6 
  })
  password: string;
}
