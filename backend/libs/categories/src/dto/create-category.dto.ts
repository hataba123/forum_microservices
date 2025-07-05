// DTO cho tạo category mới
import { IsString, IsOptional, IsBoolean, IsInt, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCategoryDto {
  @IsString({ message: "Tên danh mục phải là chuỗi" })
  @ApiProperty({ description: "Tên danh mục", example: "Công nghệ" })
  name: string;

  @IsOptional()
  @IsString({ message: "Mô tả phải là chuỗi" })
  @ApiProperty({
    description: "Mô tả danh mục",
    example: "Thảo luận về công nghệ",
    required: false,
  })
  description?: string;

  @IsString({ message: "Slug phải là chuỗi" })
  @ApiProperty({ description: "Slug danh mục", example: "cong-nghe" })
  slug: string;

  @IsOptional()
  @IsInt({ message: "Thứ tự phải là số nguyên" })
  @Min(0, { message: "Thứ tự phải lớn hơn hoặc bằng 0" })
  @ApiProperty({ description: "Thứ tự hiển thị", example: 1, required: false })
  order?: number;

  @IsOptional()
  @IsBoolean({ message: "Trạng thái phải là boolean" })
  @ApiProperty({
    description: "Danh mục có hoạt động",
    example: true,
    required: false,
  })
  isActive?: boolean;
}
