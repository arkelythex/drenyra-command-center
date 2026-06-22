/**
 * Global test setup file
 * Mocks all external dependencies that are not available in test environment
 */
import { vi, beforeAll } from 'vitest';

beforeAll(() => {
  // Mock ALL problematic dependencies globally
  vi.mock('@ai-sdk/google', () => ({
    google: vi.fn(() => ({})),
    GoogleGenerativeAI: vi.fn(),
  }));

  vi.mock('ai', () => ({
    generateText: vi.fn(),
    streamText: vi.fn(),
    generateObject: vi.fn(),
  }));

  vi.mock('@aws-sdk/client-s3', () => ({
    S3Client: vi.fn(),
    PutObjectCommand: vi.fn(),
    GetObjectCommand: vi.fn(),
    DeleteObjectCommand: vi.fn(),
  }));

  vi.mock('@aws-sdk/lib-storage', () => ({
    Upload: vi.fn(),
  }));

  vi.mock('bullmq', () => ({
    Queue: vi.fn(),
    Worker: vi.fn(),
    QueueEvents: vi.fn(),
  }));

  // Mock @/lib/db path aliases from infrastructure package
  vi.mock('@/lib/db', () => ({
    default: { query: {} },
    db: { query: {} },
  }));

  vi.mock('@/lib/db/schema', () => ({}));
  vi.mock('@/lib/db/schema-extensions', () => ({}));
  vi.mock('@/shared/errors', () => ({}));

  vi.mock('@arkelythex/shared', async () => {
    const actual = await vi.importActual<typeof import('@arkelythex/shared')>('@arkelythex/shared');

    return {
      ...actual,
      SecureLogger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        audit: vi.fn(),
        namespace: vi.fn(() => ({
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn(),
        })),
      },
    };
  });
});
