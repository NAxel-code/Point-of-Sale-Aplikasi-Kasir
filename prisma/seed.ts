const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  await prisma.inventoryMovement.deleteMany()
  await prisma.transactionItem.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pos.com' },
    update: {},
    create: {
      name: 'Admin Kasir',
      email: 'admin@pos.com',
      passwordHash: 'hashed_password_mock',
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

  const catKopi = await prisma.category.create({ data: { name: 'Kopi' } })
  const catNonKopi = await prisma.category.create({ data: { name: 'Non Kopi' } })
  const catPastry = await prisma.category.create({ data: { name: 'Pastry' } })

  await prisma.product.createMany({
    data: [
      {
        name: 'Espresso',
        sku: 'KOP-001',
        price: 15000,
        stock: 50,
        imageUrl: '/images/products/espresso.jpeg',
        categoryId: catKopi.id
      },
      {
        name: 'Café Latte',
        sku: 'KOP-002',
        price: 22000,
        stock: 45,
        imageUrl: '/images/products/latte.jpeg',
        categoryId: catKopi.id
      },
      {
        name: 'Cappuccino',
        sku: 'KOP-003',
        price: 22000,
        stock: 30,
        imageUrl: '/images/products/cappuccino.jpeg',
        categoryId: catKopi.id
      },
      {
        name: 'Mocha Frappe',
        sku: 'KOP-004',
        price: 28000,
        stock: 20,
        imageUrl: '/images/products/mocha.jpeg',
        categoryId: catKopi.id
      },
      {
        name: 'Iced Americano',
        sku: 'KOP-005',
        price: 18000,
        stock: 100,
        imageUrl: '/images/products/americano.jpeg',
        categoryId: catKopi.id
      },
      {
        name: 'Cold Brew Signature',
        sku: 'KOP-006',
        price: 25000,
        stock: 15,
        imageUrl: '/images/products/cold_brew.jpeg',
        categoryId: catKopi.id
      },
      {
        name: 'Manual Brew V60',
        sku: 'KOP-007',
        price: 28000,
        stock: 25,
        imageUrl: '/images/products/matcha.jpeg',
        categoryId: catKopi.id
      },
      {
        name: 'French Press',
        sku: 'KOP-008',
        price: 25000,
        stock: 18,
        imageUrl: '/images/products/pastry1.jpeg',
        categoryId: catKopi.id
      },
      {
        name: 'Iced Matcha Latte',
        sku: 'NON-001',
        price: 26000,
        stock: 30,
        imageUrl: '/images/products/pastry2.jpeg',
        categoryId: catNonKopi.id
      },
      {
        name: 'Matcha Choco Frappe',
        sku: 'NON-002',
        price: 30000,
        stock: 15,
        imageUrl: '/images/products/pastry3.jpeg',
        categoryId: catNonKopi.id
      },
      {
        name: 'Espresso Tonic',
        sku: 'KOP-009',
        price: 28000,
        stock: 10,
        imageUrl: '/images/products/pastry4.webp',
        categoryId: catKopi.id
      },
      {
        name: 'Creamy Iced Coffee',
        sku: 'KOP-010',
        price: 26000,
        stock: 20,
        imageUrl: '/images/products/pastry5.jpeg',
        categoryId: catKopi.id
      }
    ]
  })

  console.log('Seeding finished with images.')
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
