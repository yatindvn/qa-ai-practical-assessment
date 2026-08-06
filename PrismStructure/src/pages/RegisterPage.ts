import { Page, Locator, expect } from '@playwright/test';
import { RegistrationData } from '@utils/testDataGenerator';

export class RegisterPage {
  readonly page: Page;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly dob: Locator;
  readonly country: Locator;
  readonly postalCode: Locator;
  readonly houseNumber: Locator;
  readonly street: Locator;
  readonly city: Locator;
  readonly state: Locator;
  readonly phone: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstName = page.getByTestId('first-name');
    this.lastName = page.getByTestId('last-name');
    this.dob = page.getByTestId('dob');
    this.country = page.getByTestId('country');
    this.postalCode = page.getByTestId('postal_code');
    this.houseNumber = page.getByTestId('house_number');
    this.street = page.getByTestId('street');
    this.city = page.getByTestId('city');
    this.state = page.getByTestId('state');
    this.phone = page.getByTestId('phone');
    this.email = page.getByTestId('email');
    this.password = page.getByTestId('password');
    this.submit = page.getByTestId('register-submit');
  }

  async goto() {
    await this.page.goto('/auth/register');
  }

  async fillAddressStep(data: RegistrationData) {
    await this.firstName.fill(data.firstName);
    await this.lastName.fill(data.lastName);
    await this.dob.fill(data.dob);
    await this.country.selectOption(data.country);
    await this.postalCode.fill(data.postalCode);
    await this.houseNumber.fill(data.houseNumber);
    // Address auto-fill from postcode lookup is asynchronous (~1s) — wait for it
    // instead of racing the network call (verified live: street/city stay
    // blank for a moment after postal_code/house_number are set).
    await expect(this.street).not.toHaveValue('', { timeout: 5_000 });
  }

  async register(data: RegistrationData) {
    await this.fillAddressStep(data);
    await this.phone.fill(data.phone);
    await this.email.fill(data.email);
    await this.password.fill(data.password);
    await this.submit.click();
  }

  /**
   * Use this (not the raw register()) whenever the caller is about to act on
   * the resulting page — e.g. immediately logging in. register() only clicks
   * submit; it doesn't wait for the redirect to /auth/login to actually land.
   * A caller that fills the login form right after register() can race that
   * navigation — getByTestId('email') matches a field on both pages, so a
   * fill can land on the register page a beat before it navigates away and
   * be lost, leaving the login form empty when submit is finally clicked.
   * Reproduced live: see ai-prompts/automation-and-debugging.md, Entry 7.
   */
  async registerExpectingSuccess(data: RegistrationData) {
    await this.register(data);
    await expect(this.page, 'registration should redirect to /auth/login').toHaveURL(/auth\/login/, {
      timeout: 15_000,
    });
  }

  fieldError(text: string): Locator {
    return this.page.getByText(text, { exact: false });
  }
}
