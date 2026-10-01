import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PublicProductsQueryDto } from './dto/public-products-query.dto';
import { AdminProductsQueryDto } from './dto/admin-products-query.dto';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('products')
  findPublicList(@Query() query: PublicProductsQueryDto) {
    return this.productsService.findPublicList(query);
  }

  @Get('products/:slug')
  findPublicBySlug(@Param('slug') slug: string) {
    return this.productsService.findPublicBySlug(slug);
  }

  @Get('admin/products')
  findAdminList(@Query() query: AdminProductsQueryDto) {
    return this.productsService.findAdminList(query);
  }

  @Post('admin/products')
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch('admin/products/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete('admin/products/:id')
  softDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.softDelete(id);
  }
}
