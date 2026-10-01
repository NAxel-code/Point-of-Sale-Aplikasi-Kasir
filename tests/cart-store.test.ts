import test, { beforeEach } from 'node:test';
import assert from 'node:assert';
import { useCartStore } from '@/store/useCartStore';

beforeEach(() => {
  useCartStore.getState().clearCart();
});

test('Cart Store: adds item with initial quantity 1', () => {
  const store = useCartStore.getState();
  const product = { id: 'p1', name: 'Latte', price: 20000, stock: 10 };

  store.addItem(product);

  const state = useCartStore.getState();
  assert.strictEqual(state.items.length, 1);
  assert.strictEqual(state.items[0].productId, 'p1');
  assert.strictEqual(state.items[0].quantity, 1);
  assert.strictEqual(state.items[0].price, 20000);
});

test('Cart Store: increments quantity when adding existing item up to stock', () => {
  const store = useCartStore.getState();
  const product = { id: 'p2', name: 'Cappuccino', price: 22000, stock: 2 };

  store.addItem(product);
  store.addItem(product);

  let state = useCartStore.getState();
  assert.strictEqual(state.items.length, 1);
  assert.strictEqual(state.items[0].quantity, 2);

  // Attempting to exceed available stock (stock is 2)
  store.addItem(product);
  state = useCartStore.getState();
  assert.strictEqual(state.items[0].quantity, 2, 'Quantity should not exceed product stock');
});

test('Cart Store: updateQuantity clamps values between 1 and stock', () => {
  const store = useCartStore.getState();
  const product = { id: 'p3', name: 'Espresso', price: 15000, stock: 5 };

  store.addItem(product);

  // Normal update
  store.updateQuantity('p3', 4);
  assert.strictEqual(useCartStore.getState().items[0].quantity, 4);

  // Clamps to max stock if higher
  store.updateQuantity('p3', 10);
  assert.strictEqual(useCartStore.getState().items[0].quantity, 5);

  // Clamps to min 1 if zero or negative
  store.updateQuantity('p3', 0);
  assert.strictEqual(useCartStore.getState().items[0].quantity, 1);
});

test('Cart Store: removes item by productId', () => {
  const store = useCartStore.getState();
  store.addItem({ id: 'p1', name: 'Latte', price: 20000, stock: 5 });
  store.addItem({ id: 'p2', name: 'Mocha', price: 25000, stock: 5 });

  assert.strictEqual(useCartStore.getState().items.length, 2);

  store.removeItem('p1');
  const state = useCartStore.getState();
  assert.strictEqual(state.items.length, 1);
  assert.strictEqual(state.items[0].productId, 'p2');
});

test('Cart Store: calculates subtotal accurately', () => {
  const store = useCartStore.getState();
  store.addItem({ id: 'p1', name: 'Americano', price: 18000, stock: 10 });
  store.addItem({ id: 'p1', name: 'Americano', price: 18000, stock: 10 }); // qty 2 = 36000
  store.addItem({ id: 'p2', name: 'Pastry', price: 25000, stock: 10 }); // qty 1 = 25000

  const subtotal = useCartStore.getState().subtotal();
  assert.strictEqual(subtotal, 36000 + 25000); // 61000
});

test('Cart Store: clearCart empties all items', () => {
  const store = useCartStore.getState();
  store.addItem({ id: 'p1', name: 'Coffee', price: 20000, stock: 5 });
  assert.strictEqual(useCartStore.getState().items.length, 1);

  store.clearCart();
  assert.strictEqual(useCartStore.getState().items.length, 0);
  assert.strictEqual(useCartStore.getState().subtotal(), 0);
});
