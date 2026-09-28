import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // 1. Verifikasi Sesi Kasir Terotentikasi
    const auth = await requireAuth();
    if (!auth.authorized || !auth.session) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const cashierId = auth.session.user.id;
    const body = await request.json();
    const { items, paymentAmount, customerName, tableNumber, paymentMethod = "CASH" } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Keranjang belanja tidak boleh kosong." }, { status: 400 });
    }

    // 2. Dapatkan atau Buat Shift Aktif untuk Kasir ini
    let activeShift = await prisma.shift.findFirst({
      where: { status: "OPEN", cashierId },
    });

    if (!activeShift) {
      activeShift = await prisma.shift.findFirst({ where: { status: "OPEN" } });
      if (!activeShift) {
        activeShift = await prisma.shift.create({
          data: { cashierId, openingCash: 0, status: "OPEN" },
        });
      }
    }

    // 3. INTEGRITAS HARGA & VALIDASI STOK DARI DATABASE (Anti-Fraud & Anti-Negative Stock)
    // Jangan pernah percaya harga (item.price) dari request client!
    const productIds = items.map((i: any) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let calculatedSubtotal = 0;
    const validatedItems: Array<{
      productId: string;
      productName: string;
      productPrice: number;
      quantity: number;
      subtotal: number;
    }> = [];

    for (const item of items) {
      const dbProduct = productMap.get(item.productId);

      if (!dbProduct || !dbProduct.isActive) {
        return NextResponse.json(
          { error: `Produk '${item.name || item.productId}' tidak ditemukan atau sedang tidak aktif.` },
          { status: 400 }
        );
      }

      const requestedQty = parseInt(item.quantity);
      if (isNaN(requestedQty) || requestedQty <= 0) {
        return NextResponse.json(
          { error: `Jumlah pesanan untuk '${dbProduct.name}' harus lebih dari 0.` },
          { status: 400 }
        );
      }

      // Cegah stok minus (Overselling prevention)
      if (dbProduct.stock < requestedQty) {
        return NextResponse.json(
          { 
            error: `Stok '${dbProduct.name}' tidak mencukupi! Tersedia: ${dbProduct.stock}, diminta: ${requestedQty}.` 
          },
          { status: 400 }
        );
      }

      // Ambil harga resmi dari database
      const itemSubtotal = dbProduct.price * requestedQty;
      calculatedSubtotal += itemSubtotal;

      validatedItems.push({
        productId: dbProduct.id,
        productName: dbProduct.name,
        productPrice: dbProduct.price,
        quantity: requestedQty,
        subtotal: itemSubtotal,
      });
    }

    const grandTotal = calculatedSubtotal;
    const payment = parseFloat(paymentAmount) || 0;
    const change = payment - grandTotal;

    if (change < 0) {
      return NextResponse.json(
        { error: `Uang pembayaran kurang! Total tagihan: Rp ${grandTotal.toLocaleString("id-ID")}, diterima: Rp ${payment.toLocaleString("id-ID")}` },
        { status: 400 }
      );
    }

    const receiptNumber = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 4. Eksekusi Transaksi Atomik (ACID)
    const transaction = await prisma.$transaction(async (tx) => {
      // Potong stok dan catat log mutasi inventaris
      for (const item of validatedItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: "OUT",
            quantity: item.quantity,
            reason: `Penjualan ${receiptNumber}`,
          },
        });
      }

      // Buat data transaksi
      return await tx.transaction.create({
        data: {
          receiptNumber,
          customerName: customerName ? String(customerName).slice(0, 100) : null,
          tableNumber: tableNumber ? String(tableNumber).slice(0, 20) : null,
          cashierId,
          shiftId: activeShift.id,
          subtotal: calculatedSubtotal,
          grandTotal,
          paymentMethod: ["CASH", "QRIS", "CARD"].includes(paymentMethod) ? paymentMethod : "CASH",
          paymentAmount: payment,
          change,
          status: "COMPLETED",
          items: {
            create: validatedItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              productPrice: item.productPrice,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          items: true,
          cashier: { select: { name: true } },
        },
      });
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Transaction Error:", error);
    return NextResponse.json({ error: "Gagal memproses transaksi kasir." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        cashier: { select: { name: true, email: true } },
        items: true,
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Fetch Transactions Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data transaksi." }, { status: 500 });
  }
}
