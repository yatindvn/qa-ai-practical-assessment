import { test, expect } from '@playwright/test';
import { RegisterPage } from '@pages/RegisterPage';
import { LoginPage } from '@pages/LoginPage';
import { AccountPage } from '@pages/AccountPage';
import { validRegistration } from '@utils/testDataGenerator';

// UI-04
test('@smoke login with valid credentials shows the correct profile', async ({ page }) => {
  const registerPage = new RegisterPage(page);
  const loginPage = new LoginPage(page);
  const accountPage = new AccountPage(page);
  const data = validRegistration();

  await registerPage.goto();
  await registerPage.register(data);
  await expect(page).toHaveURL(/auth\/login/);

  await loginPage.login(data.email, data.password);
  await expect(page).toHaveURL(/account/);

  await accountPage.openProfile();
  await expect(accountPage.profileFirstName).toHaveValue(data.firstName);
  await expect(accountPage.profileLastName).toHaveValue(data.lastName);
  await expect(accountPage.profileEmail).toHaveValue(data.email);
});

// UI-05
test('@regression login with invalid credentials is rejected', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login('no-such-user@example.com', 'WrongPass1!');

  // Login must not succeed — stays on the login page, no session established.
  await expect(page).toHaveURL(/auth\/login/);
  const token = await page.evaluate(() => localStorage.getItem('auth-token'));
  expect(token).toBeNull();
});
