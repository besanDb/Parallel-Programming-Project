import 'dotenv/config';
import { faker } from '@faker-js/faker';
import { PrismaClient, Product } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
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

  // =========================
  // PRODUCTS ONLY
  // =========================

  for (let i = 0; i < 5; i++) {
    const product = await prisma.product.create({
      data: {
        name: `🔥 HOT ${faker.commerce.productName()}`,
        description: faker.commerce.productDescription(),
        price: Number(faker.commerce.price()),
        stock: 1,
      },
    });

    products.push(product);
  }

  for (let i = 0; i < 10; i++) {
    const product = await prisma.product.create({
      data: {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: Number(faker.commerce.price()),
        stock: faker.number.int({ min: 10, max: 100 }),
      },
    });

    products.push(product);
  }

  console.log(`✅ Seeded ${products.length} products successfully`);
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
