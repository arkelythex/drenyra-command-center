/**
 * Matching strategies for reconciling bank transactions with business documents.
 *
 * @example
 * ```ts
 * const strategy: MatchingStrategy = new ReferenceMatchingStrategy();
 * ```
 * Strategy identifier used for reporting/scoring reconciliation matches.
 *
 * @example
 * ```ts
 * const criteria: MatchCriteria = 'REFERENCE';
 * ```
 */

export type MatchCriteria =
  | 'REFERENCE'
  | 'AMOUNT_DATE'
  | 'AMOUNT_ENTITY'
  | 'FUZZY_ENTITY'
  | 'PARTIAL';

/**
 * A candidate document match produced by a `MatchingStrategy`.
 *
 * @example
 * ```ts
 * const candidate: MatchCandidate = {
 *   documentId: 'inv_123',
 *   documentType: 'INVOICE',
 *   score: 100,
 *   criteria: 'REFERENCE',
 * };
 * ```
 */
export interface MatchCandidate {
  documentId: string;
  documentType: 'INVOICE' | 'BILL';
  score: number;
  criteria: MatchCriteria;
  relatedTransactionIds?: string[];
}

/**
 * Minimal bank transaction shape required by matching strategies.
 *
 * @example
 * ```ts
 * const tx: BankTransactionLike = {
 *   id: 'tx_123',
 *   accountId: 'acc_123',
 *   companyId: 'cmp_123',
 *   transactionDate: new Date(),
 *   type: 'CREDIT',
 *   amount: '150.00',
 * };
 * ```
 */
export interface BankTransactionLike {
  id: string;
  accountId: string;
  companyId: string;
  transactionDate: Date | string;
  description?: string | null;
  reference?: string | null;
  type: 'DEBIT' | 'CREDIT';
  amount: string;
}

/**
 * Dependencies required by matching strategies (lookups + normalization).
 *
 * @example
 * ```ts
 * const context = { companyId: 'cmp_123', dateWindowDays: 2 } as MatchContext;
 * ```
 */
export interface MatchContext {
  companyId: string;
  dateWindowDays: number;
  normalizeReference: (ref: string) => string;
  findInvoiceByReference: (companyId: string, reference: string) => Promise<{ id: string } | null>;
  findBillByReference: (companyId: string, reference: string) => Promise<{ id: string } | null>;
  findInvoicesByAmountAndDate: (companyId: string, amount: string, start: Date, end: Date) => Promise<Array<{ id: string }>>;
  findBillsByAmountAndDate: (companyId: string, amount: string, start: Date, end: Date) => Promise<Array<{ id: string }>>;
  findPartners: (companyId: string) => Promise<Array<{ id: string; legalName: string }>>;
  findInvoicesByAmountAndCustomer: (companyId: string, customerId: string, amount: string) => Promise<Array<{ id: string }>>;
  findBillsByAmountAndVendor: (companyId: string, vendorId: string, amount: string) => Promise<Array<{ id: string }>>;
  findPartialPaymentMatch: (tx: BankTransactionLike) => Promise<MatchCandidate | null>;
}

/**
 * Contract for reconciliation matching strategies.
 *
 * @example
 * ```ts
 * const strategy: MatchingStrategy = new AmountDateMatchingStrategy();
 * ```
 */
export interface MatchingStrategy {
  readonly priority: number;
  readonly criteria: MatchCriteria;
  match(tx: BankTransactionLike, context: MatchContext): Promise<MatchCandidate | null>;
}

/**
 * Matches by parsing and normalizing a document reference.
 *
 * @example
 * ```ts
 * const strategy = new ReferenceMatchingStrategy();
 * ```
 */
export class ReferenceMatchingStrategy implements MatchingStrategy {
  readonly priority = 100;
  readonly criteria: MatchCriteria = 'REFERENCE';

