import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Status } from '@prisma/client';
import { Queue, Job } from 'bullmq';
import { log } from 'console';
import { CartsService } from 'src/carts/carts.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { ThreadPoolService } from 'src/threadpool/threadpool.service';

@Processor('checkout', {
  concurrency: 5,
  limiter: { max: 10, duration: 1000 },
})
@Injectable()
export class CheckoutProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private cartsService: CartsService,
    private threadPool: ThreadPoolService,
    private redis: RedisService,
    @InjectQueue('email') private emailQueue: Queue,
    @InjectQueue('dlq') private dlqQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<{ userId: number }>) {
    console.log('added to checkout');
    const { userId } = job.data;

    const lockKey = `lock:checkout:user:${userId}`;
    const lockValue = `${job.id}`;
    const lockTTL = 5000;

    const acquired = await this.redis.set(
      lockKey,
      lockValue,
      'PX',
      lockTTL,
      'NX',
    );

    if (!acquired) {
      console.log(`Checkout already in progress for user ${userId}`);
      return;
    }

    try {
      const cart = await this.cartsService.getCart(userId);

      if (!cart || cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      for (const item of cart.items) {
        if (item.quantity > item.product.stock) {
          throw new Error(`Out of stock`);
        }
      }

      const totalAmount: number = await this.threadPool.run({
        type: 'CALCULATE_TOTAL',
        items: cart.items.map((item) => ({
          price: Number(item.product.price),
          quantity: Number(item.quantity),
        })),
      });

      const order = await this.prisma.order.create({
        data: {
          userId,
          status: Status.PENDING,
          orderItems: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
      });

      job.data['orderId'] = order.id;

      const payment = this.fakePayment({
        orderId: order.id,
        amount: totalAmount,
      });

      if (!payment.success) {
        throw new Error('Payment failed');
      }

      for (const item of cart.items) {
        const result = await this.prisma.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (result.count === 0) {
          throw new Error('Race condition');
        }
      }

      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      await this.emailQueue.add(
        'send-email',
        {
          userId,
          email: cart.user.email,
          orderId: order.id,
          totalAmount,
        },
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

      return { success: true };
    } catch (error) {
      if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
        await this.dlqQueue.add('checkout-failed', {
          originalJob: job.data,
          error: error instanceof Error ? error.message : String(error),
          failedAt: new Date(),
        });
      }

      throw error;
    } finally {
      const currentLock = await this.redis.get(lockKey);

      if (currentLock === lockValue) {
        await this.redis.del(lockKey);
      }
    }
  }

  fakePayment(data: { orderId: number; amount: number }) {
    log(data);
    return { success: true };
  }
}
