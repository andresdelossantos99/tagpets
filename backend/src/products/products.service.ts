import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PublicProductsQueryDto } from './dto/public-products-query.dto';
import { AdminProductsQueryDto } from './dto/admin-products-query.dto';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';

const PRODUCT_IMAGE_SELECT: Prisma.ProductImageSelect = {
  id: true,
  productId: true,
  url: true,
  altText: true,
  sortOrder: true,
  createdAt: true,
};

const PRODUCT_WITH_CATEGORY_SELECT: Prisma.ProductSelect = {
  id: true,
  categoryId: true,
  name: true,
  slug: true,
  sku: true,
  description: true,
  price: true,
  stock: true,
  active: true,
  featured: true,
  weightGrams: true,
  lengthCm: true,
  widthCm: true,
  heightCm: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  images: {
    select: PRODUCT_IMAGE_SELECT,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
  },
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublicList(query: PublicProductsQueryDto) {
    const { page, limit, category, featured } = query;

    const where: Prisma.ProductWhereInput = {
      active: true,
      ...(category ? { category: { slug: category } } : {}),
      ...(featured !== undefined ? { featured } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: PRODUCT_WITH_CATEGORY_SELECT,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findPublicBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, active: true },
      select: PRODUCT_WITH_CATEGORY_SELECT,
    });

    if (!product) {
      throw new NotFoundException(`Producto ${slug} no encontrado`);
    }

    return product;
  }

  async findAdminList(query: AdminProductsQueryDto) {
    const { page, limit, categoryId, active, featured } = query;

    const where: Prisma.ProductWhereInput = {
      ...(categoryId ? { categoryId } : {}),
      ...(active !== undefined ? { active } : {}),
      ...(featured !== undefined ? { featured } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: PRODUCT_WITH_CATEGORY_SELECT,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(dto: CreateProductDto) {
    if (dto.categoryId) {
      await this.ensureCategoryExists(dto.categoryId);
    }

    try {
      return await this.prisma.product.create({
        data: {
          categoryId: dto.categoryId ?? undefined,
          name: dto.name,
          slug: dto.slug,
          sku: dto.sku,
          description: dto.description,
          price: new Prisma.Decimal(dto.price),
          stock: dto.stock,
          active: dto.active,
          featured: dto.featured,
          weightGrams: dto.weightGrams,
          lengthCm:
            dto.lengthCm === null
              ? null
              : dto.lengthCm !== undefined
                ? new Prisma.Decimal(dto.lengthCm)
                : undefined,
          widthCm:
            dto.widthCm === null
              ? null
              : dto.widthCm !== undefined
                ? new Prisma.Decimal(dto.widthCm)
                : undefined,
          heightCm:
            dto.heightCm === null
              ? null
              : dto.heightCm !== undefined
                ? new Prisma.Decimal(dto.heightCm)
                : undefined,
        },
        select: PRODUCT_WITH_CATEGORY_SELECT,
      });
    } catch (error) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException('El slug o SKU ya está en uso');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    if (dto.categoryId !== undefined && dto.categoryId !== null) {
      await this.ensureCategoryExists(dto.categoryId);
    }

    try {
      return await this.prisma.product.update({
        where: { id },
        data: {
          categoryId: dto.categoryId,
          name: dto.name,
          slug: dto.slug,
          sku: dto.sku,
          description: dto.description,
          price:
            dto.price !== undefined ? new Prisma.Decimal(dto.price) : undefined,
          stock: dto.stock,
          active: dto.active,
          featured: dto.featured,
          weightGrams: dto.weightGrams,
          lengthCm:
            dto.lengthCm === null
              ? null
              : dto.lengthCm !== undefined
                ? new Prisma.Decimal(dto.lengthCm)
                : undefined,
          widthCm:
            dto.widthCm === null
              ? null
              : dto.widthCm !== undefined
                ? new Prisma.Decimal(dto.widthCm)
                : undefined,
          heightCm:
            dto.heightCm === null
              ? null
              : dto.heightCm !== undefined
                ? new Prisma.Decimal(dto.heightCm)
                : undefined,
        },
        select: PRODUCT_WITH_CATEGORY_SELECT,
      });
    } catch (error) {
      if (this.isRecordNotFound(error)) {
        throw new NotFoundException(`Producto ${id} no encontrado`);
      }
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException('El slug o SKU ya está en uso');
      }
      throw error;
    }
  }

  async softDelete(id: string) {
    try {
      return await this.prisma.product.update({
        where: { id },
        data: { active: false },
        select: PRODUCT_WITH_CATEGORY_SELECT,
      });
    } catch (error) {
      if (this.isRecordNotFound(error)) {
        throw new NotFoundException(`Producto ${id} no encontrado`);
      }
      throw error;
    }
  }

  async addImage(productId: string, dto: CreateProductImageDto) {
    await this.ensureProductExists(productId);

    return this.prisma.productImage.create({
      data: {
        productId,
        url: dto.url,
        altText: dto.altText,
        sortOrder: dto.sortOrder,
      },
      select: PRODUCT_IMAGE_SELECT,
    });
  }

  async updateImage(
    productId: string,
    imageId: string,
    dto: UpdateProductImageDto,
  ) {
    await this.ensureImageBelongsToProduct(productId, imageId);

    try {
      return await this.prisma.productImage.update({
        where: { id: imageId },
        data: {
          url: dto.url,
          altText: dto.altText,
          sortOrder: dto.sortOrder,
        },
        select: PRODUCT_IMAGE_SELECT,
      });
    } catch (error) {
      if (this.isRecordNotFound(error)) {
        throw new NotFoundException(`Imagen ${imageId} no encontrada`);
      }
      throw error;
    }
  }

  async deleteImage(productId: string, imageId: string) {
    await this.ensureImageBelongsToProduct(productId, imageId);

    try {
      return await this.prisma.productImage.delete({
        where: { id: imageId },
        select: PRODUCT_IMAGE_SELECT,
      });
    } catch (error) {
      if (this.isRecordNotFound(error)) {
        throw new NotFoundException(`Imagen ${imageId} no encontrada`);
      }
      throw error;
    }
  }

  private async ensureCategoryExists(categoryId: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('La categoría indicada no existe');
    }
  }

  private async ensureProductExists(productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Producto ${productId} no encontrado`);
    }
  }

  private async ensureImageBelongsToProduct(
    productId: string,
    imageId: string,
  ): Promise<void> {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });

    if (!image) {
      throw new NotFoundException(
        `Imagen ${imageId} no encontrada para el producto ${productId}`,
      );
    }
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  private isRecordNotFound(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    );
  }
}
