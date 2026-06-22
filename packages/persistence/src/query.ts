/**
 * Drizzle query helpers (single import path)
 *
 * IMPORTANT:
 * Use this module instead of importing from `drizzle-orm` directly in `apps/*`.
 * It prevents type incompatibilities when multiple Drizzle instances exist in the workspace.
 *
 * @module infrastructure/db/query
 */

export {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  like,
  lt,
  lte,
  not,
  or,
  sql,
  sum,
} from 'drizzle-orm';
