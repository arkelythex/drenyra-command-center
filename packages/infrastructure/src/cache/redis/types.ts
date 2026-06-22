// @ts-expect-error — Missing module, install via bun add
import type { Redis } from "@upstash/redis";

export type { Redis };

export interface CachedAccount {
	id: string;
	code: string;
	organizationId: number;
}
