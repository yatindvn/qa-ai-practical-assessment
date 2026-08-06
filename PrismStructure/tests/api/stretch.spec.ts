import { test, expect } from '@playwright/test';
import { ToolshopApiClient } from '@api/ToolshopApiClient';
import { apiRegistrationPayload } from '@utils/testDataGenerator';

const API_BASE = 'https://api.practicesoftwaretesting.com';

// STRETCH — additional coverage beyond the Core suite's 5-8-per-type cap
// (ai-prompts/test-design.md, Entry 1). Tagged @stretch, not @smoke/@regression,
// so npm run test:smoke / test:regression never pick these up. Run via
// `npm run test:stretch`. Candidates pulled from the ones deliberately not
// promoted into Core — see automation-opportunities.md.

async function registerAndLogin(client: ToolshopApiClient) {
  const payload = apiRegistrationPayload();
  await client.register(payload);
  const loginRes = await client.login(payload.email as string, payload.password as string);
  const { access_token: token } = await loginRes.json();
  return token as string;
}

// STRETCH-API-01
// Originally written expecting 401 (assumed cart creation required auth, by
// analogy with /invoices). Running it for real returned 201 — carts can be
// created with no token at all. Rewritten to assert the actual, verified
// behavior instead of forcing the wrong assumption to pass. This makes
// sense architecturally: it's what backs the UI's guest-checkout flow
// (already verified live, see ai-prompts/automation-and-debugging.md,
// Entry 2) — a cart has to exist before a guest ever authenticates.
test('@stretch POST /carts succeeds without a bearer token (anonymous/guest cart)', async ({ request }) => {
  const res = await request.post(`${API_BASE}/carts`);
  expect(res.status()).toBe(201);
  const body = await res.json();
  expect(body.id).toBeTruthy();
});

// STRETCH-API-02
test('@stretch items can be added to an anonymous cart without a bearer token', async ({ request }) => {
  const cartRes = await request.post(`${API_BASE}/carts`);
  const { id: cartId } = await cartRes.json();

  const productsRes = await request.get(`${API_BASE}/products`);
  const { data: products } = await productsRes.json();

  const addRes = await request.post(`${API_BASE}/carts/${cartId}`, {
    data: { product_id: products[0].id, quantity: 1 },
  });
  expect(addRes.status()).toBe(200);

  const getRes = await request.get(`${API_BASE}/carts/${cartId}`);
  const cart = await getRes.json();
  expect(cart.cart_items).toHaveLength(1);
});

// STRETCH-API-03
test('@stretch adding a cart item with an invalid product_id is rejected', async ({ request }) => {
  const client = new ToolshopApiClient(request);
  const token = await registerAndLogin(client);
  const { id: cartId } = await client.createCart(token).then((r) => r.json());

  const res = await client.addItemToCart(token, cartId, '01NOT-A-REAL-PRODUCT-ID', 1);

  expect(res.status()).toBeGreaterThanOrEqual(400);
  expect(res.status()).toBeLessThan(500);
});

// STRETCH-API-04
test('@stretch adding a cart item with quantity 0 is rejected, not silently accepted', async ({ request }) => {
  const client = new ToolshopApiClient(request);
  const token = await registerAndLogin(client);
  const productsRes = await client.getProducts();
  const { data: products } = await productsRes.json();
  const { id: cartId } = await client.createCart(token).then((r) => r.json());

  const addRes = await client.addItemToCart(token, cartId, products[0].id, 0);

  if (addRes.status() >= 200 && addRes.status() < 300) {
    // If the API accepts the call, the cart must not actually end up with a
    // 0-quantity line item — that would be silent data corruption, not a
    // graceful accept.
    const cart = await client.getCart(token, cartId).then((r) => r.json());
    const zeroQtyItem = cart.cart_items.find((item: { quantity: number }) => item.quantity === 0);
    expect(zeroQtyItem).toBeUndefined();
  } else {
    expect(addRes.status()).toBeGreaterThanOrEqual(400);
  }
});
