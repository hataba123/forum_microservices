// Service quản lý categories
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "@libs/shared";
import { CreateCategoryDto } from "../dto/create-category.dto";
import { UpdateCategoryDto } from "../dto/update-category.dto";
import { SlugUtil } from "@libs/shared";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // Tạo category mới
  async create(createCategoryDto: CreateCategoryDto) {
    const { slug } = createCategoryDto;

    // Kiểm tra slug đã tồn tại
    const existingCategory = await this.findBySlug(slug);
    if (existingCategory) {
      throw new ConflictException("Slug danh mục đã tồn tại");
    }

    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        order: createCategoryDto.order || 0,
        isActive: createCategoryDto.isActive ?? true,
      },
    });
  }

  // Lấy tất cả categories
  async findAll(includeInactive: boolean = false) {
    const where = includeInactive ? {} : { isActive: true };

    return this.prisma.category.findMany({
      where,
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });
  }

  // Tìm category theo ID
  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException("Danh mục không tồn tại");
    }

    return category;
  }

  // Tìm category theo slug
  async findBySlug(slug: string) {
    return this.prisma.category.findUnique({
      where: { slug },
    });
  }

  // Cập nhật category
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findById(id);

    // Kiểm tra slug mới nếu có
    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const existingCategory = await this.findBySlug(updateCategoryDto.slug);
      if (existingCategory) {
        throw new ConflictException("Slug danh mục đã tồn tại");
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  // Xóa category (soft delete)
  async remove(id: string) {
    await this.findById(id);

    return this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Tạo slug từ tên
  generateSlug(name: string): string {
    return SlugUtil.createSlug(name);
  }
}
