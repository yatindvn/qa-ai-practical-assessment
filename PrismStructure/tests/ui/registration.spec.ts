import { test, expect } from '@playwright/test';
import { RegisterPage } from '@pages/RegisterPage';
import { validRegistration, invalidPasswords } from '@utils/testDataGenerator';

// UI-01
test('@smoke register with valid details succeeds', async ({ page }) => {
  const registerPage = new RegisterPage(page);
  const data = validRegistration();

  await registerPage.goto();
  await registerPage.register(data);

  // Successful registration redirects to /auth/login (verified live).
  await expect(page).toHaveURL(/auth\/login/);
});

// UI-02
for (const [rule, password] of Object.entries(invalidPasswords)) {
  test(`@regression register is blocked when password violates rule: ${rule}`, async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const data = validRegistration();
    data.password = password;

    await registerPage.goto();
    await registerPage.register(data);

    // Registration must not succeed — stays on the register page, not redirected.
    await expect(page).toHaveURL(/auth\/register/);
  });
}

// UI-03
test('@regression register is blocked for an already-registered email', async ({ page }) => {
  const registerPage = new RegisterPage(page);
  const data = validRegistration();

  await registerPage.goto();
  await registerPage.register(data);
  await expect(page).toHaveURL(/auth\/login/);

  // Re-register with the same email.
  await registerPage.goto();
  await registerPage.register(data);

  await expect(page).toHaveURL(/auth\/register/);
  await expect(registerPage.fieldError('already')).toBeVisible();
});
