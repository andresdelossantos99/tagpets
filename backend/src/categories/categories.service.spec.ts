jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const prismaMock = {
    category: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = moduleRef.get<CategoriesService>(CategoriesService);
  });

  it('findPublic filtra active=true y ordena por sortOrder y name', async () => {
    prismaMock.category.findMany.mockResolvedValue([]);

    await service.findPublic();

    expect(prismaMock.category.findMany).toHaveBeenCalledWith({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  });

  it('crea una categoría correctamente', async () => {
    const dto: CreateCategoryDto = {
      name: 'Perros',
      slug: 'perros',
    };

    const created = {
      id: '11111111-1111-4111-8111-111111111111',
      description: null,
      active: true,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...dto,
    };

    prismaMock.category.create.mockResolvedValue(created);

    const result = await service.create(dto);

    expect(result).toEqual(created);
    expect(prismaMock.category.create).toHaveBeenCalledWith({
      data: dto,
    });
  });

  it('lanza ConflictException si el slug ya existe al crear', async () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '7.10.0',
      },
    );

    prismaMock.category.create.mockRejectedValue(error);

    const dto: CreateCategoryDto = {
      name: 'Perros',
      slug: 'perros',
    };

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('lanza NotFoundException si la categoría a actualizar no existe', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '7.10.0',
    });

    prismaMock.category.update.mockRejectedValue(error);

    const dto: UpdateCategoryDto = {
      name: 'X',
    };

    await expect(
      service.update('11111111-1111-4111-8111-111111111111', dto),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lanza ConflictException si el slug ya existe al actualizar', async () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '7.10.0',
      },
    );

    prismaMock.category.update.mockRejectedValue(error);

    const dto: UpdateCategoryDto = {
      slug: 'perros',
    };

    await expect(
      service.update('11111111-1111-4111-8111-111111111111', dto),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
