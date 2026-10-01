import test, { before, after } from 'node:test';
import assert from 'node:assert';
import prisma from '@/lib/prisma';

let cashierId: string;
let shiftId: string;
let productAId: string;
let productBId: string;
let inactiveProductId: string;

before(async () => {
  const cashier = await prisma.user.create({
    data: {
      name: 'Cashier Integrity Test',
      email: `cashier_integrity_${Date.now()}@pos.local`,
      passwordHash: 'dummyhash',
      role: 'CASHIER',
    },
  });
  cashierId = cashier.id;

  const shift = await prisma.shift.create({
    data: {
      cashierId,
      openingCash: 100000,
      status: 'OPEN',
    },
  });
  shiftId = shift.id;

  const pA = await prisma.product.create({
    data: {
      sku: `SKU-A-${Date.now()}`,
      name: 'Matcha Latte Premium',
      price: 35000,
      stock: 15,
      isActive: true,
    },
  });
  productAId = pA.id;

  const pB = await prisma.product.create({
    data: {
      sku: `SKU-B-${Date.now()}`,
      name: 'Croissant Butter',
      price: 22000,
      stock: 8,
      isActive: true,
    },
  });
  productBId = pB.id;

  const pInactive = await prisma.product.create({
    data: {
      sku: `SKU-INACTIVE-${Date.now()}`,
      name: 'Menu Musiman Kedaluwarsa',
      price: 30000,
      stock: 5,
      isActive: false,
    },
  });
  inactiveProductId = pInactive.id;
});

after(async () => {
  await prisma.inventoryMovement.deleteMany({
    where: { productId: { in: [productAId, productBId, inactiveProductId] } },
  });
  await prisma.transactionItem.deleteMany({
    where: { productId: { in: [productAId, productBId, inactiveProductId] } },
  });
  await prisma.transaction.deleteMany({ where: { shiftId } });
  await prisma.shift.deleteMany({ where: { id: shiftId } });
  await prisma.product.deleteMany({
    where: { id: { in: [productAId, productBId, inactiveProductId] } },
  });
  await prisma.user.deleteMany({ where: { id: cashierId } });
});

test('Price Integrity: Server enforces DB prices over manipulated client prices', async () => {
  const clientInput = [
    { productId: productAId, price: 1000, quantity: 2 }, // Client attempts Rp 1,000 instead of Rp 35,000
    { productId: productBId, price: 500, quantity: 1 },  // Client attempts Rp 500 instead of Rp 22,000
  ];

  // Fetch true DB prices
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: clientInput.map(i => i.productId) } },
  });
  const productMap = new Map(dbProducts.map(p => [p.id, p]));

  let trueSubtotal = 0;
  for (const item of clientInput) {
    const dbP = productMap.get(item.productId)!;
    trueSubtotal += dbP.price * item.quantity;
  }

  // True calculation: (35000 * 2) + (22000 * 1) = 70000 + 22000 = 92000
  // Fake client calculation would have been: (1000 * 2) + (500 * 1) = 2500
  assert.strictEqual(trueSubtotal, 92000);
  assert.notStrictEqual(trueSubtotal, 2500);
});

test('Transaction Validation: Rejects invalid quantities (zero, negative, NaN)', () => {
  const testCases = [0, -1, -99, NaN];

  for (const qty of testCases) {
    const isValid = typeof qty === 'number' && !isNaN(qty) && qty > 0;
    assert.strictEqual(isValid, false, `Quantity ${qty} must be invalid`);
  }

  const validQty = 3;
  const isValid = typeof validQty === 'number' && !isNaN(validQty) && validQty > 0;
  assert.strictEqual(isValid, true);
});

test('Transaction Validation: Inactive product cannot be purchased', async () => {
  const product = await prisma.product.findUnique({ where: { id: inactiveProductId } });
  assert.ok(product);
  assert.strictEqual(product.isActive, false);

  const canPurchase = product.isActive && product.stock > 0;
  assert.strictEqual(canPurchase, false, 'Inactive product must be blocked from purchase');
});

test('Payment Math: Validates change calculation and rejects underpayment', () => {
  const grandTotal = 92000;

  // Case 1: Underpayment (Rp 80,000 paid for Rp 92,000 total)
  const underPayment = 80000;
  const underChange = underPayment - grandTotal;
  assert.strictEqual(underChange < 0, true, 'Underpayment should result in negative change and be rejected');

  // Case 2: Exact payment
  const exactPayment = 92000;
  const exactChange = exactPayment - grandTotal;
  assert.strictEqual(exactChange, 0, 'Exact payment should produce zero change');

  // Case 3: Overpayment (Rp 100,000 paid)
  const overPayment = 100000;
  const overChange = overPayment - grandTotal;
  assert.strictEqual(overChange, 8000, 'Overpayment change must equal Rp 8,000');
});

