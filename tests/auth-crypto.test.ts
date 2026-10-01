import test from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import { generateSessionToken, getClientIp, SESSION_DURATION_HOURS, MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION_MINUTES } from '@/lib/auth';

test('Password Hashing: hashes password and verifies correctly', async () => {
  const plain = 'superSecret123';
  const hash = await bcrypt.hash(plain, 10);

  // Hash format verification
  assert.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'));
  assert.notStrictEqual(hash, plain);

  // Verification matching
  const isValid = await bcrypt.compare(plain, hash);
  assert.strictEqual(isValid, true);

  // Wrong password rejected
  const isInvalid = await bcrypt.compare('wrongPassword', hash);
  assert.strictEqual(isInvalid, false);
});

test('Session Token Generator: generates 64-character unique cryptographic hex tokens', () => {
  const token1 = generateSessionToken();
  const token2 = generateSessionToken();

  assert.strictEqual(typeof token1, 'string');
  assert.strictEqual(token1.length, 64);
  assert.match(token1, /^[0-9a-f]{64}$/);

  assert.strictEqual(typeof token2, 'string');
  assert.strictEqual(token2.length, 64);

  // Tokens must be unique
  assert.notStrictEqual(token1, token2);
});

test('Client IP Extraction: correctly parses headers and falls back', () => {
  // 1. x-forwarded-for with multiple IPs
  const req1 = new Request('http://localhost', {
    headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178' },
  });
  assert.strictEqual(getClientIp(req1), '203.0.113.195');

  // 2. x-real-ip
  const req2 = new Request('http://localhost', {
    headers: { 'x-real-ip': '198.51.100.42' },
  });
  assert.strictEqual(getClientIp(req2), '198.51.100.42');

  // 3. Fallback when headers missing
  const req3 = new Request('http://localhost');
  assert.strictEqual(getClientIp(req3), '127.0.0.1');

  // 4. Fallback when undefined request
  assert.strictEqual(getClientIp(undefined), '127.0.0.1');
});

test('Auth Constants: security policy values are configured properly', () => {
  assert.strictEqual(SESSION_DURATION_HOURS, 12);
  assert.strictEqual(MAX_LOGIN_ATTEMPTS, 5);
  assert.strictEqual(LOCKOUT_DURATION_MINUTES, 15);
});
