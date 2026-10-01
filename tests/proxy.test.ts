import test from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { proxy, config } from '@/proxy';

test('Proxy Middleware: Redirects unauthenticated requests from /pos to /login', () => {
  const req = new NextRequest('http://localhost/pos');
  const res = proxy(req);

  assert.strictEqual(res.status, 307);
  assert.strictEqual(res.headers.get('location'), 'http://localhost/login');
});

test('Proxy Middleware: Redirects unauthenticated requests from nested /pos/orders to /login', () => {
  const req = new NextRequest('http://localhost/pos/orders');
  const res = proxy(req);

  assert.strictEqual(res.status, 307);
  assert.strictEqual(res.headers.get('location'), 'http://localhost/login');
});

test('Proxy Middleware: Allows authenticated requests with pos_session to access /pos', () => {
  const req = new NextRequest('http://localhost/pos', {
    headers: {
      cookie: 'pos_session=valid_test_session_token_1234567890abcdef',
    },
  });
  const res = proxy(req);

  // When next() is returned, there is no redirect location and status is 200
  assert.strictEqual(res.headers.get('location'), null);
  assert.strictEqual(res.status, 200);
});

test('Proxy Middleware: Redirects already authenticated user from /login to /pos', () => {
  const req = new NextRequest('http://localhost/login', {
    headers: {
      cookie: 'pos_session=valid_test_session_token_1234567890abcdef',
    },
  });
  const res = proxy(req);

  assert.strictEqual(res.status, 307);
  assert.strictEqual(res.headers.get('location'), 'http://localhost/pos');
});

test('Proxy Middleware: Allows unauthenticated user to access /login', () => {
  const req = new NextRequest('http://localhost/login');
  const res = proxy(req);

  assert.strictEqual(res.headers.get('location'), null);
  assert.strictEqual(res.status, 200);
});

test('Proxy Middleware: Passes through non-protected routes like public home', () => {
  const req = new NextRequest('http://localhost/');
  const res = proxy(req);

  assert.strictEqual(res.headers.get('location'), null);
  assert.strictEqual(res.status, 200);
});

test('Proxy Middleware: Route matcher configuration includes /pos and /login', () => {
  assert.ok(Array.isArray(config.matcher));
  assert.ok(config.matcher.includes('/pos/:path*'));
  assert.ok(config.matcher.includes('/login'));
});
