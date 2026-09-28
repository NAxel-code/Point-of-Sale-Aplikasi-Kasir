import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({
      success: true,
      message: "Sesi berhasil ditutup (logout sukses)."
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses logout." },
      { status: 500 }
    );
  }
}
