import { Elysia, t } from 'elysia';
import { z } from 'zod';
import { companyScopeGuard } from '../../shared/plugins';
import { standardRateLimit } from '../../middleware/rate-limit.middleware';
import { InventoryService } from './inventory.service';
import {
  CreateMovementSchema as CreateMovementOpenApiSchema,
  CreateWarehouseSchema as CreateWarehouseOpenApiSchema,
  InventoryQuerySchema as InventoryQueryOpenApiSchema,
  KardexQuerySchema as KardexQueryOpenApiSchema,
} from './inventory.schema';
import {
  CreateMovementBodySchema,
  CreateWarehouseBodySchema,
  InventoryListResponseSchema,
  InventoryListQuerySchema,
  InventoryMovementResponseSchema,
  InventorySummaryResponseSchema,
  KardexResponseSchema,
  KardexParamsSchema,
  KardexQuerySchema,
  WarehouseListResponseSchema,
  WarehouseResponseSchema,
} from './inventory.schemas';
import { fail, ok } from '../shared/api-response';
import { safeFail } from '../shared/safe-error';

function validationErrorResponse(error: z.ZodError<unknown>) {
  return fail('Invalid inventory request parameters', 'VALIDATION_ERROR', {
    details: {
      issues: error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message,
      })),
    },
  });
}

function responseContractErrorResponse(error: z.ZodError<unknown>) {
  return fail(
    JSON.stringify({
      message: 'Inventory response violated its contract',
      issues: error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message,
      })),
    }),
    'INVENTORY_CONTRACT_ERROR',
  );
}

/**
 * Inventory API surface (warehouses, stock, movements, kardex).
 *
 * Mounted in [`api-module-surface.ts`](../../api-module-surface.ts). Tenant-scoped
 * via `companyScopeGuard` plugin.
 */
export const inventoryModule = new Elysia({ prefix: '/api/inventory' })
  .use(companyScopeGuard({ allowHeaderFallback: true }))
  .use(standardRateLimit)

  .get('/', async ({ companyContext, query, set }) => {
    const parsedQuery = InventoryListQuerySchema.safeParse(query);
    if (!parsedQuery.success) {
      set.status = 422;
      return validationErrorResponse(parsedQuery.error);
    }

    try {
      const data = await InventoryService.list(
        companyContext!.companyId,
        parsedQuery.data.warehouseId,
      );
      const contract = InventoryListResponseSchema.safeParse(data);
      if (!contract.success) {
        set.status = 500;
        return responseContractErrorResponse(contract.error);
      }
      return ok(contract.data);
    } catch (error: unknown) {
      set.status = 500;
      return safeFail(error, 'INTERNAL_ERROR');
    }
  }, {
    query: InventoryQueryOpenApiSchema,
    detail: { tags: ['Inventory'], summary: 'Listar inventario' }
  })

  .post('/movement', async ({ companyContext, body, set }) => {
    const parsedBody = CreateMovementBodySchema.safeParse(body);
    if (!parsedBody.success) {
      set.status = 422;
      return validationErrorResponse(parsedBody.error);
    }

    try {
      const data = await InventoryService.recordMovement(
        companyContext!.companyId,
        parsedBody.data,
      );
      const contract = InventoryMovementResponseSchema.safeParse(data);
      if (!contract.success) {
        set.status = 500;
        return responseContractErrorResponse(contract.error);
      }
      return ok(contract.data);
    } catch (error: unknown) {
      set.status = 500;
      return safeFail(error, 'INTERNAL_ERROR');
    }
  }, {
    query: t.Object({}),
    body: CreateMovementOpenApiSchema,
    detail: { tags: ['Inventory'], summary: 'Registrar movimiento de stock' }
  })

  .get('/kardex/:productId', async ({ companyContext, params, query, set }) => {
    const parsedParams = KardexParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      set.status = 422;
      return validationErrorResponse(parsedParams.error);
    }

    const parsedQuery = KardexQuerySchema.safeParse(query);
    if (!parsedQuery.success) {
      set.status = 422;
      return validationErrorResponse(parsedQuery.error);
    }

    try {
      const data = await InventoryService.getKardex(
        companyContext!.companyId,
        parsedParams.data.productId,
        parsedQuery.data.startDate,
        parsedQuery.data.endDate,
      );
      const contract = KardexResponseSchema.safeParse(data);
      if (!contract.success) {
        set.status = 500;
        return responseContractErrorResponse(contract.error);
      }
      return ok(contract.data);
    } catch (error: unknown) {
      set.status = 500;
      return safeFail(error, 'INTERNAL_ERROR');
    }
  }, {
    params: t.Object({ productId: t.String({ format: 'uuid' }) }),
    query: KardexQueryOpenApiSchema,
    detail: { tags: ['Inventory'], summary: 'Consultar Kardex (SUNAT)' }
  })

  .get('/summary', async ({ companyContext, set }) => {
    try {
      const data = await InventoryService.getSummary(companyContext!.companyId);
      const contract = InventorySummaryResponseSchema.safeParse(data);
      if (!contract.success) {
        set.status = 500;
        return responseContractErrorResponse(contract.error);
      }
      return ok(contract.data);
    } catch (error: unknown) {
      set.status = 500;
      return safeFail(error, 'INTERNAL_ERROR');
    }
  }, {
    query: t.Object({}),
    detail: { tags: ['Inventory'], summary: 'Resumen de inventario' }
  })

  .get('/warehouses', async ({ companyContext, set }) => {
    try {
      const data = await InventoryService.listWarehouses(companyContext!.companyId);
      const contract = WarehouseListResponseSchema.safeParse(data);
      if (!contract.success) {
        set.status = 500;
        return responseContractErrorResponse(contract.error);
      }
      return ok(contract.data);
    } catch (error: unknown) {
      set.status = 500;
      return safeFail(error, 'INTERNAL_ERROR');
    }
  }, {
    query: t.Object({}),
    detail: { tags: ['Inventory'], summary: 'Listar almacenes' }
  })

  .post('/warehouses', async ({ companyContext, body, set }) => {
    const parsedBody = CreateWarehouseBodySchema.safeParse(body);
    if (!parsedBody.success) {
      set.status = 422;
      return validationErrorResponse(parsedBody.error);
    }

    try {
      const data = await InventoryService.createWarehouse(
        companyContext!.companyId,
        parsedBody.data,
      );
      const contract = WarehouseResponseSchema.safeParse(data);
      if (!contract.success) {
        set.status = 500;
        return responseContractErrorResponse(contract.error);
      }
      return ok(contract.data);
    } catch (error: unknown) {
      set.status = 500;
      return safeFail(error, 'INTERNAL_ERROR');
    }
  }, {
    query: t.Object({}),
    body: CreateWarehouseOpenApiSchema,
    detail: { tags: ['Inventory'], summary: 'Crear almacén' }
  });
