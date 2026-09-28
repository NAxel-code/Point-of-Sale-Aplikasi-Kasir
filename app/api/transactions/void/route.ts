import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized || !auth.session) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { transactionId, reason } = body;

    if (!transactionId) {
      return NextResponse.json({ error: "ID Transaksi wajib diisi." }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { items: true },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan." }, { status: 404 });
    }

    if (transaction.status === "VOIDED") {
      return NextResponse.json({ error: "Transaksi ini sudah dibatalkan sebelumnya." }, { status: 400 });
    }

    const voidReason = reason ? String(reason).trim() : "Dibatalkan oleh kasir";

    // Kembalikan stok produk & ubah status transaksi menjadi VOIDED
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Pulihkan stok untuk setiap item
      for (const item of transaction.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: "IN",
            quantity: item.quantity,
            reason: `Void ${transaction.receiptNumber}: ${voidReason}`,
          },
        });
      }

      // 2. Tandai transaksi sebagai VOIDED
      return await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: "VOIDED",
          voidReason,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Transaksi ${transaction.receiptNumber} berhasil dibatalkan dan stok dikembalikan.`,
      transaction: updated,
    });
  } catch (error) {
    console.error("Void Transaction Error:", error);
    return NextResponse.json({ error: "Gagal membatalkan transaksi." }, { status: 500 });
  }
}
