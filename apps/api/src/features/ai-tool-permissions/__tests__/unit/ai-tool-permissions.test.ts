import { describe, it, expect, vi } from 'vitest';

const mockDb = vi.hoisted(() => ({
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  query: {
    aiToolPermissions: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

const mockAiToolPermissions = vi.hoisted(() => ({
  id: 'id_col',
  toolName: 'toolName_col',
  effect: 'effect_col',
  companyId: 'companyId_col',
  organizationId: 'organizationId_col',
  createdAt: 'createdAt_col',
  updatedAt: 'updatedAt_col',
  $inferSelect: {},
  $inferInsert: {},
}));

vi.mock('@drenyra/persistence/schema', () => ({
  aiToolPermissions: mockAiToolPermissions,
}));

vi.mock('@drenyra/persistence/client', () => ({
  db: mockDb,
}));

vi.mock('@drenyra/persistence/query', () => ({
  eq: vi.fn(() => 'eq_mock'),
  desc: vi.fn(() => 'desc_mock'),
  and: vi.fn(() => 'and_mock'),
}));

import { AiToolPermissionService } from '../../ai-tool-permissions.service';

describe('AiToolPermissionService', () => {
  const mockPermission = {
    id: '00000000-0000-0000-0000-000000000001',
    toolName: 'data-analyzer',
    effect: 'ALLOW' as const,
    companyId: '00000000-0000-0000-0000-000000000010',
    organizationId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new AI tool permission with valid data', async () => {
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockPermission]),
        }),
      });

      const result = await AiToolPermissionService.create({
        toolName: 'data-analyzer',
        effect: 'ALLOW',
      });

      expect(result).toEqual(mockPermission);
      expect(mockDb.insert).toHaveBeenCalledTimes(1);
    });

    it('should throw when insert returns no rows', async () => {
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        AiToolPermissionService.create({
          toolName: 'data-analyzer',
          effect: 'ALLOW',
        }),
      ).rejects.toThrow('No se pudo crear el permiso de herramienta de IA');
    });
  });

  describe('list', () => {
    it('should list all permissions when no companyId is provided', async () => {
      mockDb.query.aiToolPermissions.findMany.mockResolvedValue([mockPermission]);

      const result = await AiToolPermissionService.list();

      expect(result).toEqual([mockPermission]);
      expect(mockDb.query.aiToolPermissions.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: ['desc_mock'],
      });
    });

    it('should filter by companyId when provided', async () => {
      mockDb.query.aiToolPermissions.findMany.mockResolvedValue([mockPermission]);

      const result = await AiToolPermissionService.list('00000000-0000-0000-0000-000000000010');

      expect(result).toEqual([mockPermission]);
      expect(mockDb.query.aiToolPermissions.findMany).toHaveBeenCalledWith({
        where: 'eq_mock',
        orderBy: ['desc_mock'],
      });
    });

    it('should return empty array when no permissions exist', async () => {
      mockDb.query.aiToolPermissions.findMany.mockResolvedValue([]);

      const result = await AiToolPermissionService.list();

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return a permission when found', async () => {
      mockDb.query.aiToolPermissions.findFirst.mockResolvedValue(mockPermission);

      const result = await AiToolPermissionService.getById('00000000-0000-0000-0000-000000000001');

      expect(result).toEqual(mockPermission);
    });

    it('should return null when permission is not found', async () => {
      mockDb.query.aiToolPermissions.findFirst.mockResolvedValue(null);

      const result = await AiToolPermissionService.getById('00000000-0000-0000-0000-000000000099');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a permission successfully', async () => {
      const updatedPermission = { ...mockPermission, effect: 'DENY' as const };
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedPermission]),
          }),
        }),
      });

      const result = await AiToolPermissionService.update(
        '00000000-0000-0000-0000-000000000001',
        { effect: 'DENY' },
      );

      expect(result).toEqual(updatedPermission);
      expect(result.effect).toBe('DENY');
    });

    it('should throw when permission to update is not found', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        AiToolPermissionService.update('00000000-0000-0000-0000-000000000099', { effect: 'DENY' }),
      ).rejects.toThrow('AI Tool Permission not found');
    });
  });

  describe('delete', () => {
    it('should hard delete a permission successfully', async () => {
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockPermission]),
        }),
      });

      const result = await AiToolPermissionService.delete('00000000-0000-0000-0000-000000000001');

      expect(result).toEqual(mockPermission);
    });

    it('should throw when permission to delete is not found', async () => {
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        AiToolPermissionService.delete('00000000-0000-0000-0000-000000000099'),
      ).rejects.toThrow('AI Tool Permission not found');
    });
  });
});
