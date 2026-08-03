import { faker } from '@faker-js/faker';

export interface RegistrationData {
  firstName: string;
  lastName: string;
  dob: string;
  country: string;
  postalCode: string;
  houseNumber: string;
  phone: string;
  email: string;
  password: string;
}

/**
 * Password guaranteed to satisfy the site's stated policy:
 * >=8 chars, upper+lowercase, >=1 number, >=1 special char.
 */
export function validPassword(): string {
  return `Qa${faker.string.alpha({ length: 4, casing: 'lower' })}${faker.number.int({ min: 10, max: 99 })}!`;
}

// DE postcodes reliably trigger the site's address auto-fill (verified live).
const KNOWN_DE_POSTCODE = '10115';

export function uniqueEmail(prefix = 'qa'): string {
  return `${prefix}.${Date.now()}.${faker.string.alphanumeric(4)}@example.com`;
}

export function validRegistration(): RegistrationData {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    dob: '1995-05-15',
    country: 'DE',
    postalCode: KNOWN_DE_POSTCODE,
    houseNumber: String(faker.number.int({ min: 1, max: 99 })),
    phone: faker.string.numeric(10),
    email: uniqueEmail(),
    password: validPassword(),
  };
}

/** Password policy negatives — each violates exactly one rule. */
export const invalidPasswords: Record<string, string> = {
  tooShort: 'Qa1!',
  noUppercase: 'qa1!testpass',
  noLowercase: 'QA1!TESTPASS',
  noNumber: 'Qatest!!!!',
  noSpecialChar: 'Qatest1234',
};

/**
 * The API's /users/register expects a nested address object with the full
 * country name ("Germany"), unlike the UI form which uses an ISO code ("DE") —
 * confirmed by calling the endpoint directly (see automation-and-debugging.md).
 */
export function apiRegistrationPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    dob: '1995-05-15',
    address: {
      street: faker.location.streetAddress(),
      city: 'Berlin',
      state: 'Berlin',
      country: 'Germany',
      postal_code: '10115',
    },
    phone: faker.string.numeric(10),
    email: uniqueEmail('api'),
    password: validPassword(),
    ...overrides,
  };
}

/**
 * The API validates that billing_city/billing_state actually belong to
 * billing_country (against its own fake-geo dataset) — confirmed live: a
 * Faker-random city/state for country "TG" was rejected with 422
 * ("The city does not belong to the selected country"), while the brief's
 * own example combo (Hesselbury / Florida / TG) was accepted (201). So this
 * uses that verified-valid combo rather than randomizing city/state.
 */
export function invoicePayload(cartId: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    billing_street: faker.location.streetAddress(),
    billing_city: 'Hesselbury',
    billing_state: 'Florida',
    billing_country: 'TG',
    billing_postal_code: '1234AA',
    payment_method: 'cash-on-delivery',
    cart_id: cartId,
    payment_details: {},
    ...overrides,
  };
}
