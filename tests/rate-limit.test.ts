import test from 'node:test';
import assert from 'node:assert';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

test('Rate Limiter: allows requests under limit', () => {
  const key = 'test_ip_1';
  resetRateLimit(key);

  const res1 = checkRateLimit(key, 3, 60000);
  assert.strictEqual(res1.allowed, true);
  assert.strictEqual(res1.remaining, 2);

  const res2 = checkRateLimit(key, 3, 60000);
  assert.strictEqual(res2.allowed, true);
  assert.strictEqual(res2.remaining, 1);

  const res3 = checkRateLimit(key, 3, 60000);
  assert.strictEqual(res3.allowed, true);
  assert.strictEqual(res3.remaining, 0);
});

test('Rate Limiter: blocks requests exceeding limit', () => {
  const key = 'test_ip_blocked';
  resetRateLimit(key);

  checkRateLimit(key, 2, 60000);
  checkRateLimit(key, 2, 60000);

  const resBlocked = checkRateLimit(key, 2, 60000);
  assert.strictEqual(resBlocked.allowed, false);
  assert.strictEqual(resBlocked.remaining, 0);
  assert.ok(resBlocked.resetSeconds > 0);
});

test('Rate Limiter: resetRateLimit clears counter', () => {
  const key = 'test_ip_reset';
  checkRateLimit(key, 1, 60000);
  assert.strictEqual(checkRateLimit(key, 1, 60000).allowed, false);

  resetRateLimit(key);
  assert.strictEqual(checkRateLimit(key, 1, 60000).allowed, true);
});
