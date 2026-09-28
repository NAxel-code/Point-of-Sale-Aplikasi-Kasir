import { cookies } from "next/headers";
import crypto from "crypto";
import prisma from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "pos_session";
export const SESSION_DURATION_HOURS = 12; // Durasi shift kasir
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MINUTES = 15;

export interface AuthSession {
  user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "CASHIER" | string;
  };
}

/**
 * Token kriptografis unik untuk Regenerate Session ID
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function getClientIp(request?: Request): string {
  if (!request) return "127.0.0.1";
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "127.0.0.1";
}

/**
 * Buat sesi baru di database dan pasang HttpOnly Secure Cookie
 */
export async function createSession(userId: string, request?: Request): Promise<string> {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);
  const ipAddress = getClientIp(request);
  const userAgent = request ? request.headers.get("user-agent") : null;

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_DURATION_HOURS * 60 * 60,
  });

  return sessionToken;
}

/**
 * Hapus sesi dari database dan bersihkan cookie (Logout)
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    await prisma.session.deleteMany({
      where: { sessionToken },
    }).catch(() => {});
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
}

/**
 * Ambil sesi yang sedang aktif dari database via cookie
 */
export async function getCurrentSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) return null;

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session) return null;

    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
    };
  } catch (error) {
    console.error("Error getCurrentSession:", error);
    return null;
  }
}

/**
 * Validasi otentikasi kasir/admin di backend
 */
export async function requireAuth(): Promise<{
  authorized: boolean;
  status: number;
  error?: string;
  session?: AuthSession;
}> {
  const session = await getCurrentSession();

  if (!session) {
    return {
      authorized: false,
      status: 401,
      error: "Sesi kasir tidak aktif atau telah kedaluwarsa. Silakan login kembali.",
    };
  }

  return {
    authorized: true,
    status: 200,
    session,
  };
}

/**
 * Validasi otorisasi khusus ADMIN di backend (misal: lihat omzet, void transaksi)
 */
export async function requireAdmin(): Promise<{
  authorized: boolean;
  status: number;
  error?: string;
  session?: AuthSession;
}> {
  const auth = await requireAuth();
  if (!auth.authorized || !auth.session) {
    return auth;
  }

  if (auth.session.user.role !== "ADMIN") {
    return {
      authorized: false,
      status: 403,
      error: "Akses ditolak: Operasi ini hanya boleh dilakukan oleh Administrator / Pemilik Toko.",
      session: auth.session,
    };
  }

  return auth;
}
