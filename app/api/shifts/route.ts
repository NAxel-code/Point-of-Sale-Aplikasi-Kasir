import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const shifts = await prisma.shift.findMany({
      orderBy: { openedAt: "desc" },
      include: {
        cashier: { select: { name: true, email: true } },
        transactions: {
          select: { id: true, grandTotal: true, paymentMethod: true, status: true },
        },
      },
    });
    return NextResponse.json(shifts);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data shift kasir" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized || !auth.session) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const action = body.action;

    if (action === "open") {
      const cashierId = auth.session.user.id;
      const openingCash = parseFloat(body.openingCash) || 0;

      const existingOpen = await prisma.shift.findFirst({
        where: { cashierId, status: "OPEN" },
      });

      if (existingOpen) {
        return NextResponse.json(
          { error: "Kasir ini sudah memiliki shift aktif yang belum ditutup.", shift: existingOpen },
          { status: 400 }
        );
      }

      const shift = await prisma.shift.create({
        data: {
          cashierId,
          openingCash,
          status: "OPEN",
        },
      });
      return NextResponse.json(shift, { status: 201 });

    } else if (action === "close") {
      const shiftId = body.shiftId;
      if (!shiftId) {
        return NextResponse.json({ error: "ID Shift wajib disertakan." }, { status: 400 });
      }

      const existingShift = await prisma.shift.findUnique({
        where: { id: shiftId },
      });

      if (!existingShift) {
        return NextResponse.json({ error: "Shift tidak ditemukan." }, { status: 404 });
      }

      // Kasir hanya boleh menutup shift miliknya, kecuali Admin
      if (auth.session.user.role !== "ADMIN" && existingShift.cashierId !== auth.session.user.id) {
        return NextResponse.json(
          { error: "Akses ditolak: Anda hanya dapat menutup shift Anda sendiri." },
          { status: 403 }
        );
      }

      const closingCash = parseFloat(body.closingCash) || 0;

      // REKAP KAS (Expected Cash vs Actual Cash in Drawer)
      const cashAgg = await prisma.transaction.aggregate({
        where: {
          shiftId: existingShift.id,
          status: "COMPLETED",
          paymentMethod: "CASH",
        },
        _sum: { grandTotal: true },
      });

      const totalCashSales = cashAgg._sum.grandTotal || 0;
      const expectedCash = existingShift.openingCash + totalCashSales;
      const difference = closingCash - expectedCash;

      const updatedShift = await prisma.shift.update({
        where: { id: shiftId },
        data: {
          closingCash,
          expectedCash,
          difference,
          status: "CLOSED",
          closedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Shift berhasil ditutup.",
        shift: updatedShift,
        summary: {
          modalAwal: existingShift.openingCash,
          penjualanTunai: totalCashSales,
          uangKasSeharusnya: expectedCash,
          uangKasFisik: closingCash,
          selisihKas: difference,
        },
      });
    }

    return NextResponse.json({ error: "Aksi tidak valid (hanya 'open' atau 'close')." }, { status: 400 });
  } catch (error) {
    console.error("Shift Action Error:", error);
    return NextResponse.json({ error: "Gagal memproses aksi shift kasir." }, { status: 500 });
  }
}
