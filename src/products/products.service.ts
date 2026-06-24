import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProductDto) {
    return await this.prisma.product.create({ data });
  }

  // async findAll() {
  //   return this.prisma.product.findMany();
  // }

  async findOne(id: number) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  async update(id: number, data: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.product.delete({ where: { id } });
  }

  async updateStock(id: number, quantity: number) {
    return this.prisma.product.update({
      where: { id },
      data: { stock: { decrement: quantity } },
    });
  }
  async updateStockAdmin(id: number, dto: UpdateProductDto) {
    const { stock, version } = dto;

    const result = await this.prisma.product.updateMany({
      where: {
        id: id,
        version: version,
      },
      data: {
        stock: stock,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      throw new BadRequestException('Conflict');
    }

    return result;
  }

  async getStock(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: +id },
      select: { stock: true },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return { stock: product.stock };
  }

  async findAll() {
    return await this.prisma.product.findMany();
  }
}
