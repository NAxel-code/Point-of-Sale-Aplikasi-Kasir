const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pos.com' },
    update: {},
    create: {
      name: 'Admin Kasir',
      email: 'admin@pos.com',
      passwordHash: 'hashed_password_mock', // mocked for MVP
      role: 'ADMIN',
    },
  })

  const cashier = await prisma.user.upsert({
    where: { email: 'kasir1@pos.com' },
    update: {},
    create: {
      name: 'Kasir Satu',
      email: 'kasir1@pos.com',
      passwordHash: 'hashed_password_mock',
      role: 'CASHIER',
    },
  })

  const category = await prisma.category.create({
    data: { name: 'Minuman' }
  })

  await prisma.product.create({
    data: {
      name: 'Kopi Susu Gula Aren',
      sku: 'KOP-001',
      price: 18000,
      stock: 50,
      categoryId: category.id
    }
  })

  await prisma.product.create({
    data: {
      name: 'Teh Manis Dingin',
      sku: 'TEH-001',
      price: 8000,
      stock: 100,
      categoryId: category.id
    }
  })

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
