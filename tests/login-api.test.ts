import test, { before, after } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { resetRateLimit } from '@/lib/rate-limit';

const TEST_LOGIN_EMAIL = 'api_test_cashier@pos.local';
const TEST_LOGIN_PASSWORD = 'CorrectPassword123!';
let testUserId: string;

before(async () => {
  const hash = await bcrypt.hash(TEST_LOGIN_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: TEST_LOGIN_EMAIL },
    update: {
      passwordHash: hash,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      role: 'CASHIER',
    },
    create: {
      name: 'API Test Cashier',
      email: TEST_LOGIN_EMAIL,
      passwordHash: hash,
      role: 'CASHIER',
    },
  });
  testUserId = user.id;
});

after(async () => {
  await prisma.session.deleteMany({ where: { userId: testUserId } });
  await prisma.user.deleteMany({ where: { id: testUserId } });
  resetRateLimit('login_ip_192.0.2.10');
  resetRateLimit('login_ip_192.0.2.20');
  resetRateLimit('login_ip_192.0.2.30');
});

test('Login API: Rejects empty email or password with 400', async () => {
  const req = new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-real-ip': '192.0.2.10' },
    body: JSON.stringify({ email: '', password: '' }),
  });

  const res = await loginHandler(req);
  const data = await res.json();

  assert.strictEqual(res.status, 400);
  assert.strictEqual(data.error, 'Email dan password wajib diisi.');
});

test('Login API: Rejects non-existent user with generic 401', async () => {
  const req = new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-real-ip': '192.0.2.10' },
    body: JSON.stringify({ email: 'ghost_user_nonexistent@pos.local', password: 'somePassword123' }),
  });

  const res = await loginHandler(req);
  const data = await res.json();

  assert.strictEqual(res.status, 401);
  assert.strictEqual(data.error, 'Email atau password tidak valid.');
});

test('Login API: Rejects wrong password and increments failed attempts', async () => {
  // Reset user failed attempts to 0 first
  await prisma.user.update({
    where: { id: testUserId },
    data: { failedLoginAttempts: 0, lockoutUntil: null },
  });

  const req = new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-real-ip': '192.0.2.20' },
    body: JSON.stringify({ email: TEST_LOGIN_EMAIL, password: 'WrongPasswordXYZ' }),
  });

  const res = await loginHandler(req);
  const data = await res.json();

  assert.strictEqual(res.status, 401);
  assert.ok(data.error.includes('Password salah'));

  const userInDb = await prisma.user.findUnique({ where: { id: testUserId } });
  assert.strictEqual(userInDb?.failedLoginAttempts, 1);
});

test('Login API: Returns 423 when user account is locked out', async () => {
  // Lock the user until 10 minutes in the future
  const lockoutUntil = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.user.update({
    where: { id: testUserId },
    data: { failedLoginAttempts: 5, lockoutUntil },
  });

  const req = new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-real-ip': '192.0.2.30' },
    body: JSON.stringify({ email: TEST_LOGIN_EMAIL, password: TEST_LOGIN_PASSWORD }),
  });

  const res = await loginHandler(req);
  const data = await res.json();

  assert.strictEqual(res.status, 423);
  assert.ok(data.error.includes('Akun terkunci'));
});

test('Login API: Triggers 429 when IP rate limit is exceeded', async () => {
  const spamIp = '192.0.2.99';
  resetRateLimit(`login_ip_${spamIp}`);

  // Send 5 requests to reach max limit (5)
  for (let i = 0; i < 5; i++) {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-real-ip': spamIp },
      body: JSON.stringify({ email: '', password: '' }),
    });
    await loginHandler(req);
  }

  // 6th request should be blocked by IP rate limit
  const blockedReq = new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-real-ip': spamIp },
    body: JSON.stringify({ email: TEST_LOGIN_EMAIL, password: TEST_LOGIN_PASSWORD }),
  });

  const res = await loginHandler(blockedReq);
  const data = await res.json();

  assert.strictEqual(res.status, 429);
  assert.ok(data.error.includes('Terlalu banyak percobaan login'));

  resetRateLimit(`login_ip_${spamIp}`);
});
