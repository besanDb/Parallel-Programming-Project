import { Controller, Post, Body, Req } from '@nestjs/common';
import { CartsService } from './carts.service';
import { AddItemDto } from './dto/add-item.dto';
import type { AuthRequest } from 'src/guards/authentication.guard';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';

@Controller('cart')
export class CartsController {
  constructor(
    private readonly cartsService: CartsService,
    private readonly prisma: PrismaService,
    @InjectQueue('checkout') private readonly checkoutQueue: Queue,
  ) {}

  @Post()
  async addItem(@Req() req: AuthRequest, @Body() dot: AddItemDto) {
    return await this.cartsService.addToCart(
      +req.user.id,
      dot.productId,
      dot.quantity,
    );
  }

  @Post('checkout')
  async checkout(@Req() req: AuthRequest) {
    const userId = +req.user.id;

    return this.cartsService.checkout(userId);
  }
}
