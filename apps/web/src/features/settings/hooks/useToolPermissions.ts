/**
 * @fileoverview React Query hooks for ai_tool_permissions CRUD.
 *
 * Wraps the API client in `createCrudHooks` to provide useList, useGet,
 * useCreate, useUpdate, and useDelete mutations with automatic
 * query-key invalidation.
 */

import { createCrudHooks } from "@/lib/crud-api";
import {
	toolPermissionsApi,
	type ToolPermission,
	type CreateToolPermissionDTO,
	type UpdateToolPermissionDTO,
} from "../api/tool-permissions.api";

export const toolPermissionHooks = createCrudHooks<
	ToolPermission,
	CreateToolPermissionDTO,
	UpdateToolPermissionDTO
>({
	key: "tool-permissions",
	list: (companyId) =>
		toolPermissionsApi.list<ToolPermission[]>({ companyId }),
	getById: (id) => toolPermissionsApi.getById<ToolPermission>(id),
	create: (companyId, data) =>
		toolPermissionsApi.create<CreateToolPermissionDTO>({
			...data,
			companyId: data.companyId ?? companyId,
		}),
	update: (id, data) =>
		toolPermissionsApi.update<ToolPermission>(id, data),
	delete: (id) => toolPermissionsApi.delete<ToolPermission>(id),
});

export const useToolPermissions = toolPermissionHooks.useList;
export const useToolPermission = toolPermissionHooks.useGet;
export const useCreateToolPermission = toolPermissionHooks.useCreate;
export const useUpdateToolPermission = toolPermissionHooks.useUpdate;
export const useDeleteToolPermission = toolPermissionHooks.useDelete;
