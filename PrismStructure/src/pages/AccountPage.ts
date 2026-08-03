import { Page, Locator } from '@playwright/test';

export class AccountPage {
  readonly page: Page;
  readonly navMyProfile: Locator;
  readonly navMyInvoices: Locator;
  readonly navSignOut: Locator;
  readonly profileFirstName: Locator;
  readonly profileLastName: Locator;
  readonly profileEmail: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navMyProfile = page.getByTestId('nav-my-profile');
    this.navMyInvoices = page.getByTestId('nav-my-invoices');
    this.navSignOut = page.getByTestId('nav-sign-out');
    this.profileFirstName = page.getByTestId('first-name');
    this.profileLastName = page.getByTestId('last-name');
    this.profileEmail = page.getByTestId('email');
  }

  async openProfile() {
    await this.navMyProfile.click();
  }

  async openInvoices() {
    await this.navMyInvoices.click();
  }
}
