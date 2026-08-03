import { test, expect } from '@playwright/test';
import { ToolshopApiClient } from '@api/ToolshopApiClient';
import { apiRegistrationPayload } from '@utils/testDataGenerator';

// API-01
test('@smoke POST /users/register creates a new user', async ({ request }) => {
  const client = new ToolshopApiClient(request);
  const payload = apiRegistrationPayload();

  const res = await client.register(payload);

  expect(res.status()).toBe(201);
  const body = await res.json();
  expect(body.email).toBe(payload.email);
  expect(body.id).toBeTruthy();
});

// API-02
test('@regression POST /users/register rejects a duplicate email', async ({ request }) => {
  const client = new ToolshopApiClient(request);
  const payload = apiRegistrationPayload();

  const first = await client.register(payload);
  expect(first.status()).toBe(201);

  const second = await client.register(payload);
  expect(second.status()).toBeGreaterThanOrEqual(400);
  expect(second.status()).toBeLessThan(500);
});

// API-03
test('@smoke POST /users/login returns a bearer token for valid credentials', async ({ request }) => {
  const client = new ToolshopApiClient(request);
  const payload = apiRegistrationPayload();
  await client.register(payload);

  const res = await client.login(payload.email as string, payload.password as string);

  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(typeof body.access_token).toBe('string');
  expect(body.access_token.length).toBeGreaterThan(20);
});

// API-04
test('@regression POST /users/login rejects invalid credentials', async ({ request }) => {
  const client = new ToolshopApiClient(request);

  const res = await client.login('no-such-user@example.com', 'WrongPass1!');

  expect(res.status()).toBe(401);
});
