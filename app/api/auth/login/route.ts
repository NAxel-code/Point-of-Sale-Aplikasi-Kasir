import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { 
  createSession, 
  getClientIp, 
  MAX_LOGIN_ATTEMPTS, 
  LOCKOUT_DURATION_MINUTES 
} from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    
    // 1. Rate Limiting IP (Maks 5 percobaan per 60 detik)
    const rateLimitKey = `login_ip_${clientIp}`;
    const rateLimit = checkRateLimit(rateLimitKey, 5, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Terlalu banyak percobaan login. Coba lagi dalam ${rateLimit.resetSeconds} detik.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Query User (Prepared Statement Prisma)
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Dummy compare untuk mencegah timing attack
      await bcrypt.compare(password, "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopq");
      return NextResponse.json({ error: "Email atau password tidak valid." }, { status: 401 });
    }

    // 3. Brute Force Protection: Account Lockout Check
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / (60 * 1000));
      return NextResponse.json(
        { error: `Akun terkunci sementara karena ${MAX_LOGIN_ATTEMPTS}x percobaan gagal. Silakan coba lagi dalam ${remainingMinutes} menit.` },
        { status: 423 }
      );
    }

    // 4. Verifikasi Password Bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      const attempts = user.failedLoginAttempts + 1;
      let lockoutDate: Date | null = null;

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        lockoutDate = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockoutUntil: lockoutDate,
        }
      });

      if (lockoutDate) {
        return NextResponse.json(
          { error: `Batas percobaan tercapai. Akun dikunci sementara selama ${LOCKOUT_DURATION_MINUTES} menit.` },
          { status: 423 }
        );
      }

      const remainingAttempts = MAX_LOGIN_ATTEMPTS - attempts;
      return NextResponse.json(
        { error: `Password salah. Sisa kesempatan sebelum akun terkunci: ${remainingAttempts} kali.` },
        { status: 401 }
      );
    }

    // 5. Login Sukses: Reset Failed Attempts & Rate Limit
    if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockoutUntil: null }
      });
    }
    resetRateLimit(rateLimitKey);

    // 6. Regenerate Session ID & Simpan ke HttpOnly Cookie
    await createSession(user.id, request);

    return NextResponse.json({
      success: true,
      message: "Login berhasil.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Gagal memproses login." }, { status: 500 });
  }
}