  async match(tx: BankTransactionLike, context: MatchContext): Promise<MatchCandidate | null> {
    if (!tx.reference || !tx.reference.trim()) return null;

    const normalizedRef = context.normalizeReference(tx.reference);

    if (tx.type === 'CREDIT') {
      const invoice = await context.findInvoiceByReference(context.companyId, normalizedRef);
      return invoice
        ? { documentId: invoice.id, documentType: 'INVOICE', score: 100, criteria: 'REFERENCE' }
        : null;
    }

    const bill = await context.findBillByReference(context.companyId, normalizedRef);
    return bill
      ? { documentId: bill.id, documentType: 'BILL', score: 100, criteria: 'REFERENCE' }
      : null;
  }
}

/**
 * Matches by amount and transaction date window.
 *
 * @example
 * ```ts
 * const strategy = new AmountDateMatchingStrategy();
 * ```
 */
export class AmountDateMatchingStrategy implements MatchingStrategy {
  readonly priority = 80;
  readonly criteria: MatchCriteria = 'AMOUNT_DATE';

  async match(tx: BankTransactionLike, context: MatchContext): Promise<MatchCandidate | null> {
    const date = new Date(tx.transactionDate);
    const start = new Date(date);
    const end = new Date(date);
    start.setDate(start.getDate() - context.dateWindowDays);
    end.setDate(end.getDate() + context.dateWindowDays);

    if (tx.type === 'CREDIT') {
      const invoices = await context.findInvoicesByAmountAndDate(context.companyId, tx.amount, start, end);
      if (invoices.length > 0) {
        return { documentId: invoices[0].id, documentType: 'INVOICE', score: 80, criteria: 'AMOUNT_DATE' };
      }
      return null;
    }

    const bills = await context.findBillsByAmountAndDate(context.companyId, tx.amount, start, end);
    if (bills.length > 0) {
      return { documentId: bills[0].id, documentType: 'BILL', score: 80, criteria: 'AMOUNT_DATE' };
    }

    return null;
  }
}

/**
 * Matches by amount and a partner name present in the transaction description.
 *
 * @example
 * ```ts
 * const strategy = new AmountEntityMatchingStrategy();
 * ```
 */
export class AmountEntityMatchingStrategy implements MatchingStrategy {
  readonly priority = 60;
  readonly criteria: MatchCriteria = 'AMOUNT_ENTITY';

  async match(tx: BankTransactionLike, context: MatchContext): Promise<MatchCandidate | null> {
    const description = (tx.description ?? '').toUpperCase();
    if (!description) return null;

    const partners = await context.findPartners(context.companyId);

    if (tx.type === 'CREDIT') {
      for (const partner of partners) {
        const partnerName = partner.legalName.toUpperCase();
        if (!description.includes(partnerName)) continue;

        const invoices = await context.findInvoicesByAmountAndCustomer(
          context.companyId,
          partner.id,
          tx.amount
        );
        if (invoices.length > 0) {
          return { documentId: invoices[0].id, documentType: 'INVOICE', score: 60, criteria: 'AMOUNT_ENTITY' };
        }
      }
      return null;
    }

    for (const partner of partners) {
      const partnerName = partner.legalName.toUpperCase();
      if (!description.includes(partnerName)) continue;

      const bills = await context.findBillsByAmountAndVendor(
        context.companyId,
        partner.id,
        tx.amount
      );
      if (bills.length > 0) {
        return { documentId: bills[0].id, documentType: 'BILL', score: 60, criteria: 'AMOUNT_ENTITY' };
      }
    }

    return null;
  }
}

/**
 * Matches by fuzzy similarity between transaction description and partner legal name.
 *
 * @example
 * ```ts
 * const strategy = new FuzzyEntityMatchingStrategy();
 * ```
 */
export class FuzzyEntityMatchingStrategy implements MatchingStrategy {
  readonly priority = 55;
  readonly criteria: MatchCriteria = 'FUZZY_ENTITY';
  private static readonly MIN_SIMILARITY = 0.72;

