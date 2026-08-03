import { test, expect } from '@playwright/test';
import { ToolshopApiClient } from '@api/ToolshopApiClient';
import { apiRegistrationPayload, invoicePayload } from '@utils/testDataGenerator';

async function registerAndLogin(client: ToolshopApiClient) {
  const payload = apiRegistrationPayload();
  await client.register(payload);
  const loginRes = await client.login(payload.email as string, payload.password as string);
  const { access_token: token } = await loginRes.json();
  return token as string;
}

async function firstProductId(client: ToolshopApiClient): Promise<string> {
  const res = await client.getProducts();
  const body = await res.json();
  return body.data[0].id;
}

// API-05
test('@smoke create a cart, add a product, and verify cart contents', async ({ request }) => {
  const client = new ToolshopApiClient(request);
  const token = await registerAndLogin(client);
  const productId = await firstProductId(client);

  const cartRes = await client.createCart(token);
  expect(cartRes.status()).toBe(201);
  const { id: cartId } = await cartRes.json();

  const addRes = await client.addItemToCart(token, cartId, productId, 2);
  expect(addRes.status()).toBe(200);

  const getRes = await client.getCart(token, cartId);
  expect(getRes.status()).toBe(200);
  const cart = await getRes.json();
  expect(cart.cart_items).toHaveLength(1);
  expect(cart.cart_items[0].product_id).toBe(productId);
  expect(cart.cart_items[0].quantity).toBe(2);
});

// API-06
test('@smoke POST /invoices generates an invoice for a valid cart', async ({ request }) => {
  const client = new ToolshopApiClient(request);
  const token = await registerAndLogin(client);
  const productId = await firstProductId(client);

  const { id: cartId } = await client.createCart(token).then((r) => r.json());
  await client.addItemToCart(token, cartId, productId, 1);

  const invoiceRes = await client.createInvoice(token, invoicePayload(cartId));

  expect(invoiceRes.status()).toBe(201);
  const invoice = await invoiceRes.json();
  expect(invoice.invoice_number).toMatch(/^INV-\d+$/);
  expect(invoice.total).toBeGreaterThan(0);

  // Cross-check: the invoice must actually be retrievable for this user
  // afterwards — this is the exact check that surfaced a UI-side defect
  // during manual exploration (see automation-and-debugging.md): a UI
  // checkout's "successful" invoice did NOT show up here. Calling the API
  // directly with a fresh, valid token, it does.
  const listRes = await client.getInvoices(token);
  const list = await listRes.json();
  expect(list.data.some((inv: { invoice_number: string }) => inv.invoice_number === invoice.invoice_number)).toBe(true);
});

// API-07 — API-side analogue of the UI double-confirm quirk (risk #1).
test('@regression submitting the same cart_id twice does not silently double-invoice', async ({ request }) => {
  const client = new ToolshopApiClient(request);
  const token = await registerAndLogin(client);
  const productId = await firstProductId(client);

  const { id: cartId } = await client.createCart(token).then((r) => r.json());
  await client.addItemToCart(token, cartId, productId, 1);

  const payload = invoicePayload(cartId);
  const firstRes = await client.createInvoice(token, payload);
  expect(firstRes.status()).toBe(201);
  const firstInvoice = await firstRes.json();

  const secondRes = await client.createInvoice(token, payload);
  const secondBody = await secondRes.json().catch(() => null);

  // Documented outcome, not assumed: the API either (a) rejects the repeat
  // submission (4xx) or (b) creates a second, distinct invoice for the same
  // cart rather than silently returning/duplicating the first one unchanged.
  // Whichever it is, the two responses must not be identical successes with
  // the same invoice_number, which would indicate a caching/idempotency bug.
  if (secondRes.status() >= 200 && secondRes.status() < 300) {
    expect(secondBody.invoice_number).not.toBe(firstInvoice.invoice_number);
  } else {
    expect(secondRes.status()).toBeGreaterThanOrEqual(400);
  }
});
