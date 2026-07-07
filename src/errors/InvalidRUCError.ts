export class InvalidRUCError extends Error {
  constructor(ruc: string, message?: string) {
    super(message ?? `Invalid RUC: ${ruc}`);
  }
}
