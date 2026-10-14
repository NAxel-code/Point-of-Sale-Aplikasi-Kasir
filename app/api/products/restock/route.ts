import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { productId, quantity, reason = "Restok Inventaris Admin" } = body;

    const qty = parseInt(quantity);
    if (!productId || isNaN(qty) || qty <= 0) {
      return NextResponse.json(
        { error: "ID Produk dan jumlah restok (harus > 0) wajib disertakan." },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          stock: { increment: qty },
        },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          productId,
          type: "IN",
          quantity: qty,
          reason,
        },
      });

      return { product: updated, movement };
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menambah stok +${qty} untuk '${product.name}'`,
      product: result.product,
    });
  } catch (error) {
    console.error("Restock Error:", error);
    return NextResponse.json({ error: "Gagal memproses restok produk" }, { status: 500 });
  }
}
