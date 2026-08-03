import { test, expect } from '@playwright/test';
import { RegisterPage } from '@pages/RegisterPage';
import { LoginPage } from '@pages/LoginPage';
import { ProductsPage } from '@pages/ProductsPage';
import { CheckoutPage } from '@pages/CheckoutPage';
import { validRegistration } from '@utils/testDataGenerator';

// UI-06 — covers the double-confirm quirk end to end.
test('@smoke E2E purchase requires Confirm twice before the invoice is generated', async ({ page }) => {
  const registerPage = new RegisterPage(page);
  const loginPage = new LoginPage(page);
  const productsPage = new ProductsPage(page);
  const checkoutPage = new CheckoutPage(page);
  const data = validRegistration();

  await registerPage.goto();
  await registerPage.register(data);
  await loginPage.login(data.email, data.password);
  await expect(page).toHaveURL(/account/);

  await productsPage.goto();
  await productsPage.addFirstProductToCart();
  await productsPage.goToCart();

  await checkoutPage.proceedToBillingAsSignedInUser(data);
  await checkoutPage.payCashOnDelivery();

  // First click: "Payment was successful" is shown but the order is NOT placed yet.
  await checkoutPage.clickConfirmOnce();

  // Second click: this is what actually generates the invoice.
  const invoiceNumber = await checkoutPage.clickConfirmAgainToGenerateInvoice();
  expect(invoiceNumber).toMatch(/^INV-\d+$/);
});

// UI-07
test('@regression cart quantity cannot go below the minimum of 1', async ({ page }) => {
  const productsPage = new ProductsPage(page);
  const checkoutPage = new CheckoutPage(page);

  await productsPage.goto();
  await productsPage.addFirstProductToCart();
  await productsPage.goToCart();

  // The quantity input enforces min="1" (verified live on the cart step).
  await expect(checkoutPage.cartLineQuantity).toHaveAttribute('min', '1');

  await checkoutPage.cartLineQuantity.fill('0');
  await checkoutPage.cartLineQuantity.blur();

  // Either the app clamps back to 1, or blocks proceeding — assert it did not
  // silently accept 0 as the cart quantity.
  await expect(checkoutPage.cartLineQuantity).not.toHaveValue('0');
});
