import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as os from 'os';

@Injectable()
export class CartsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('checkout') private readonly checkoutQueue: Queue,
  ) {}

  async getCart(userId: number) {
    return await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: { include: { product: true } },
        user: true,
      },
    });
  }

  async addToCart(userId: number, productId: number, quantity: number) {
    let cart = await this.prisma.cart.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId } });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
      },
    });
  }

  async checkout(userId: number) {
    const cart = await this.getCart(userId);

    if (!cart || !cart.items.length) {
      throw new Error('Cart is empty');
    }

    await this.checkoutQueue.add(
      'process-checkout',
      { userId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return {
      server: process.pid,
      container: os.hostname(),
      port: process.env.PORT,
      message: 'Order recieved and processing started',
    };
  }
}
