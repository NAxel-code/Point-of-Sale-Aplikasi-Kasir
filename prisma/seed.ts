const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  await prisma.inventoryMovement.deleteMany()
  await prisma.transactionItem.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.shift.deleteMany()
  await prisma.session.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()

  // 1. Password Hashing (Bcrypt Cost 10)
  const adminPasswordHash = await bcrypt.hash('admin123', 10)
  const cashierPasswordHash = await bcrypt.hash('kasir123', 10)

  // 2. Seed Admin & Cashier User
  await prisma.user.upsert({
    where: { email: 'admin@pos.com' },
    update: {
      role: 'ADMIN',
      passwordHash: adminPasswordHash,
      failedLoginAttempts: 0,
      lockoutUntil: null,
    },
    create: {
      name: 'Admin Toko',
      email: 'admin@pos.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  })

  await prisma.user.upsert({
    where: { email: 'kasir1@pos.com' },
    update: {
      role: 'CASHIER',
      passwordHash: cashierPasswordHash,
      failedLoginAttempts: 0,
      lockoutUntil: null,
    },
    create: {
      name: 'Kasir Satu',
      email: 'kasir1@pos.com',
      passwordHash: cashierPasswordHash,
      role: 'CASHIER',
    },
  })

  // 3. Seed Categories
  const catKopi = await prisma.category.create({ data: { name: 'Kopi' } })
  const catNonKopi = await prisma.category.create({ data: { name: 'Non Kopi' } })
  const catPastry = await prisma.category.create({ data: { name: 'Pastry' } })

  // 4. Seed Products
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

  console.log('Seeding berhasil: Data produk dan akun kasir telah siap.')
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
