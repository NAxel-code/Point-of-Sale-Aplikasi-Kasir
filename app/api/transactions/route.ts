import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { cashierId, shiftId, items, paymentAmount, customerName, tableNumber } = body;
    
    // Fallback for MVP if mock IDs are sent from UI
    if (cashierId === "mock-cashier-id" || shiftId === "mock-shift-id") {
      let activeShift = await prisma.shift.findFirst({ where: { status: "OPEN" }, include: { cashier: true } });
      
      // If no open shift exists, create a dummy one on the fly so it doesn't crash
      if (!activeShift) {
        let user = await prisma.user.findFirst();
        if (!user) {
          user = await prisma.user.create({
            data: { name: 'Mock Kasir', email: `mock${Date.now()}@pos.com`, passwordHash: 'mock', role: 'CASHIER' }
          });
        }
        activeShift = await prisma.shift.create({
          data: { cashierId: user.id, openingCash: 0, status: 'OPEN' },
          include: { cashier: true }
        });
      }

      cashierId = activeShift.cashierId;
      shiftId = activeShift.id;
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const grandTotal = subtotal; // No tax/discount in MVP by default
    const change = paymentAmount - grandTotal;

    if (change < 0) {
      return NextResponse.json({ error: "Payment amount is insufficient" }, { status: 400 });
    }

    const receiptNumber = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Execute transaction to ensure ACID
    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Create the transaction record
      const newTx = await tx.transaction.create({
        data: {
          receiptNumber,
          customerName,
          tableNumber,
          cashierId,
          shiftId,
          subtotal,
          grandTotal,
          paymentAmount,
          change,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              productName: item.name,
              productPrice: item.price,
              quantity: item.quantity,
              subtotal: item.price * item.quantity
            }))
          }
        },
        include: { items: true }
      });

      // 2. Deduct inventory and record movement
      for (const item of items) {
        // Decrease stock
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });

        // Record movement
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: "OUT",
            quantity: item.quantity,
            reason: `Sale ${receiptNumber}`
          }
        });
      }

      return newTx;
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Transaction Error:", error);
    return NextResponse.json({ error: "Failed to process transaction" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        cashier: { select: { name: true } },
        items: true
      }
    });
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
