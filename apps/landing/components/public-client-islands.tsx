"use client";

import type { ReactElement } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import { shouldShowConversionChrome } from "@/lib/landing/site-chrome";

const WebVitalsReporter = dynamic(
	() =>
		import("@/components/web-vitals-reporter-lazy").then(
			(module) => module.WebVitalsReporterLazy,
		),
	{ ssr: false },
);

const CookieConsent = dynamic(
	() =>
		import("@/components/cookie-consent-lazy").then(
			(module) => module.CookieConsentLazy,
		),
	{ ssr: false },
);

const FloatingCTA = dynamic(
	() =>
		import("@/components/floating-cta-lazy").then(
			(module) => module.FloatingCTALazy,
		),
	{ ssr: false },
);

const WhatsAppCTA = dynamic(
	() => import("@/components/ui/whatsapp-cta").then((module) => module.WhatsAppCTA),
	{ ssr: false },
);

const ExitIntentPopup = dynamic(
	() =>
		import("@/components/exit-intent-popup").then(
			(module) => module.ExitIntentPopup,
		),
	{ ssr: false },
);

export function PublicClientIslands(): ReactElement {
	const pathname = usePathname();
	const showConversionCtas = shouldShowConversionChrome(pathname);

	return (
		<>
			<WebVitalsReporter />
			<CookieConsent />
			{showConversionCtas ? <FloatingCTA /> : null}
			{showConversionCtas ? <WhatsAppCTA /> : null}
			<ExitIntentPopup />
		</>
	);
}
