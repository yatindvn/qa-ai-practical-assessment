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

  constructor(page: Page) {
    this.page = page;
    this.firstProductCard = page.locator('[data-test^="product-0"]').first();
    this.productName = page.getByTestId('product-name');
    this.quantityInput = page.getByTestId('quantity');
    this.increaseQuantity = page.getByTestId('increase-quantity');
    this.addToCart = page.getByTestId('add-to-cart');
    this.navCart = page.getByTestId('nav-cart');
    this.cartQuantityBadge = page.getByTestId('cart-quantity');
  }

  async goto() {
    await this.page.goto('/');
  }

  async openFirstProduct() {
    await this.firstProductCard.click();
  }

  async addFirstProductToCart() {
    await this.openFirstProduct();
    await this.addToCart.click();
  }

  async goToCart() {
    await this.navCart.click();
  }
}
