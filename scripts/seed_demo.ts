import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const cashier = await prisma.user.findUnique({ where: { email: 'kasir1@pos.com' } })
  const admin = await prisma.user.findUnique({ where: { email: 'admin@pos.com' } })
  if (!cashier || !admin) {
    console.error("Users not found")
    return
  }

  // Create active shift if not exists
  let shift = await prisma.shift.findFirst({ where: { status: 'OPEN', cashierId: cashier.id } })
  if (!shift) {
    shift = await prisma.shift.create({
      data: {
        cashierId: cashier.id,
        openingCash: 200000,
        status: 'OPEN'
      }
    })
  }

  const products = await prisma.product.findMany({ take: 6 })
  if (products.length < 3) {
    console.error("Not enough products")
    return
  }

  // Clear existing demo transactions
  await prisma.transactionItem.deleteMany()
  await prisma.transaction.deleteMany()

  const now = new Date()

  // TX 1: Deni Pratama (Meja 03, QRIS)
  await prisma.transaction.create({
    data: {
      receiptNumber: 'TRX-' + (Date.now() - 3600000).toString().slice(-8),
      customerName: 'Deni Pratama',
      tableNumber: '03',
      cashierId: cashier.id,
      shiftId: shift.id,
      subtotal: 50000,
      grandTotal: 50000,
      paymentMethod: 'QRIS',
      paymentAmount: 50000,
      change: 0,
      status: 'COMPLETED',
      createdAt: new Date(now.getTime() - 2 * 3600 * 1000),
      items: {
        create: [
          {
            productId: products[0].id,
            productName: products[0].name,
            productPrice: products[0].price,
            quantity: 2,
            subtotal: products[0].price * 2
          },
          {
            productId: products[1].id,
            productName: products[1].name,
            productPrice: 20000,
            quantity: 1,
            subtotal: 20000
          }
        ]
      }
    }
  })

  // TX 2: Siti Rahma (Meja 05, CARD)
  await prisma.transaction.create({
    data: {
      receiptNumber: 'TRX-' + (Date.now() - 2400000).toString().slice(-8),
      customerName: 'Siti Rahma',
      tableNumber: '05',
      cashierId: cashier.id,
      shiftId: shift.id,
      subtotal: 69000,
      grandTotal: 69000,
      paymentMethod: 'CARD',
      paymentAmount: 69000,
      change: 0,
      status: 'COMPLETED',
      createdAt: new Date(now.getTime() - 1 * 3600 * 1000),
      items: {
        create: [
          {
            productId: products[1].id,
            productName: products[1].name,
            productPrice: products[1].price,
            quantity: 2,
            subtotal: products[1].price * 2
          },
          {
            productId: products[2].id,
            productName: products[2].name,
            productPrice: products[2].price,
            quantity: 1,
            subtotal: products[2].price
          }
        ]
      }
    }
  })

  // TX 3: Andi Wijaya (Meja 01, CASH)
  await prisma.transaction.create({
    data: {
      receiptNumber: 'TRX-' + (Date.now() - 1200000).toString().slice(-8),
      customerName: 'Andi Wijaya',
      tableNumber: '01',
      cashierId: cashier.id,
      shiftId: shift.id,
      subtotal: 36000,
      grandTotal: 36000,
      paymentMethod: 'CASH',
      paymentAmount: 50000,
      change: 14000,
      status: 'COMPLETED',
      createdAt: new Date(now.getTime() - 30 * 60 * 1000),
      items: {
        create: [
          {
            productId: products[0].id,
            productName: products[0].name,
            productPrice: products[0].price,
            quantity: 1,
            subtotal: products[0].price
          },
          {
            productId: products[1].id,
            productName: products[1].name,
            productPrice: 21000,
            quantity: 1,
            subtotal: 21000
          }
        ]
      }
    }
  })

  // TX 4: Rian Hidayat (Meja 02, CASH - siap untuk demo Void)
  await prisma.transaction.create({
    data: {
      receiptNumber: 'TRX-' + (Date.now() - 600000).toString().slice(-8),
      customerName: 'Rian Hidayat',
      tableNumber: '02',
      cashierId: cashier.id,
      shiftId: shift.id,
      subtotal: 18000,
      grandTotal: 18000,
      paymentMethod: 'CASH',
      paymentAmount: 20000,
      change: 2000,
      status: 'COMPLETED',
      createdAt: new Date(now.getTime() - 15 * 60 * 1000),
      items: {
        create: [
          {
            productId: products[0].id,
            productName: products[0].name,
            productPrice: 18000,
            quantity: 1,
            subtotal: 18000
          }
        ]
      }
    }
  })

  console.log("Demo initial transactions seeded successfully!")
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
  })
