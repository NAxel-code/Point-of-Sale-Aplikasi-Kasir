import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
    console.error(error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
