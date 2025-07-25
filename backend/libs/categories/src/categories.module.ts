// Categories Module - quản lý danh mục forum
import { Module } from "@nestjs/common";
import { CategoriesController } from "./controllers/categories.controller";
import { CategoriesService } from "./services/categories.service";

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
