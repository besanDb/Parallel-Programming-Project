import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BadRequestException } from '@nestjs/common';
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
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });

    if (!product) {
      //throw new BadRequestException('Product not found');
      return {
        success: false,
        message: 'Product not found',
      };
    }

    if (product.stock < quantity) {
      // throw new BadRequestException('Not enough stock available');
      return {
        success: false,
        message: 'Not enough stock available',
      };
    }

    let cart = await this.prisma.cart.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
      });
    }

    const cartItem = this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
      },
    });
    return {
      success: true,
      message: 'Product added to cart successfully',
      data: cartItem,
    };
  }

  async checkout(userId: number) {
    const cart = await this.getCart(userId);

    if (!cart || !cart.items.length) {
      //throw new ConflictException('Cart is empty');
      return {
        success: false,
        queued: false,
        message: 'Cart is empty',
      };
    }
    const waiting = await this.checkoutQueue.getWaitingCount();
    const active = await this.checkoutQueue.getActiveCount();
    const total = waiting + active;

    if (total > 150) {
      return {
        success: false,
        queued: false,
        message: 'Server busy, please retry in a moment',
      };
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
      // server: process.pid,
      // container: os.hostname(),
      // port: process.env.PORT,
      success: true,
      queued: true,
      server: process.pid,
      container: os.hostname(),
      message: 'Order recieved and processing started',
    };
  }
}
