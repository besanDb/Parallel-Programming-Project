import { WorkerHost, Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';

interface ProductStats {
  id: number;
  stock: number;
}

interface ProcessInventoryJob {
  chunk: ProductStats[];
}

@Processor('inventory-batch', {
  concurrency: 5,
})
export class InventoryProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<ProcessInventoryJob>): Promise<void> {
    // console.log('JOB RECEIVED:', job.name);
    // console.log(job.data);
    if (job.name === 'process-inventory') {
      // console.log("hi");
      await this.handleInventory(job);
    }
  }

  async handleInventory(job: Job<ProcessInventoryJob>) {
    const { chunk } = job.data;
    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: chunk.map((c) => c.id),
        },
      },
      include: {
        orderItems: true,
      },
    });

    const productsMap = new Map(products.map((p) => [p.id, p]));
    const concurrency = 5;
    for (let i = 0; i < chunk.length; i += concurrency) {
      const batch = chunk.slice(i, i + concurrency);

      await Promise.all(
        batch.map(async (item) => {
          try {
            console.log('Processing product:', item.id);

            // const product = products.find((p) => p.id === item.id);
            const product = productsMap.get(item.id);
            if (!product) {
              console.log('Product not found:', item.id);
              return;
            }

            const soldQuantity = product.orderItems.reduce(
              (sum, oi) => sum + oi.quantity,
              0,
            );

            const expectedStock = product.stock + soldQuantity;

            await this.prisma.inventoryReport.create({
              data: {
                productId: product.id,
                soldQuantity,
                currentStock: product.stock,
                expectedStock,
                createdAt: new Date(),
              },
            });

            console.log(`Product ${product.id} | sold=${soldQuantity}`);
          } catch (error) {
            console.error(`Failed product ${item.id}`, error);
          }
        }),
      );
    }

    // for (const item of chunk) {
    //   console.log('Processing product:', item.id);

    //   const product = await this.prisma.product.findUnique({
    //     where: { id: item.id },
    //     include: {
    //       orderItems: true,
    //     },
    //   });

    //   if (!product) {
    //     console.log('Product not found:', item.id);
    //     continue;
    //   }

    //   const soldQuantity = product.orderItems.reduce(
    //     (sum, oi) => sum + oi.quantity,
    //     0,
    //   );

    //   const expectedStock = product.stock + soldQuantity;

    //   await this.prisma.inventoryReport.create({
    //     data: {
    //       productId: product.id,
    //       soldQuantity,
    //       currentStock: product.stock,
    //       expectedStock,
    //       createdAt: new Date(),
    //     },
    //   });

    //   console.log(
    //     `Product ${product.id} | sold=${soldQuantity} | stock=${product.stock}`,
    //   );
    // }
  }
}
