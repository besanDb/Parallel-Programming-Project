import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProductsService } from './products.service';
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

  @Get()
  findAll() {
    return {
      data: this.productsService.findAll(),
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
