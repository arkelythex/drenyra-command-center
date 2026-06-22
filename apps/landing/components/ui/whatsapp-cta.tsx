"use client";

import type { ReactElement } from "react";
import { MessageCircle } from "lucide-react";

import { whatsappContactUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

/**
 * Floating WhatsApp CTA — solo en rutas de conversión (ver `site-chrome.ts`).
 */
export function WhatsAppCTA(): ReactElement {
	return (
		<a
			href={whatsappContactUrl}
			target="_blank"
			rel="noopener noreferrer"
			aria-label="Contactar por WhatsApp"
			className={cn(
				"fixed bottom-24 right-4 z-50 sm:bottom-6 sm:right-6",
				"flex h-14 w-14 items-center justify-center rounded-full shadow-lg",
				"bg-[#25D366] text-white transition-transform duration-200",
				"hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#25D366]",
				"motion-safe:animate-pulse",
			)}
			style={{ animationDuration: "3s" }}
		>
			<MessageCircle className="h-7 w-7 fill-current" aria-hidden />
		</a>
	);
}
