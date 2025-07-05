// Media Service - xử lý logic nghiệp vụ cho media
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@libs/shared";
import * as path from "path";
import * as fs from "fs";
import { promisify } from "util";

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Upload một file
   * @param file - File upload
   * @param userId - ID user upload
   * @returns Thông tin file đã upload
   */
  async uploadFile(file: Express.Multer.File, userId: string) {
    if (!file) {
      throw new BadRequestException("Không có file được upload");
    }

    // Validate file type và size
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException("Loại file không được hỗ trợ");
    }

    if (file.size > maxSize) {
      throw new BadRequestException("File quá lớn (tối đa 10MB)");
    }

    // Tạo tên file unique
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    const filePath = path.join(process.cwd(), "uploads", fileName);

    try {
      // Ensure upload directory exists
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Save file to disk
      await writeFile(filePath, file.buffer);

      // TODO: Save to database when Media model is ready
      const mediaData = {
        id: `media_${Date.now()}`,
        filename: fileName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: filePath,
        url: `/uploads/${fileName}`,
        uploadedBy: userId,
        createdAt: new Date(),
      };

      return {
        message: "Upload file thành công",
        data: mediaData,
      };
    } catch (error) {
      throw new BadRequestException("Lỗi khi upload file");
    }
  }

  /**
   * Upload nhiều file
   * @param files - Danh sách file upload
   * @param userId - ID user upload
   * @returns Danh sách file đã upload
   */
  async uploadFiles(files: Express.Multer.File[], userId: string) {
    if (!files || files.length === 0) {
      throw new BadRequestException("Không có file được upload");
    }

    const results = [];
    for (const file of files) {
      try {
        const result = await this.uploadFile(file, userId);
        results.push(result.data);
      } catch (error) {
        results.push({
          filename: file.originalname,
          error: error.message,
        });
      }
    }

    return {
      message: "Upload hoàn tất",
      data: results,
    };
  }

  /**
   * Lấy danh sách file của user
   * @param userId - ID user
   * @param params - Tham số tìm kiếm và phân trang
   * @returns Danh sách file
   */
  async findAll(
    userId: string,
    params: { page?: number; limit?: number; type?: string }
  ) {
    const { page = 1, limit = 20, type } = params;

    // TODO: Implement khi có Media model trong database
    return {
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0,
      },
    };
  }

  /**
   * Lấy thông tin chi tiết file
   * @param id - ID file
   * @returns Thông tin file
   */
  async findOne(id: string) {
    // TODO: Implement khi có Media model trong database
    throw new NotFoundException("Không tìm thấy file");
  }

  /**
   * Xóa file
   * @param id - ID file
   * @param userId - ID user
   * @returns Kết quả xóa
   */
  async remove(id: string, userId: string) {
    // TODO: Implement khi có Media model trong database
    try {
      // Mock logic - trong thực tế sẽ query database để lấy file path
      // const media = await this.prisma.media.findUnique({ where: { id } });
      // if (!media) {
      //   throw new NotFoundException('Không tìm thấy file');
      // }
      // if (media.uploadedBy !== userId) {
      //   throw new ForbiddenException('Bạn không có quyền xóa file này');
      // }
      // await unlink(media.path);
      // await this.prisma.media.delete({ where: { id } });

      return { message: "Xóa file thành công" };
    } catch (error) {
      throw new BadRequestException("Lỗi khi xóa file");
    }
  }

  /**
   * Lấy URL public của file
   * @param filename - Tên file
   * @returns URL file
   */
  getFileUrl(filename: string): string {
    return `/uploads/${filename}`;
  }

  /**
   * Kiểm tra file có tồn tại không
   * @param filename - Tên file
   * @returns True nếu file tồn tại
   */
  fileExists(filename: string): boolean {
    const filePath = path.join(process.cwd(), "uploads", filename);
    return fs.existsSync(filePath);
  }
}
