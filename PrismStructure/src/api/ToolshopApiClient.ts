import { APIRequestContext } from '@playwright/test';

const API_BASE = 'https://api.practicesoftwaretesting.com';

/**
 * Thin wrapper over the Toolshop API, built from endpoints verified directly
 * against the live API (not assumed from the Swagger UI listing alone):
 * POST /users/register, POST /users/login, GET /products, POST /carts,
 * POST /carts/{cartId} (add item, body: {product_id, quantity}),
 * GET /carts/{cartId}, POST /invoices, GET /invoices.
 */
export class ToolshopApiClient {
  constructor(private request: APIRequestContext) {}

  async register(payload: Record<string, unknown>) {
    return this.request.post(`${API_BASE}/users/register`, { data: payload });
  }

  async login(email: string, password: string) {
    return this.request.post(`${API_BASE}/users/login`, { data: { email, password } });
  }

  async getProducts() {
    return this.request.get(`${API_BASE}/products`);
  }

  async createCart(token: string) {
    return this.request.post(`${API_BASE}/carts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async addItemToCart(token: string, cartId: string, productId: string, quantity: number) {
    return this.request.post(`${API_BASE}/carts/${cartId}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { product_id: productId, quantity },
    });
  }

  async getCart(token: string, cartId: string) {
    return this.request.get(`${API_BASE}/carts/${cartId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async createInvoice(token: string, payload: Record<string, unknown>) {
    return this.request.post(`${API_BASE}/invoices`, {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
  }

  async getInvoices(token: string) {
    return this.request.get(`${API_BASE}/invoices`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
