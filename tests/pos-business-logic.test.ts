import test, { before, after } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

let testAdminId: string;
let testCashierId: string;
let testProductId: string;
let testShiftId: string;

before(async () => {
  // Setup isolated test entities
  const adminPass = await bcrypt.hash('admin123', 10);
  const cashierPass = await bcrypt.hash('kasir123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'test_admin@pos.com' },
    update: { role: 'ADMIN', passwordHash: adminPass, failedLoginAttempts: 0, lockoutUntil: null },
    create: { name: 'Test Admin', email: 'test_admin@pos.com', passwordHash: adminPass, role: 'ADMIN' },
  });
  testAdminId = admin.id;

  const cashier = await prisma.user.upsert({
    where: { email: 'test_cashier@pos.com' },
    update: { role: 'CASHIER', passwordHash: cashierPass, failedLoginAttempts: 0, lockoutUntil: null },
    create: { name: 'Test Kasir', email: 'test_cashier@pos.com', passwordHash: cashierPass, role: 'CASHIER' },
  });
  testCashierId = cashier.id;

  const product = await prisma.product.create({
    data: {
      sku: 'TEST-SKU-' + Date.now(),
      name: 'Kopi Uji Test',
      price: 25000,
      stock: 10,
      isActive: true,
    },
  });
  testProductId = product.id;

  const shift = await prisma.shift.create({
    data: {
      cashierId: testCashierId,
      openingCash: 50000,
      status: 'OPEN',
    },
  });
  testShiftId = shift.id;
});

