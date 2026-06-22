/**
 * Account Number Value Object
 * Validates and normalizes Peruvian bank account numbers
 *
 * @throws {Error} If the provided account number is invalid
 *
 * @example
 * ```ts
 * const acc = AccountNumber.create("191-1234567890");
 * acc.getMasked(); // "****7890"
 * ```
 */

export class AccountNumber {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static create(accountNumber: string): AccountNumber {
    const normalized = AccountNumber.normalize(accountNumber);
    
    if (!AccountNumber.isValid(normalized)) {
      throw new Error(`Invalid account number: ${accountNumber}`);
    }
    
    return new AccountNumber(normalized);
  }

  static isValid(accountNumber: string): boolean {
    const normalized = AccountNumber.normalize(accountNumber);
    
    if (normalized.length < 10 || normalized.length > 25) {
      return false;
    }
    
    if (!/^[\d-]+$/.test(normalized)) {
      return false;
    }
    
    return true;
  }

  static normalize(accountNumber: string): string {
    return accountNumber
      .trim()
      .replace(/\s+/g, '')
      .toUpperCase();
  }

  getValue(): string {
    return this.value;
  }

  getMasked(): string {
    if (this.value.length <= 4) {
      return this.value;
    }
    
    const lastFour = this.value.slice(-4);
    return `****${lastFour}`;
  }

  getDigitsOnly(): string {
    return this.value.replace(/\D/g, '');
  }

  equals(other: AccountNumber | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}
