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
// Deliberately ONE test case iterating internally over every password-policy
// rule, not a Playwright-level parameterized loop — the brief caps the suite
// at 5-8 test cases per type, and one test() per invalidPasswords entry would
// have silently pushed the UI suite from 7 to 11 reported test cases (found
// during review — see ai-prompts/automation-and-debugging.md).
test('@regression register is blocked for each password-policy violation', async ({ page }) => {
  const registerPage = new RegisterPage(page);

  for (const [rule, password] of Object.entries(invalidPasswords)) {
    const data = validRegistration();
    data.password = password;

    await registerPage.goto();
    await registerPage.register(data);

    // Registration must not succeed — stays on the register page, not redirected.
    await expect(page, `password policy rule violated: ${rule}`).toHaveURL(/auth\/register/);
  }
});

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
