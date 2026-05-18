import 'dotenv/config';
import { faker } from '@faker-js/faker';
import { PrismaClient, Product } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}

const pool = new Pool({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  const products: Product[] = [];

  for (let i = 0; i < 20; i++) {
    const product = await prisma.product.create({
      data: {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price()),
        stock: faker.number.int({ min: 10, max: 100 }),
      },
    });
    products.push(product);
  }

  const users: { id: number }[] = [];

  for (let i = 0; i < 10; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        password: faker.internet.password(),
      },
    });

    users.push(user);

    const cart = await prisma.cart.create({
      data: {
        userId: user.id,
      },
    });

    const randomProducts = faker.helpers.arrayElements(products, {
      min: 2,
      max: 5,
    });

    for (const product of randomProducts) {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: faker.number.int({ min: 1, max: 3 }),
        },
      });
    }
  }

  for (const user of users) {
    for (let i = 0; i < faker.number.int({ min: 1, max: 3 }); i++) {
      const order = await prisma.order.create({
        data: {
          userId: user.id,
          status: faker.helpers.arrayElement([
            'PENDING',
            'DELIVERED',
            'CANCELLED',
          ]),
        },
      });

      const randomProducts = faker.helpers.arrayElements(products, {
        min: 2,
        max: 5,
      });

      for (const product of randomProducts) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            quantity: faker.number.int({ min: 1, max: 3 }),
            price: product.price,
          },
        });
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
