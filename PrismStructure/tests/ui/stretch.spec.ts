import { test, expect } from '@playwright/test';
import { RegisterPage } from '@pages/RegisterPage';
import { LoginPage } from '@pages/LoginPage';
import { AccountPage } from '@pages/AccountPage';
import { ProductsPage } from '@pages/ProductsPage';
import { validRegistration } from '@utils/testDataGenerator';

// STRETCH — additional coverage beyond the Core suite's 5-8-per-type cap
// (ai-prompts/test-design.md, Entry 1). Tagged @stretch, not @smoke/@regression,
// so npm run test:smoke / test:regression never pick these up and the Core
// suite's compliance with the brief's cap stays intact. Run via
// `npm run test:stretch`. Candidates pulled from the ones deliberately not
// promoted into Core — see automation-opportunities.md.

// STRETCH-UI-01
test('@stretch searching for a known product returns matching results', async ({ page }) => {
  const productsPage = new ProductsPage(page);

  await productsPage.goto();
  await productsPage.search('Pliers');

  await expect(page.getByTestId('product-name').first()).toContainText(/pliers/i);
});

// STRETCH-UI-02
test('@stretch registration rejects a malformed postcode instead of silently matching a fake address', async ({
  page,
}) => {
  const registerPage = new RegisterPage(page);

  await registerPage.goto();
  await registerPage.country.selectOption('DE');
  await registerPage.postalCode.fill('!!!!!');
  await registerPage.houseNumber.fill('5');

  // A malformed postcode must not resolve to an address the way a real one
  // does (verified live for valid postcodes — ai-prompts/requirements-and-planning.md
  // Entry 4 / automation-and-debugging.md Entry 1). Street should stay empty.
  await expect(registerPage.street).toHaveValue('', { timeout: 3_000 });
});

// STRETCH-UI-03
test('@stretch cart contents persist across sign-out and sign-in', async ({ page }) => {
  const registerPage = new RegisterPage(page);
  const loginPage = new LoginPage(page);
  const accountPage = new AccountPage(page);
  const productsPage = new ProductsPage(page);
  const data = validRegistration();

  await registerPage.goto();
  await registerPage.registerExpectingSuccess(data);
  await loginPage.login(data.email, data.password);
  await expect(page).toHaveURL(/account/, { timeout: 15_000 });

  await productsPage.goto();
  await productsPage.addFirstProductToCart();
  await expect(productsPage.cartQuantityBadge).toHaveText('1');

  await accountPage.navSignOut.click();
  await loginPage.goto();
  await loginPage.login(data.email, data.password);
  await expect(page).toHaveURL(/account/, { timeout: 15_000 });

  await productsPage.goto();
  await expect(productsPage.cartQuantityBadge).toHaveText('1');
});

// STRETCH-UI-04
test('@stretch an out-of-stock product cannot be added to the cart', async ({ page }) => {
  const productsPage = new ProductsPage(page);

  await productsPage.goto();
  const outOfStockCard = page.locator('[data-test^="product-"]').filter({ has: page.getByTestId('out-of-stock') }).first();

  const count = await outOfStockCard.count();
  test.skip(count === 0, 'No out-of-stock product in the current catalog to exercise this case against.');

  await outOfStockCard.click();
  await expect(productsPage.productName).toBeVisible();
  await expect(productsPage.addToCart).toBeDisabled();
});
