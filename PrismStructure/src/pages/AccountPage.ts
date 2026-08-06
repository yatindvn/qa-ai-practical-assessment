import { Page, Locator } from '@playwright/test';

export class AccountPage {
  readonly page: Page;
  // The account overview page (/account) has TWO separate sets of links to
  // the same destinations: visible body cards (data-test="nav-profile" /
  // "nav-invoices") and a collapsed top-nav user dropdown (data-test=
  // "nav-my-profile" / "nav-my-invoices", nested inside a Bootstrap
  // .dropdown-toggle). Using the dropdown ones directly failed in a real
  // run — Playwright correctly refused to click a non-visible element,
  // which a raw DOM .click() during manual exploration didn't catch (see
  // ai-prompts/automation-and-debugging.md, Entry 9). Using the always-
  // visible body cards instead.
  readonly navMyProfile: Locator;
  readonly navMyInvoices: Locator;
  readonly navSignOut: Locator;
  readonly userMenuToggle: Locator;
  readonly profileFirstName: Locator;
  readonly profileLastName: Locator;
  readonly profileEmail: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navMyProfile = page.getByTestId('nav-profile');
    this.navMyInvoices = page.getByTestId('nav-invoices');
    this.navSignOut = page.getByTestId('nav-sign-out');
    this.userMenuToggle = page.locator('.dropdown-toggle').first();
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

  // nav-sign-out only exists inside the collapsed top-nav dropdown (no
  // visible-body-card equivalent), so this one does need to open it first.
  // userMenuToggle's ".dropdown-toggle" selector is a structural guess
  // (Bootstrap dropdown convention, matching the nav-my-* items' own
  // "dropdown-item" class seen in the failed run's accessibility snapshot)
  // and hasn't been independently confirmed live — flagged for verification
  // alongside the STRETCH-UI-03 re-run.
  async signOut() {
    await this.userMenuToggle.click();
    await this.navSignOut.click();
  }
}