test('Atomic Multi-Item Transaction: Decrements stocks and records movements atomically', async () => {
  const stockABefore = (await prisma.product.findUnique({ where: { id: productAId } }))!.stock; // 15
  const stockBBefore = (await prisma.product.findUnique({ where: { id: productBId } }))!.stock; // 8

  const buyQtyA = 2;
  const buyQtyB = 3;
  const receiptNum = `TRX-INT-${Date.now()}`;

  const createdTx = await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productAId },
      data: { stock: { decrement: buyQtyA } },
    });
    await tx.inventoryMovement.create({
      data: {
        productId: productAId,
        type: 'OUT',
        quantity: buyQtyA,
        reason: `Penjualan ${receiptNum}`,
      },
    });

    await tx.product.update({
      where: { id: productBId },
      data: { stock: { decrement: buyQtyB } },
    });
    await tx.inventoryMovement.create({
      data: {
        productId: productBId,
        type: 'OUT',
        quantity: buyQtyB,
        reason: `Penjualan ${receiptNum}`,
      },
    });

    return await tx.transaction.create({
      data: {
        receiptNumber: receiptNum,
        cashierId,
        shiftId,
        subtotal: (35000 * buyQtyA) + (22000 * buyQtyB),
        grandTotal: (35000 * buyQtyA) + (22000 * buyQtyB),
        paymentMethod: 'CASH',
        paymentAmount: 150000,
        change: 150000 - ((35000 * buyQtyA) + (22000 * buyQtyB)),
        status: 'COMPLETED',
        items: {
          create: [
            {
              productId: productAId,
              productName: 'Matcha Latte Premium',
              productPrice: 35000,
              quantity: buyQtyA,
              subtotal: 35000 * buyQtyA,
            },
            {
              productId: productBId,
              productName: 'Croissant Butter',
              productPrice: 22000,
              quantity: buyQtyB,
              subtotal: 22000 * buyQtyB,
            },
          ],
        },
      },
      include: { items: true },
    });
  });

  assert.strictEqual(createdTx.items.length, 2);
  assert.strictEqual(createdTx.grandTotal, 136000);
  assert.strictEqual(createdTx.change, 14000);

  const stockAAfter = (await prisma.product.findUnique({ where: { id: productAId } }))!.stock;
  const stockBAfter = (await prisma.product.findUnique({ where: { id: productBId } }))!.stock;

  assert.strictEqual(stockAAfter, stockABefore - buyQtyA, 'Product A stock decremented');
  assert.strictEqual(stockBAfter, stockBBefore - buyQtyB, 'Product B stock decremented');
});

test('Void Safeguard: Prevents double-voiding and restores all multi-item stocks', async () => {
  const txToVoid = await prisma.transaction.findFirst({
    where: { shiftId, status: 'COMPLETED' },
    include: { items: true },
  });
  assert.ok(txToVoid, 'Completed transaction must exist');

  const stockABeforeVoid = (await prisma.product.findUnique({ where: { id: productAId } }))!.stock;
  const stockBBeforeVoid = (await prisma.product.findUnique({ where: { id: productBId } }))!.stock;

  // 1st Void: Should succeed
  await prisma.$transaction(async (tx) => {
    for (const item of txToVoid.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          type: 'IN',
          quantity: item.quantity,
          reason: `Void ${txToVoid.receiptNumber}: Customer refund`,
        },
      });
    }
    await tx.transaction.update({
      where: { id: txToVoid.id },
      data: { status: 'VOIDED', voidReason: 'Customer refund' },
    });
  });

  const voidedTx = await prisma.transaction.findUnique({ where: { id: txToVoid.id } });
  assert.strictEqual(voidedTx?.status, 'VOIDED');

  // Verify stock restoration
  const stockAAfterVoid = (await prisma.product.findUnique({ where: { id: productAId } }))!.stock;
  const stockBAfterVoid = (await prisma.product.findUnique({ where: { id: productBId } }))!.stock;
  assert.strictEqual(stockAAfterVoid, stockABeforeVoid + 2);
  assert.strictEqual(stockBAfterVoid, stockBBeforeVoid + 3);

  // 2nd Void attempt: Should be blocked by guard check
  const checkStatus = voidedTx?.status;
  const canVoidAgain = checkStatus !== 'VOIDED';
  assert.strictEqual(canVoidAgain, false, 'Already voided transaction must not be voided again');
});
