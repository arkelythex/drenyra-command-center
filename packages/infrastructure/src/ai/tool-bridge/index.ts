/**
 * Tool Bridge - Barrel
 */

export type {
  OpenRouterJsonType,
  OpenRouterJsonSchemaProperty,
  OpenRouterJsonObjectSchema,
  ZodIntrospectable,
  ToolStreamEvent,
  ToolApprovalRequest,
  PermissionEffect,
  PermissionCheckFn,
} from './types';

export {
  getOpenRouterTools,
  streamWithToolExecution,
} from './bridge';
