import { Page, Locator } from '@playwright/test';

export class ProductsPage {
  readonly page: Page;
  readonly firstProductCard: Locator;
  readonly productName: Locator;
  readonly quantityInput: Locator;
  readonly increaseQuantity: Locator;
  readonly addToCart: Locator;
  readonly navCart: Locator;
  readonly cartQuantityBadge: Locator;
  readonly searchQuery: Locator;
  readonly searchSubmit: Locator;
  readonly outOfStockBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstProductCard = page.locator('[data-test^="product-0"]').first();
    this.productName = page.getByTestId('product-name');
    this.quantityInput = page.getByTestId('quantity');
    this.increaseQuantity = page.getByTestId('increase-quantity');
    this.addToCart = page.getByTestId('add-to-cart');
    this.navCart = page.getByTestId('nav-cart');
    this.cartQuantityBadge = page.getByTestId('cart-quantity');
    this.searchQuery = page.getByTestId('search-query');
    this.searchSubmit = page.getByTestId('search-submit');
    this.outOfStockBadge = page.getByTestId('out-of-stock');
  }

  async search(term: string) {
    await this.searchQuery.fill(term);
    await this.searchSubmit.click();
  }

  productCardByName(name: string): Locator {
    return this.page.locator('[data-test^="product-"]').filter({ hasText: name });
  }

  async goto() {
    await this.page.goto('/');
  }

  async openFirstProduct() {
    await this.firstProductCard.waitFor({ state: 'visible', timeout: 15_000 });
    await this.firstProductCard.click();

    // The product detail page can render its shell (nav/footer/"Related
    // products") before — or without — the main product content actually
    // loading; waiting on add-to-cart alone (later) just times out generically
    // with no clue why. Wait on the product name explicitly, with one reload
    // retry for a transient failed fetch, so a genuinely broken product page
    // fails fast with a clear cause instead of a vague 30s add-to-cart
    // timeout. Reproduced live: see ai-prompts/automation-and-debugging.md,
    // Entry 7.
    try {
      await this.productName.waitFor({ state: 'visible', timeout: 10_000 });
    } catch {
      await this.page.reload();
      await this.productName.waitFor({ state: 'visible', timeout: 10_000 });
    }
  }

  async addFirstProductToCart() {
    await this.openFirstProduct();
    await this.addToCart.click();
  }

  async goToCart() {
    await this.navCart.click();
  }
}
