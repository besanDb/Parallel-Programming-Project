import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Status } from '@prisma/client';
import { Queue, Job } from 'bullmq';
import { CartsService } from 'src/carts/carts.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { ThreadPoolService } from 'src/threadpool/threadpool.service';
import { MetricsService } from 'src/metrics/metrics.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Processor('checkout', {
  concurrency: 5,
  limiter: { max: 10, duration: 1000 },
})
@Injectable()
export class CheckoutProcessor extends WorkerHost {
  private readonly logger = new Logger(CheckoutProcessor.name);
  constructor(
    private prisma: PrismaService,
    private cartsService: CartsService,
    private threadPool: ThreadPoolService,
    private redis: RedisService,
    private metrics: MetricsService,
    @InjectQueue('email') private emailQueue: Queue,
    @InjectQueue('dlq') private dlqQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super();
  }

  async process(job: Job<{ userId: number }>) {
    //console.log('added to checkout');
    const { userId } = job.data;

    const lockKey = `lock:checkout:user:${userId}`;
    const lockValue = `${job.id}`;
    const lockTTL = 10_000;

    const acquired = await this.redis.set(
      lockKey,
      lockValue,
      'PX',
      lockTTL,
      'NX',
    );

    if (!acquired) {
      this.logger.warn(`Checkout already in progress for user ${userId}`);
      return;
    }

    try {
      const cart = await this.cartsService.getCart(userId);

      if (!cart || cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      const totalAmount: number = await this.threadPool.run({
        type: 'CALCULATE_TOTAL',
        items: cart.items.map((item) => ({
          price: Number(item.product.price),
          quantity: Number(item.quantity),
        })),
      });

      const order = await this.prisma.$transaction(
        async (tx) => {
          const newOrder = await tx.order.create({
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

          for (const item of cart.items) {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { id: true, stock: true, version: true },
            });

            if (!product) {
              throw new Error(`Product ${item.productId} not found`);
            }

            if (product.stock < item.quantity) {
              throw new Error(
                `Insufficient stock for product ${item.productId}`,
              );
            }

            const updated = await tx.product.updateMany({
              where: {
                id: item.productId,
                version: product.version,
                stock: { gte: item.quantity },
              },
              data: {
                stock: { decrement: item.quantity },
                version: { increment: 1 },
              },
            });
            if (updated.count === 0) {
              throw new Error(
                `Optimistic lock conflict on product ${item.productId} -- please retry`,
              );
            }

            const cacheKey = ` stock:product:${item.productId}`;
            await this.cacheManager.del(cacheKey);
          }

          // const confirmedOrder = await tx.order.update({
          //   where: { id: newOrder.id },
          //   data: {
          //     status: Status.DELIVERED,
          //   },
          // });
          await tx.cartItem.deleteMany({
            where: { cartId: cart.id },
          });
          //return confirmedOrder;
          return newOrder;
        },
        {
          isolationLevel: 'RepeatableRead',
          timeout: 8000,
          maxWait: 3000,
        },
      );

      job.data['orderId'] = order.id;

      const payment = this.fakePayment({
        userId,
        amount: totalAmount,
      });

      if (!payment.success) {
        await this.prisma.order.update({
          where: {
            id: order.id,
          },
          data: {
            status: Status.FAILED,
          },
        });
        for (const item of cart.items) {
          await this.prisma.product.update({
            where: {
              id: item.productId,
            },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
        throw new Error('Payment failed');
      }
      await this.prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: Status.DELIVERED,
        },
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

      this.logger.log(
        `CheckOut succsessful for user ${userId}, order ${order.id}`,
      );
      //للطلب العاشر
      this.metrics.checkoutTotal.labels('success').inc();

      return { success: true, orderId: order.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`CheckOut failed for user ${userId}: ${message}`);

      if (job.attemptsMade >= (job.opts.attempts ?? 1) - 1) {
        await this.dlqQueue.add('checkout-failed', {
          originalJob: job.data,
          error: message,
          failedAt: new Date(),
        });
        //برضو العاشر
        this.metrics.checkoutTotal.labels('failed').inc();
      }

      throw error;
    } finally {
      const currentLock = await this.redis.get(lockKey);

      if (currentLock === lockValue) {
        await this.redis.del(lockKey);
      }
    }
  }

  fakePayment(data: { userId: number; amount: number }) {
    this.logger.log(
      `Processing payment for user ${data.userId}, amount: ${data.amount}`,
    );
    return { success: true };
  }
}
