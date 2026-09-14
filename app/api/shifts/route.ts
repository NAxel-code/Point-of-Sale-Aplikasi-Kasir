import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const shifts = await prisma.shift.findMany({
      orderBy: { openedAt: 'desc' },
      include: { cashier: { select: { name: true } } }
    });
    return NextResponse.json(shifts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch shifts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // action: "open" or "close"
    if (body.action === "open") {
      const shift = await prisma.shift.create({
        data: {
          cashierId: body.cashierId,
          openingCash: parseFloat(body.openingCash),
          status: "OPEN"
        }
      });
      return NextResponse.json(shift, { status: 201 });
    } else if (body.action === "close") {
      const shift = await prisma.shift.update({
        where: { id: body.shiftId },
        data: {
          closingCash: parseFloat(body.closingCash),
          status: "CLOSED",
          closedAt: new Date()
        }
      });
      return NextResponse.json(shift);
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process shift action" }, { status: 500 });
  }
}