  async match(tx: BankTransactionLike, context: MatchContext): Promise<MatchCandidate | null> {
    const description = normalizeFuzzyText(tx.description ?? '');
    if (!description) return null;

    const partners = await context.findPartners(context.companyId);
    let bestPartner: { id: string; similarity: number } | null = null;

    for (const partner of partners) {
      const similarity = computeBestSimilarity(description, normalizeFuzzyText(partner.legalName));
      if (!bestPartner || similarity > bestPartner.similarity) {
        bestPartner = { id: partner.id, similarity };
      }
    }

    if (!bestPartner || bestPartner.similarity < FuzzyEntityMatchingStrategy.MIN_SIMILARITY) {
      return null;
    }

    const score = Math.max(55, Math.min(79, Math.round(bestPartner.similarity * 100)));

    if (tx.type === 'CREDIT') {
      const invoices = await context.findInvoicesByAmountAndCustomer(
        context.companyId,
        bestPartner.id,
        tx.amount
      );
      if (invoices.length > 0) {
        return {
          documentId: invoices[0].id,
          documentType: 'INVOICE',
          score,
          criteria: 'FUZZY_ENTITY',
        };
      }
      return null;
    }

    const bills = await context.findBillsByAmountAndVendor(
      context.companyId,
      bestPartner.id,
      tx.amount
    );
    if (bills.length > 0) {
      return {
        documentId: bills[0].id,
        documentType: 'BILL',
        score,
        criteria: 'FUZZY_ENTITY',
      };
    }

    return null;
  }
}

/**
 * Matches partial payments using a dedicated resolver (e.g., multiple transactions -> invoice).
 *
 * @example
 * ```ts
 * const strategy = new PartialPaymentMatchingStrategy();
 * ```
 */
export class PartialPaymentMatchingStrategy implements MatchingStrategy {
  readonly priority = 60;
  readonly criteria: MatchCriteria = 'PARTIAL';

  async match(tx: BankTransactionLike, context: MatchContext): Promise<MatchCandidate | null> {
    return context.findPartialPaymentMatch(tx);
  }
}

function normalizeFuzzyText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function computeSimilarity(left: string, right: string): number {
  if (!left || !right) return 0;
  if (left === right) return 1;

  const tokenScore = jaccardScore(left.split(' '), right.split(' '));
  const bigramScore = diceCoefficient(toBigrams(left), toBigrams(right));
  return (tokenScore * 0.45) + (bigramScore * 0.55);
}

function computeBestSimilarity(description: string, partnerName: string): number {
  const scores = [computeSimilarity(description, partnerName)];
  const descriptionTokens = description.split(' ').filter(Boolean);
  const partnerTokens = partnerName.split(' ').filter(Boolean);
  const windowSize = partnerTokens.length;

  if (windowSize > 0 && descriptionTokens.length >= windowSize) {
    for (let start = 0; start <= descriptionTokens.length - windowSize; start += 1) {
      const window = descriptionTokens.slice(start, start + windowSize).join(' ');
      scores.push(computeSimilarity(window, partnerName));
    }
  }

  return Math.max(...scores);
}

function jaccardScore(leftTokens: string[], rightTokens: string[]): number {
  const left = new Set(leftTokens.filter(Boolean));
  const right = new Set(rightTokens.filter(Boolean));
  if (left.size === 0 || right.size === 0) return 0;

  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }
  const union = left.size + right.size - intersection;
  if (union === 0) return 0;
  return intersection / union;
}

function toBigrams(value: string): string[] {
  if (value.length < 2) return [value];
  const out: string[] = [];
  for (let i = 0; i < value.length - 1; i += 1) {
    out.push(value.slice(i, i + 2));
  }
  return out;
}

function diceCoefficient(left: string[], right: string[]): number {
  if (left.length === 0 || right.length === 0) return 0;

  const frequencies = new Map<string, number>();
  for (const gram of left) {
    frequencies.set(gram, (frequencies.get(gram) ?? 0) + 1);
  }

  let overlap = 0;
  for (const gram of right) {
    const count = frequencies.get(gram) ?? 0;
    if (count > 0) {
      overlap += 1;
      frequencies.set(gram, count - 1);
    }
  }

  return (2 * overlap) / (left.length + right.length);
}
