// Workspace-only type stubs for optional integrations.
//
// This repo has adapters that are installed only in certain deployments.
// For CI/typecheck, we keep these as optional to avoid forcing heavy deps.

declare module "@aws-sdk/client-s3" {
	export class S3Client {
		constructor(config: unknown);
		send(command: unknown): Promise<unknown>;
	}

	export class PutObjectCommand {
		constructor(input: unknown);
	}
	export class GetObjectCommand {
		constructor(input: unknown);
	}
	export class DeleteObjectCommand {
		constructor(input: unknown);
	}
}

declare module "@aws-sdk/s3-request-presigner" {
	export function getSignedUrl(
		client: unknown,
		command: unknown,
		options?: unknown,
	): Promise<string>;
}

declare module "playwright" {
	export interface ElementHandle {
		screenshot(options?: unknown): Promise<Buffer>;
	}

	export interface Page {
		goto(url: string, options?: unknown): Promise<void>;
		waitForSelector(selector: string, options?: unknown): Promise<void>;
		fill(selector: string, value: string, options?: unknown): Promise<void>;
		click(selector: string, options?: unknown): Promise<void>;
		waitForTimeout(timeout: number): Promise<void>;
		evaluate<T = unknown>(
			pageFunction: (...args: unknown[]) => T,
			...args: unknown[]
		): Promise<T>;
		$(selector: string): Promise<ElementHandle | null>;
		close(): Promise<void>;
	}

	export interface Browser {
		close(): Promise<void>;
		newContext(options?: unknown): Promise<BrowserContext>;
	}

	export interface BrowserContext {
		close(): Promise<void>;
		newPage(): Promise<Page>;
	}

	export const chromium: {
		launch(options?: unknown): Promise<Browser>;
	};
}

declare module "puppeteer-core" {
	export interface Browser {
		close(): Promise<void>;
		newPage(): Promise<Page>;
	}

	export interface Page {
		mouse: { move(x: number, y: number): Promise<void> };
		goto(url: string, options?: unknown): Promise<void>;
		waitForSelector(selector: string, options?: unknown): Promise<void>;
		waitForNavigation(options?: unknown): Promise<void>;
		evaluate<T = unknown>(
			pageFunction: (...args: unknown[]) => T,
			...args: unknown[]
		): Promise<T>;
		$(selector: string): Promise<{ screenshot(options?: unknown): Promise<Buffer> } | null>;
		close(): Promise<void>;
		click(selector: string): Promise<void>;
		type(
			selector: string,
			text: string,
			options?: { delay?: number },
		): Promise<void>;
	}
}

declare module "puppeteer-extra" {
	import type { Browser } from "puppeteer-core";

	export interface PuppeteerExtra {
		use(plugin: unknown): void;
		launch(options?: unknown): Promise<Browser>;
	}

	const puppeteer: PuppeteerExtra;
	export default puppeteer;
}

declare module "puppeteer-extra-plugin-stealth" {
	const StealthPlugin: () => unknown;
	export default StealthPlugin;
}

declare module "bullmq" {
	export type JobsOptions = Record<string, unknown>;

	export interface Job<T = unknown> {
		id?: string | number;
		data: T;
	}

	export class QueueEvents {
		constructor(name: string, opts?: unknown);
		on(event: string, handler: (...args: unknown[]) => void): void;
		close(...args: unknown[]): Promise<void>;
	}

	export class Queue<T = unknown> {
		constructor(name: string, opts?: unknown);
		[key: string]: unknown;
		add(
			name: string,
			data: T,
			opts?: JobsOptions,
		): Promise<{ id?: string | number }>;
		getJobCounts(...args: unknown[]): Promise<Record<string, number>>;
		getActiveCount(...args: unknown[]): Promise<number>;
		getWaitingCount(...args: unknown[]): Promise<number>;
		getCompletedCount(...args: unknown[]): Promise<number>;
		getFailedCount(...args: unknown[]): Promise<number>;
		getDelayedCount(...args: unknown[]): Promise<number>;
		close(...args: unknown[]): Promise<void>;
	}

	export class Worker<T = unknown, R = unknown> {
		constructor(
			name: string,
			processor: (job: Job<T>) => Promise<R> | R,
			opts?: unknown,
		);
		on(event: string, handler: (...args: unknown[]) => void): void;
	}
}
