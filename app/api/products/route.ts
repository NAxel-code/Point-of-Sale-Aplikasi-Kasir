import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  try {
    const products = await prisma.product.findMany({
      where: search ? {
        name: { contains: search }
      } : undefined,
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data produk" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Hanya Administrator yang berhak menambah / mengubah menu produk
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    if (!body.name || body.price === undefined || body.stock === undefined) {
      return NextResponse.json({ error: "Nama, harga, dan stok wajib diisi." }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name: body.name,
        sku: body.sku || null,
        price: parseFloat(body.price),
        stock: parseInt(body.stock),
        categoryId: body.categoryId || null,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Create Product Error:", error);
    return NextResponse.json({ error: "Gagal menambahkan produk baru" }, { status: 500 });
  }
}
