import { Page, Locator, expect } from '@playwright/test';
import { RegistrationData } from '@utils/testDataGenerator';

/**
 * Toolshop's cart + checkout is a single stepper at /checkout: CART(1) -> SIGN IN(2) ->
 * BILLING ADDRESS(3) -> PAYMENT(4). Continue-button data-test ids differ for guest vs.
 * signed-in users at step 2. For an already-signed-in user, step 2 is NOT skipped —
 * it shows a "Hello <name>, you are already logged in. You can proceed to checkout."
 * confirmation with its own "Proceed to checkout" button (data-test="proceed-2")
 * that must be clicked before the billing address fields become visible. This was
 * missed during manual exploration (raw DOM queries found the address fields present
 * in the DOM regardless of which step was actually visible) and only surfaced when a
 * real Playwright run enforced strict visibility — see
 * ai-prompts/automation-and-debugging.md, Entry 9. Both the guest and signed-in paths
 * converge on "proceed-3" to leave the billing-address step.
 */
export class CheckoutPage {
  readonly page: Page;
  readonly cartLineQuantity: Locator;
  readonly cartTotal: Locator;
  readonly proceed1: Locator;
  readonly proceed2SignedIn: Locator;
  readonly guestEmail: Locator;
  readonly guestFirstName: Locator;
  readonly guestLastName: Locator;
  readonly guestSubmit: Locator;
  readonly proceed2Guest: Locator;
  readonly country: Locator;
  readonly postalCode: Locator;
  readonly houseNumber: Locator;
  readonly street: Locator;
  readonly proceed3: Locator;
  readonly paymentMethod: Locator;
  readonly finish: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartLineQuantity = page.getByTestId('product-quantity');
    this.cartTotal = page.getByTestId('cart-total');
    this.proceed1 = page.getByTestId('proceed-1');
    this.proceed2SignedIn = page.getByTestId('proceed-2');
    this.guestEmail = page.getByTestId('guest-email');
    this.guestFirstName = page.getByTestId('guest-first-name');
    this.guestLastName = page.getByTestId('guest-last-name');
    this.guestSubmit = page.getByTestId('guest-submit');
    this.proceed2Guest = page.getByTestId('proceed-2-guest');
    this.country = page.getByTestId('country');
    this.postalCode = page.getByTestId('postal_code');
    this.houseNumber = page.getByTestId('house_number');
    this.street = page.getByTestId('street');
    this.proceed3 = page.getByTestId('proceed-3');
    this.paymentMethod = page.getByTestId('payment-method');
    this.finish = page.getByTestId('finish');
  }

  async setLineQuantity(value: number) {
    await this.cartLineQuantity.fill(String(value));
    await this.cartLineQuantity.blur();
  }

  async proceedToBillingAsSignedInUser(data: RegistrationData) {
    await this.proceed1.click();
    // "Hello <name>, you are already logged in. You can proceed to checkout."
    // confirmation step — must be clicked before the address fields render.
    await this.proceed2SignedIn.click();
    await this.country.selectOption(data.country);
    await this.postalCode.fill(data.postalCode);
    await this.houseNumber.fill(data.houseNumber);
    await expect(this.street).not.toHaveValue('', { timeout: 5_000 });
    await this.proceed3.click();
  }

  async proceedToBillingAsGuest(email: string, firstName: string, lastName: string, data: RegistrationData) {
    await this.proceed1.click();
    await this.guestEmail.fill(email);
    await this.guestFirstName.fill(firstName);
    await this.guestLastName.fill(lastName);
    await this.guestSubmit.click();
    await this.proceed2Guest.click();
    await this.country.selectOption(data.country);
    await this.postalCode.fill(data.postalCode);
    await this.houseNumber.fill(data.houseNumber);
    await expect(this.street).not.toHaveValue('', { timeout: 5_000 });
    await this.proceed3.click();
  }

  async payCashOnDelivery() {
    await this.paymentMethod.selectOption('cash-on-delivery');
  }

  /** Clicks Confirm once. Known app behavior: the order is NOT placed yet — a
   *  "Payment was successful" message appears but the Confirm button remains. */
  async clickConfirmOnce() {
    await this.finish.click();
    await expect(this.page.getByText('Payment was successful')).toBeVisible();
    await expect(this.finish).toBeVisible();
  }

  /** Clicks Confirm a second time — this is what actually generates the invoice. */
  async clickConfirmAgainToGenerateInvoice(): Promise<string> {
    await this.finish.click();
    const confirmation = this.page.getByText(/Thanks for your order! Your invoice number is/);
    await expect(confirmation).toBeVisible();
    const text = await confirmation.textContent();
    const match = text?.match(/INV-\d+/);
    if (!match) throw new Error(`Could not parse invoice number from: ${text}`);
    return match[0];
  }
}
