import { Elysia } from 'elysia';
import { z } from 'zod';
import { companyScopeGuard } from '../../shared/plugins/company-scope-guard';
import {
  CreateAiToolPermissionSchema as CreateAiToolPermissionOpenApiSchema,
  ListAiToolPermissionsQuerySchema as ListAiToolPermissionsOpenApiSchema,
  AiToolPermissionIdParamsSchema as AiToolPermissionIdParamsOpenApiSchema,
  UpdateAiToolPermissionSchema as UpdateAiToolPermissionOpenApiSchema,
} from './ai-tool-permissions.schema';
import {
  CreateAiToolPermissionBodySchema,
  ListAiToolPermissionsQuerySchema,
  AiToolPermissionListResponseSchema,
  AiToolPermissionNullableResponseSchema,
  AiToolPermissionRecordSchema,
  AiToolPermissionIdParamsSchema,
  UpdateAiToolPermissionBodySchema,
} from './ai-tool-permissions.schemas';
import { fail, getErrorMessage, ok } from '../shared/api-response';
import { createPermission } from './application/commands/create-permission';
import { updatePermission } from './application/commands/update-permission';
import { deletePermission } from './application/commands/delete-permission';
import { listPermissions } from './application/queries/list-permissions';
import { getPermission } from './application/queries/get-permission';

function validationErrorResponse(error: z.ZodError<unknown>) {
  return fail('Invalid AI tool permission request parameters', 'VALIDATION_ERROR', {
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
      message: 'AI tool permission response violated its contract',
      issues: error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message,
      })),
    }),
    'AI_TOOL_PERMISSION_CONTRACT_ERROR',
  );
}

export const aiToolPermissionsModule = new Elysia({ prefix: '/api/ai-tool-permissions' })
  .use(companyScopeGuard())
  .get('/', async ({ query, set }) => {
    const parsedQuery = ListAiToolPermissionsQuerySchema.safeParse(query);
    if (!parsedQuery.success) {
      set.status = 422;
      return validationErrorResponse(parsedQuery.error);
    }

    try {
      const data = await listPermissions({ companyId: parsedQuery.data.companyId });
      const contract = AiToolPermissionListResponseSchema.safeParse(data);
      if (!contract.success) {
        set.status = 500;
        return responseContractErrorResponse(contract.error);
      }
      return ok(contract.data);
    } catch (error: unknown) {
      set.status = 500;
      return fail(getErrorMessage(error), 'INTERNAL_ERROR');
    }
  }, {
    query: ListAiToolPermissionsOpenApiSchema,
    detail: { tags: ['AI Swarm'], summary: 'Listar permisos de herramientas de IA' },
  })

  .post('/', async ({ body, set }) => {
    const parsedBody = CreateAiToolPermissionBodySchema.safeParse(body);
    if (!parsedBody.success) {
      set.status = 422;
      return validationErrorResponse(parsedBody.error);
    }

    try {
      const data = await createPermission(parsedBody.data);
      const contract = AiToolPermissionRecordSchema.safeParse(data);
      if (!contract.success) {
        set.status = 500;
        return responseContractErrorResponse(contract.error);
      }
      return ok(contract.data);
    } catch (error: unknown) {
      set.status = 500;
      return fail(getErrorMessage(error), 'INTERNAL_ERROR');
    }
  }, {
    body: CreateAiToolPermissionOpenApiSchema,
    detail: { tags: ['AI Swarm'], summary: 'Crear permiso de herramienta de IA' },
  })

  .get('/:id', async ({ params, set }) => {
    const parsedParams = AiToolPermissionIdParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      set.status = 422;
      return validationErrorResponse(parsedParams.error);
    }

    try {
      const data = await getPermission({ id: parsedParams.data.id });
      const contract = AiToolPermissionNullableResponseSchema.safeParse(data);
      if (!contract.success) {
        set.status = 500;
        return responseContractErrorResponse(contract.error);
      }
      return ok(contract.data);
    } catch (error: unknown) {
      set.status = 500;
      return fail(getErrorMessage(error), 'INTERNAL_ERROR');
    }
  }, {
    params: AiToolPermissionIdParamsOpenApiSchema,
    detail: { tags: ['AI Swarm'], summary: 'Obtener permiso de herramienta de IA por ID' },
  })

  .patch('/:id', async ({ params, body, set }) => {
    const parsedParams = AiToolPermissionIdParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      set.status = 422;
      return validationErrorResponse(parsedParams.error);
    }

    const parsedBody = UpdateAiToolPermissionBodySchema.safeParse(body);
    if (!parsedBody.success) {
      set.status = 422;
      return validationErrorResponse(parsedBody.error);
    }

    try {
      const data = await updatePermission({
        id: parsedParams.data.id,
        data: parsedBody.data,
      });
      const contract = AiToolPermissionRecordSchema.safeParse(data);
      if (!contract.success) {
        set.status = 500;
        return responseContractErrorResponse(contract.error);
      }
      return ok(contract.data);
    } catch (error: unknown) {
      set.status = 500;
      return fail(getErrorMessage(error), 'INTERNAL_ERROR');
    }
  }, {
    params: AiToolPermissionIdParamsOpenApiSchema,
    body: UpdateAiToolPermissionOpenApiSchema,
    detail: { tags: ['AI Swarm'], summary: 'Actualizar permiso de herramienta de IA' },
  })

  .delete('/:id', async ({ params, set }) => {
    const parsedParams = AiToolPermissionIdParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      set.status = 422;
      return validationErrorResponse(parsedParams.error);
    }

    try {
      const data = await deletePermission(parsedParams.data.id);
      const contract = AiToolPermissionRecordSchema.safeParse(data);
      if (!contract.success) {
        set.status = 500;
        return responseContractErrorResponse(contract.error);
      }
      return ok(contract.data);
    } catch (error: unknown) {
      set.status = 500;
      return fail(getErrorMessage(error), 'INTERNAL_ERROR');
    }
  }, {
    params: AiToolPermissionIdParamsOpenApiSchema,
    detail: { tags: ['AI Swarm'], summary: 'Eliminar permiso de herramienta de IA' },
  });
