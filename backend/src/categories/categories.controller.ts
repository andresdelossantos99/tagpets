import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('categories')
  findPublic() {
    return this.categoriesService.findPublic();
  }

  @Get('admin/categories')
  findAllForAdmin() {
    return this.categoriesService.findAllForAdmin();
  }

  @Post('admin/categories')
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch('admin/categories/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Parameters<CategoriesService['update']>[1],
  ) {
    return this.categoriesService.update(id, dto);
  }
}
