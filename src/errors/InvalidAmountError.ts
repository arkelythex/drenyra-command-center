export class InvalidAmountError extends Error {
  constructor(amount: unknown, message?: string) {
    super(message ?? `Invalid amount: ${amount}`);
  }
}
