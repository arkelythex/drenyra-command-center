/**
 * Logo Component
 * Single Responsibility: Render brand logo with link
 */

import type { ReactElement } from "react";
import Link from "next/link";

import { ArkelythexMark } from "@/components/brand/arkelythex-mark";
import type { LogoProps } from "../types";

export function Logo({ href = "/", compact = false }: LogoProps): ReactElement {
	return (
		<Link
			href={href}
			className="group flex items-center gap-2.5 rounded-lg p-1 -m-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
			aria-label="Arkelythex - Inicio"
		>
			<div
				className={`flex shrink-0 items-center justify-center text-foreground transition-opacity duration-200 group-hover:opacity-80 ${
					compact ? "h-7 w-7" : "h-9 w-9"
				}`}
			>
				<ArkelythexMark size={compact ? 28 : 36} />
			</div>
			<span
				className={`font-medium tracking-tight text-foreground transition-opacity duration-200 group-hover:opacity-80 ${
					compact ? "text-sm" : "text-base"
				}`}
			>
				Arkelythex
			</span>
		</Link>
	);
}
