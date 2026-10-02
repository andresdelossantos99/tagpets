jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;

  const prismaMock = {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    productImage: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const baseCreateDto = {
    name: 'Chapita redonda',
    slug: 'chapita-redonda',
    sku: 'CHR-001',
    description: 'Chapita de acero inoxidable',
    price: 1999.99,
    stock: 10,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = moduleRef.get(ProductsService);
  });

  // ---------- Etapa 4A (sin cambios) ----------

  it('el listado público siempre filtra active=true', async () => {
    prismaMock.product.findMany.mockResolvedValue([]);
    prismaMock.product.count.mockResolvedValue(0);

    await service.findPublicList({ page: 1, limit: 12 });

    const [findManyArgs] = prismaMock.product.findMany.mock.calls[0];
    const [countArgs] = prismaMock.product.count.mock.calls[0];

    expect(findManyArgs.where).toMatchObject({ active: true });
    expect(countArgs.where).toMatchObject({ active: true });
  });

  it('aplica filtros de category/featured y calcula skip/take', async () => {
    prismaMock.product.findMany.mockResolvedValue([]);
    prismaMock.product.count.mockResolvedValue(0);

    await service.findPublicList({
      page: 2,
      limit: 5,
      category: 'perros',
      featured: true,
    });

    const [findManyArgs] = prismaMock.product.findMany.mock.calls[0];
    const [countArgs] = prismaMock.product.count.mock.calls[0];

    expect(findManyArgs.where).toMatchObject({
      active: true,
      featured: true,
      category: { slug: 'perros' },
    });
    expect(findManyArgs.skip).toBe(5);
    expect(findManyArgs.take).toBe(5);
    expect(countArgs.where).toEqual(findManyArgs.where);
  });

  it('el detalle público por slug exige active=true y lanza NotFoundException si no existe', async () => {
    prismaMock.product.findFirst.mockResolvedValue(null);

    await expect(
      service.findPublicBySlug('inexistente'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prismaMock.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'inexistente', active: true } }),
    );
  });

  it('crea un producto correctamente', async () => {
    const created = { id: 'uuid-1', ...baseCreateDto };
    prismaMock.product.create.mockResolvedValue(created);

    const result = await service.create(baseCreateDto);

    expect(result).toEqual(created);
    expect(prismaMock.category.findUnique).not.toHaveBeenCalled();
  });

  it('lanza NotFoundException si categoryId no existe al crear, sin llamar a product.create', async () => {
    prismaMock.category.findUnique.mockResolvedValue(null);

    await expect(
      service.create({ ...baseCreateDto, categoryId: 'cat-inexistente' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prismaMock.product.create).not.toHaveBeenCalled();
  });

  it('lanza ConflictException si slug o sku están duplicados al crear', async () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '7.10.0',
      },
    );
    prismaMock.product.create.mockRejectedValue(error);

    await expect(service.create(baseCreateDto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('lanza NotFoundException al actualizar un producto inexistente', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '7.10.0',
    });
    prismaMock.product.update.mockRejectedValue(error);

    await expect(
      service.update('id-inexistente', { name: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('el soft delete actualiza active=false y no borra físicamente', async () => {
    prismaMock.product.update.mockResolvedValue({
      id: 'uuid-1',
      active: false,
    });

    await service.softDelete('uuid-1');

    expect(prismaMock.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'uuid-1' },
        data: { active: false },
      }),
    );
    expect(prismaMock.product.delete).not.toHaveBeenCalled();
  });

  it('lanza NotFoundException si el producto a eliminar (softDelete) no existe', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '7.10.0',
    });
    prismaMock.product.update.mockRejectedValue(error);

    await expect(service.softDelete('id-inexistente')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // ---------- Etapa 4B (nuevos) ----------

  it('el select de Product incluye images ordenadas por sortOrder, createdAt e id', async () => {
    prismaMock.product.findMany.mockResolvedValue([]);
    prismaMock.product.count.mockResolvedValue(0);

    await service.findPublicList({ page: 1, limit: 12 });

    const [findManyArgs] = prismaMock.product.findMany.mock.calls[0];

    expect(findManyArgs.select.images).toEqual({
      select: {
        id: true,
        productId: true,
        url: true,
        altText: true,
        sortOrder: true,
        createdAt: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
  });

  it('addImage comprueba que el producto exista y crea la imagen', async () => {
    prismaMock.product.findUnique.mockResolvedValue({ id: 'prod-1' });
    const created = {
      id: 'img-1',
      productId: 'prod-1',
      url: 'https://example.com/a.jpg',
      altText: 'Foto',
      sortOrder: 0,
      createdAt: new Date(),
    };
    prismaMock.productImage.create.mockResolvedValue(created);

    const result = await service.addImage('prod-1', {
      url: 'https://example.com/a.jpg',
      altText: 'Foto',
    });

    expect(result).toEqual(created);
    expect(prismaMock.product.findUnique).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
    });
    expect(prismaMock.productImage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          productId: 'prod-1',
          url: 'https://example.com/a.jpg',
          altText: 'Foto',
          sortOrder: undefined,
        },
      }),
    );
  });

  it('addImage lanza NotFoundException si el producto no existe y no crea la imagen', async () => {
    prismaMock.product.findUnique.mockResolvedValue(null);

    await expect(
      service.addImage('prod-inexistente', {
        url: 'https://example.com/a.jpg',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prismaMock.productImage.create).not.toHaveBeenCalled();
  });

  it('updateImage busca la imagen por imageId y productId antes de actualizar', async () => {
    prismaMock.productImage.findFirst.mockResolvedValue({
      id: 'img-1',
      productId: 'prod-1',
    });
    prismaMock.productImage.update.mockResolvedValue({
      id: 'img-1',
      productId: 'prod-1',
      url: 'https://example.com/b.jpg',
    });

    await service.updateImage('prod-1', 'img-1', {
      url: 'https://example.com/b.jpg',
    });

    expect(prismaMock.productImage.findFirst).toHaveBeenCalledWith({
      where: { id: 'img-1', productId: 'prod-1' },
    });
  });

  it('updateImage lanza NotFoundException si la imagen no existe o no pertenece al producto', async () => {
    prismaMock.productImage.findFirst.mockResolvedValue(null);

    await expect(
      service.updateImage('prod-1', 'img-otro-producto', { sortOrder: 2 }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prismaMock.productImage.update).not.toHaveBeenCalled();
  });

  it('updateImage traduce P2025 a NotFoundException', async () => {
    prismaMock.productImage.findFirst.mockResolvedValue({
      id: 'img-1',
      productId: 'prod-1',
    });
    const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '7.10.0',
    });
    prismaMock.productImage.update.mockRejectedValue(error);

    await expect(
      service.updateImage('prod-1', 'img-1', { sortOrder: 1 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deleteImage verifica pertenencia y elimina físicamente el registro', async () => {
    prismaMock.productImage.findFirst.mockResolvedValue({
      id: 'img-1',
      productId: 'prod-1',
    });
    prismaMock.productImage.delete.mockResolvedValue({ id: 'img-1' });

    await service.deleteImage('prod-1', 'img-1');

    expect(prismaMock.productImage.findFirst).toHaveBeenCalledWith({
      where: { id: 'img-1', productId: 'prod-1' },
    });
    expect(prismaMock.productImage.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'img-1' } }),
    );
  });

  it('deleteImage lanza NotFoundException si la imagen no existe o no pertenece al producto', async () => {
    prismaMock.productImage.findFirst.mockResolvedValue(null);

    await expect(
      service.deleteImage('prod-1', 'img-otro-producto'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prismaMock.productImage.delete).not.toHaveBeenCalled();
  });

  it('deleteImage traduce P2025 a NotFoundException', async () => {
    prismaMock.productImage.findFirst.mockResolvedValue({
      id: 'img-1',
      productId: 'prod-1',
    });
    const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '7.10.0',
    });
    prismaMock.productImage.delete.mockRejectedValue(error);

    await expect(service.deleteImage('prod-1', 'img-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
