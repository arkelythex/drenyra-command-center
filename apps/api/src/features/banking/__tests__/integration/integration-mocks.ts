/**
 * Shared mocks for integration tests
 *
 * These mocks are MINIMAL and only cover external dependencies
 * that are not relevant to banking tests but are imported by infrastructure.
 */

import { vi } from 'vitest';

// Mock AI SDK (not used in banking but imported by infrastructure)
vi.mock('@ai-sdk/google', () => ({
  google: vi.fn(() => ({})),
  GoogleGenerativeAI: vi.fn(),
}));

// Mock internal path aliases that don't exist in test environment
vi.mock('@/shared/errors', () => ({
  AppError: class AppError extends Error {
    constructor(message: string, public code?: string) {
      super(message);
      this.name = 'AppError';
    }
  },
  ValidationError: class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  },
}));

vi.mock('@/lib/db', () => ({
  db: {},
}));

// Mock AWS SDK (not used in banking tests)
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
}));

vi.mock('@aws-sdk/lib-storage', () => ({
  Upload: vi.fn(),
}));

// Mock BullMQ (queues not used in banking tests)
vi.mock('bullmq', () => ({
  Queue: vi.fn(),
  Worker: vi.fn(),
  QueueEvents: vi.fn(),
}));

export {};
