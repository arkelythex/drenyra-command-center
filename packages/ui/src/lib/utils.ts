/**
 * Utility functions for Drenyra UI components
 *
 * @module @drenyra/ui/lib/utils
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper conflict resolution.
 *
 * Combines clsx for conditional class handling with tailwind-merge
 * for proper Tailwind class conflict resolution.
 *
 * @param inputs - ClassValue arguments to merge
 * @returns Merged class string with conflicts resolved
 *
 * @example
 * ```tsx
 * cn("px-4 py-2", condition && "bg-primary", "text-white")
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
