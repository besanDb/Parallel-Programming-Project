import { Controller, Post, Body, Req } from '@nestjs/common';
import { CartsService } from './carts.service';
import { AddItemDto } from './dto/add-item.dto';
import type { AuthRequest } from 'src/guards/authentication.guard';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('cart')
export class CartsController {
  constructor(
    private readonly cartsService: CartsService,
    @InjectQueue('checkout') private readonly checkoutQueue: Queue,
  ) {}

  @Post()
  async addItem(@Req() req: AuthRequest, @Body() dot: AddItemDto) {
    return this.cartsService.addToCart(
      +req.user.id,
      dot.productId,
      dot.quantity,
    );
  }

  @Post('checkout')
  async checkout(@Req() req: AuthRequest) {
    console.log(`user ${+req.user.id}`);
    const waiting = await this.checkoutQueue.getWaitingCount();
    console.log(`waiting ${waiting}`);

    if (waiting > 100) {
      throw new Error('Server is busy, try again later');
    }
    return this.cartsService.checkout(+req.user.id);
  }
}
