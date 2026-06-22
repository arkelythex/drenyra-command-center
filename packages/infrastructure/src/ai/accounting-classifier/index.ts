/**
 * Accounting Classifier - Barrel
 */

export type {
  ClassificationInput,
  ClassificationResult,
} from './types';

export {
  ClassificationSchema,
} from './types';

export {
  classifyExpense,
  suggestPurchaseEntry,
  quickClassify,
} from './service';