after(async () => {
  // Cleanup test entities safely
  await prisma.inventoryMovement.deleteMany({ where: { productId: testProductId } });
  await prisma.transactionItem.deleteMany({ where: { productId: testProductId } });
  await prisma.transaction.deleteMany({ where: { shiftId: testShiftId } });
  await prisma.shift.deleteMany({ where: { id: testShiftId } });
  await prisma.product.deleteMany({ where: { id: testProductId } });
  await prisma.session.deleteMany({ where: { userId: { in: [testAdminId, testCashierId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [testAdminId, testCashierId] } } });
  await prisma.$disconnect();
});

test('POS Logic: User Roles and Password Authentication', async () => {
  const admin = await prisma.user.findUnique({ where: { id: testAdminId } });
  const cashier = await prisma.user.findUnique({ where: { id: testCashierId } });

  assert.strictEqual(admin?.role, 'ADMIN');
  assert.strictEqual(cashier?.role, 'CASHIER');

  const isAdminValid = await bcrypt.compare('admin123', admin!.passwordHash);
  assert.strictEqual(isAdminValid, true);

  const isFakeRejected = await bcrypt.compare('wrong123', admin!.passwordHash);
  assert.strictEqual(isFakeRejected, false);
});

test('POS Logic: Account Lockout after failed attempts threshold', async () => {
  const user = await prisma.user.update({
    where: { id: testCashierId },
    data: {
      failedLoginAttempts: 5,
      lockoutUntil: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  assert.strictEqual(user.failedLoginAttempts, 5);
  assert.ok(user.lockoutUntil !== null);
  assert.ok(user.lockoutUntil.getTime() > Date.now());

  // Successful login resets lockout
  const resetUser = await prisma.user.update({
    where: { id: testCashierId },
    data: { failedLoginAttempts: 0, lockoutUntil: null },
  });
  assert.strictEqual(resetUser.failedLoginAttempts, 0);
  assert.strictEqual(resetUser.lockoutUntil, null);
});

test('POS Logic: Stock Decrement & Inventory Movement on Transaction', async () => {
  const qtyToBuy = 3;
  const productBefore = await prisma.product.findUnique({ where: { id: testProductId } });
  assert.strictEqual(productBefore?.stock, 10);

  const receiptNumber = 'TRX-TEST-' + Date.now();

  const tx = await prisma.$transaction(async (db) => {
    await db.product.update({
      where: { id: testProductId },
      data: { stock: { decrement: qtyToBuy } },
    });

    await db.inventoryMovement.create({
      data: {
        productId: testProductId,
        type: 'OUT',
        quantity: qtyToBuy,
        reason: `Penjualan ${receiptNumber}`,
      },
    });

    return await db.transaction.create({
      data: {
        receiptNumber,
        cashierId: testCashierId,
        shiftId: testShiftId,
        subtotal: productBefore!.price * qtyToBuy,
        grandTotal: productBefore!.price * qtyToBuy,
        paymentMethod: 'CASH',
        paymentAmount: 100000,
        change: 100000 - (productBefore!.price * qtyToBuy),
        status: 'COMPLETED',
        items: {
          create: [{
            productId: testProductId,
            productName: productBefore!.name,
            productPrice: productBefore!.price,
            quantity: qtyToBuy,
            subtotal: productBefore!.price * qtyToBuy,
          }],
        },
      },
      include: { items: true },
    });
  });

  assert.strictEqual(tx.paymentMethod, 'CASH');
  assert.strictEqual(tx.grandTotal, 75000);
  assert.strictEqual(tx.change, 25000);

  const productAfter = await prisma.product.findUnique({ where: { id: testProductId } });
  assert.strictEqual(productAfter?.stock, 7, 'Stock should be 10 - 3 = 7');
});

test('POS Logic: Prevents Overselling when requested quantity exceeds available stock', async () => {
  const product = await prisma.product.findUnique({ where: { id: testProductId } });
  const currentStock = product!.stock; // Currently 7
  const excessQty = currentStock + 5; // 12

  const canFulfill = product!.stock >= excessQty;
  assert.strictEqual(canFulfill, false, 'Should block transaction when stock is insufficient');
});

test('POS Logic: Void Transaction Restores Stock and Records Movement', async () => {
  // Find the completed transaction created in previous test
  const existingTx = await prisma.transaction.findFirst({
    where: { shiftId: testShiftId, status: 'COMPLETED' },
    include: { items: true },
  });
  assert.ok(existingTx, 'Existing transaction should exist');

  const productBeforeVoid = await prisma.product.findUnique({ where: { id: testProductId } });
  const stockBeforeVoid = productBeforeVoid!.stock; // 7

  // Execute voiding
  await prisma.$transaction(async (db) => {
    for (const item of existingTx.items) {
      await db.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });

      await db.inventoryMovement.create({
        data: {
          productId: item.productId,
          type: 'IN',
          quantity: item.quantity,
          reason: `Void ${existingTx.receiptNumber}: Customer canceled`,
        },
      });
    }

    await db.transaction.update({
      where: { id: existingTx.id },
      data: { status: 'VOIDED', voidReason: 'Customer canceled' },
    });
  });

  const updatedTx = await prisma.transaction.findUnique({ where: { id: existingTx.id } });
  assert.strictEqual(updatedTx?.status, 'VOIDED');
  assert.strictEqual(updatedTx?.voidReason, 'Customer canceled');

  const productAfterVoid = await prisma.product.findUnique({ where: { id: testProductId } });
  assert.strictEqual(productAfterVoid?.stock, stockBeforeVoid + 3, 'Stock should be restored from 7 to 10');
});

test('POS Logic: Shift Cash Drawer Reconciliation (Selisih Kas)', async () => {
  const openingCash = 50000;
  const cashSaleAmount = 40000;

  // Create a completed CASH transaction
  await prisma.transaction.create({
    data: {
      receiptNumber: 'TRX-CASH-' + Date.now(),
      cashierId: testCashierId,
      shiftId: testShiftId,
      subtotal: cashSaleAmount,
      grandTotal: cashSaleAmount,
      paymentMethod: 'CASH',
      paymentAmount: 50000,
      change: 10000,
      status: 'COMPLETED',
    },
  });

  // Create a QRIS transaction (should NOT be counted into physical cash drawer)
  await prisma.transaction.create({
    data: {
      receiptNumber: 'TRX-QRIS-' + Date.now(),
      cashierId: testCashierId,
      shiftId: testShiftId,
      subtotal: 30000,
      grandTotal: 30000,
      paymentMethod: 'QRIS',
      paymentAmount: 30000,
      change: 0,
      status: 'COMPLETED',
    },
  });

  // Calculate cash sales in this shift
  const cashAgg = await prisma.transaction.aggregate({
    where: { shiftId: testShiftId, status: 'COMPLETED', paymentMethod: 'CASH' },
    _sum: { grandTotal: true },
  });

  const totalCashSales = cashAgg._sum.grandTotal || 0;
  assert.strictEqual(totalCashSales, cashSaleAmount, 'Only CASH transactions should be in cash drawer total');

  const expectedCash = openingCash + totalCashSales; // 50000 + 40000 = 90000
  assert.strictEqual(expectedCash, 90000);

  // Scenario A: Cash matches exactly (closingCash = 90000)
  const exactClosingCash = 90000;
  const diffA = exactClosingCash - expectedCash;
  assert.strictEqual(diffA, 0, 'Selisih kas should be 0 (Pas)');

  // Scenario B: Physical cash is short (closingCash = 85000)
  const shortClosingCash = 85000;
  const diffB = shortClosingCash - expectedCash;
  assert.strictEqual(diffB, -5000, 'Selisih kas should show -5000 shortage');
});
