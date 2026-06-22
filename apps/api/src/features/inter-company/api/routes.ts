/**
 * Inter-Company — API Routes (Canonical VSA)
 *
 * Elysia plugin wiring HTTP ↔ CQRS handlers.
 * This is the authoritative implementation. All new registrations MUST use this.
 *
 * Architecture: HTTP → Handler → Repository → PostgreSQL
 * Business logic lives exclusively in the handlers, NOT here.
 */

import { Elysia } from 'elysia';
import { companyScopeGuard } from '../../../shared/plugins/company-scope-guard';
import { CreateInterCompanyTransactionHandler } from '../application/commands/create-inter-company-transaction.handler';
import { GenerateSpotPdfHandler } from '../application/commands/generate-spot-pdf.handler';
import { GetDetractionAuditHandler } from '../application/queries/get-detraction-audit.handler';
import { GetStatsHandler } from '../application/queries/get-stats.handler';
import { GetTransactionsHandler } from '../application/queries/get-transactions.handler';
import { interCompanyTransactionRepository } from '../infrastructure/inter-company-transaction.repository';
import {
  buildAuditQueryFingerprint,
  buildDetractionAuditCsv,
  parseAuditDateRange,
  sha256Json,
  sha256Utf8,
} from '../infrastructure/detraction-audit-export';
import {
  interCompanyAuditQuerySchema,
  interCompanyCreateBodySchema,
  interCompanyRouteDetails,
} from '../infrastructure/inter-company-route-contracts';
import { fail, ok } from '../../shared/api-response';

// Singleton handler instances — wired at plugin load time (DI via constructor)
const createHandler = new CreateInterCompanyTransactionHandler(interCompanyTransactionRepository);
const generateSpotPdfHandler = new GenerateSpotPdfHandler(interCompanyTransactionRepository);
const getTransactionsHandler = new GetTransactionsHandler(interCompanyTransactionRepository);
const getDetractionAuditHandler = new GetDetractionAuditHandler(interCompanyTransactionRepository);
const getStatsHandler = new GetStatsHandler(interCompanyTransactionRepository);

/**
 * interCompanyRoutes const.
 *
 * @example
 * ```ts
 * console.log(interCompanyRoutes);
 * ```
 */
export const interCompanyRoutes = new Elysia({ prefix: '/api/inter-company' })
  .use(companyScopeGuard())
  .post(
    '/',
    async ({ body, set }) => {
      try {
        const result = await createHandler.execute({
          economicGroupId: body.economicGroupId,
          fromCompanyId: body.fromCompanyId,
          toCompanyId: body.toCompanyId,
          concept: body.concept,
          amount: body.amount,
          taxType: body.taxType,
          detractionProfile: body.detractionProfile,
        });
        return ok({ ...result, message: '✅ Transacciones inter-compañía creadas automáticamente' });
      } catch (error) {
        set.status = 400;
        return fail(
          error instanceof Error ? error.message : 'Failed to create transaction',
          'INTER_COMPANY_CREATE_ERROR'
        );
      }
    },
    { body: interCompanyCreateBodySchema, detail: interCompanyRouteDetails.create }
  )
  .get(
    '/audit',
    async ({ query, set }) => {
      try {
        const limit = query.limit !== undefined ? Number(query.limit) : undefined;
        const offset = query.offset !== undefined ? Number(query.offset) : undefined;
        const { dateFrom, dateTo } = parseAuditDateRange({
          dateFrom: query.dateFrom,
          dateTo: query.dateTo,
        });

        const audit = await getDetractionAuditHandler.execute({
          economicGroupId: query.economicGroupId,
          detractionProfile: query.detractionProfile,
          detractionRuleCode: query.detractionRuleCode,
          dateFrom,
          dateTo,
          limit,
          offset,
          sortBy: query.sortBy,
          sortDir: query.sortDir,
        });

        const fingerprint = buildAuditQueryFingerprint({
          economicGroupId: query.economicGroupId,
          detractionProfile: query.detractionProfile,
          detractionRuleCode: query.detractionRuleCode,
          dateFrom: query.dateFrom,
          dateTo: query.dateTo,
          limit,
          offset,
          sortBy: query.sortBy,
          sortDir: query.sortDir,
        });

        if (query.format === 'csv') {
          const csv = buildDetractionAuditCsv(
            audit.items as unknown as Array<Record<string, unknown>>
          );
          const filename = `inter_company_detraction_audit_${new Date().toISOString().slice(0, 10)}.csv`;
          set.headers['Content-Type'] = 'text/csv; charset=utf-8';
          set.headers['Content-Disposition'] = `attachment; filename="${filename}"`;
          set.headers['X-Audit-Content-SHA256'] = sha256Utf8(csv);
          set.headers['X-Audit-Generated-At'] = new Date().toISOString();
          set.headers['X-Audit-Row-Count'] = String(audit.items.length);
          set.headers['X-Audit-Query-Fingerprint'] = fingerprint;
          return csv;
        }

        const payload = ok({ ...audit, auditFingerprint: fingerprint });
        set.headers['X-Audit-Content-SHA256'] = sha256Json(payload);
        set.headers['X-Audit-Generated-At'] = new Date().toISOString();
        set.headers['X-Audit-Row-Count'] = String(audit.items.length);
        set.headers['X-Audit-Query-Fingerprint'] = fingerprint;
        return payload;
      } catch (error) {
        set.status = 400;
        return fail(
          error instanceof Error ? error.message : 'Failed to fetch audit',
          'INTER_COMPANY_AUDIT_ERROR'
        );
      }
    },
    { query: interCompanyAuditQuerySchema, detail: interCompanyRouteDetails.audit }
  )
  .get(
    '/group/:economicGroupId',
    async ({ params }) => {
      const txs = await getTransactionsHandler.execute(params.economicGroupId);
      return ok({ total: txs.length, transactions: txs });
    },
    { detail: interCompanyRouteDetails.groupList }
  )
  .post(
    '/:id/spot',
    async ({ params, set }) => {
      try {
        const spot = await generateSpotPdfHandler.execute(params.id);
        return ok(spot);
      } catch (error) {
        set.status = 400;
        return fail(
          error instanceof Error ? error.message : 'Failed to generate SPOT',
          'SPOT_GENERATE_ERROR'
        );
      }
    },
    { detail: interCompanyRouteDetails.spot }
  )
  .get(
    '/stats/:economicGroupId',
    async ({ params }) => {
      const stats = await getStatsHandler.execute(params.economicGroupId);
      return ok(stats);
    },
    { detail: interCompanyRouteDetails.stats }
  );
