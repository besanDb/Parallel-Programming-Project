import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ProductStockCacheInterceptor } from 'src/interceptors/stockCache.interceptor';
// import { ProductsBatchService } from './products-batch.service';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    // private readonly productBatchService: ProductsBatchService,
  ) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return {
      data: this.productsService.create(createProductDto),
      message: 'Created successfully',
    };
  }

  @UseInterceptors(CacheInterceptor)
  @Get()
  async findAll() {
    return {
      data: await this.productsService.findAll(),
      message: 'Fetched successfully',
    };
  }
  @UseInterceptors(ProductStockCacheInterceptor)
  @Get(':id/stock')
  async getStock(@Param('id') id: string) {
    return {
      data: await this.productsService.getStock(+id),
      message: 'Fetched successfully',
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return {
      data: this.productsService.findOne(+id),
      message: 'Fetched successfully',
    };
  }

  @Patch(':id')
  async updateStock(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return {
      data: await this.productsService.updateStockAdmin(+id, updateProductDto),
      message: 'Updated successfully',
    };
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return {
      data: this.productsService.update(+id, updateProductDto),
      message: 'Updated successfully',
    };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return {
      data: this.productsService.remove(+id),
      message: 'Removed successfully',
    };
  }

  // @Post('batch-process')
  // batchProcessProducts() {
  //   return this.productBatchService.runProductsBatchProcessing();
  // }
}
