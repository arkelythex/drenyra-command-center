/**
 * Stub for @aws-sdk packages
 * Used in test environment to prevent import errors
 */
import { vi } from "vitest";

export const S3Client = vi.fn();
export const PutObjectCommand = vi.fn();
export const GetObjectCommand = vi.fn();
export const DeleteObjectCommand = vi.fn();
export const Upload = vi.fn();
