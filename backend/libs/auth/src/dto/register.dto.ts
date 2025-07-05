// DTO cho đăng ký tài khoản
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @IsString({ message: 'Tên đăng nhập phải là chuỗi' })
  @MinLength(3, { message: 'Tên đăng nhập phải có ít nhất 3 ký tự' })
  @MaxLength(20, { message: 'Tên đăng nhập không được quá 20 ký tự' })
  @Matches(/^[a-zA-Z0-9_]+$/, { 
    message: 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới' 
  })
  @ApiProperty({ 
    description: 'Tên đăng nhập',
    example: 'user123',
    minLength: 3,
    maxLength: 20 
  })
  username: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @ApiProperty({ 
    description: 'Email đăng ký',
    example: 'user@example.com' 
  })
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(50, { message: 'Mật khẩu không được quá 50 ký tự' })
  @ApiProperty({ 
    description: 'Mật khẩu (tối thiểu 6 ký tự)',
    example: 'password123',
    minLength: 6,
    maxLength: 50 
  })
  password: string;
}
