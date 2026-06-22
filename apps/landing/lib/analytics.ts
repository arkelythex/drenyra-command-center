/**
 * Analytics Service for Landing Page
 *
 * Tracks user interactions and conversions:
 * - Page views
 * - CTA clicks
 * - Pricing views
 * - Newsletter signups
 * - Form submissions
 *
 * In production, this would connect to:
 * - Google Analytics 4
 * - Meta Pixel
 * - Custom analytics endpoint
 */

import { analyticsLogger } from "./logger";

type EventName =
	| "page_view"
	| "cta_click"
	| "pricing_view"
	| "pricing_click"
	| "newsletter_signup"
	| "demo_request"
	| "contact_form_submit"
	| "scroll_depth"
	| "web_vital"
	| "section_view"
	/** North star: home → /sire; ver `docs/10-project-management/archive/landing-sire-funnel-kpi.md` */
	| "sire_funnel";

type EventProperties = Record<string, string | number | boolean>;

export interface AnalyticsEvent {
	name: EventName;
	timestamp: number;
	properties?: EventProperties;
	sessionId: string;
	pageUrl: string;
	referrer?: string;
}

export class AnalyticsService {
	private sessionId: string;
	private events: AnalyticsEvent[] = [];
	private isEnabled: boolean;

	constructor() {
		this.sessionId = this.generateSessionId();
		this.isEnabled = process.env.NODE_ENV === "production";
	}

	private generateSessionId(): string {
		return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
	}

	private getPageUrl(): string {
		if (typeof window === "undefined") return "";
		return window.location.href;
	}

	private getReferrer(): string | undefined {
		if (typeof window === "undefined") return undefined;
		return document.referrer || undefined;
	}

	track(eventName: EventName, properties?: EventProperties): void {
		const event: AnalyticsEvent = {
			name: eventName,
			timestamp: Date.now(),
			properties,
			sessionId: this.sessionId,
			pageUrl: this.getPageUrl(),
			referrer: this.getReferrer(),
		};

		this.events.push(event);

		// In production, send to analytics endpoint
		if (this.isEnabled) {
			this.sendToAnalytics(event);
		}

		if (process.env.NODE_ENV === "development") {
			analyticsLogger.debug(eventName, properties ?? "");
		}
	}

	private async sendToAnalytics(event: AnalyticsEvent): Promise<void> {
		try {
			// Same-origin Next route for event ingestion.
			await fetch("/api/analytics/track", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(event),
			});
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				analyticsLogger.warn("Failed to send event:", error);
			}
		}
	}

	// Convenience methods
	trackPageView(pageName: string): void {
		this.track("page_view", { page: pageName });
	}

	trackCtaClick(ctaId: string, location: string): void {
		this.track("cta_click", { ctaId, location });
	}

	/**
	 * Clics hacia el funnel SIRE (destino `/sire`). `placement` debe ser estable para BI
	 * y coincidir con las superficies instrumentadas que llaman a este método.
	 */
	trackSireFunnelClick(placement: string): void {
		this.track("sire_funnel", {
			action: "click_to_sire",
			placement,
			destination: "/sire",
		});
	}

	/**
	 * Enganche en el funnel: usuario llegó a `/sire` (p. ej. desde home o orgánico).
	 * Incluir `entry: "internal" | "direct"` si se puede inferir.
	 */
	trackSireFunnelLand(
		entry: "internal" | "direct" | "unknown" = "unknown",
	): void {
		this.track("sire_funnel", {
			action: "sire_landing",
			entry,
		});
	}

	trackPricingView(planId: string): void {
		this.track("pricing_view", { planId });
	}

	trackPricingClick(planId: string, location: string): void {
		this.track("pricing_click", { planId, location });
	}

	trackNewsletterSignup(email: string, source: string): void {
		this.track("newsletter_signup", {
			email: email.substring(0, 3) + "***",
			source,
		});
	}

	trackDemoRequest(plan: string): void {
		this.track("demo_request", { plan });
	}

	trackContactFormSubmit(source: string): void {
		this.track("contact_form_submit", { source });
	}

	trackScrollDepth(depth: number): void {
		// Only track at 25%, 50%, 75%, 100%
		if ([25, 50, 75, 100].includes(depth)) {
			this.track("scroll_depth", { depth });
		}
	}

	/** Core Web Vitals (LCP, INP, CLS, TTFB) — producción vía `/api/analytics/track`. */
	trackWebVital(metricName: string, value: number, rating: string): void {
		this.track("web_vital", {
			metric: metricName,
			value: Math.round(value * 100) / 100,
			rating,
		});
	}

	// Get events for debugging
	getEvents(): AnalyticsEvent[] {
		return [...this.events];
	}

	// Clear events (for testing)
	clearEvents(): void {
		this.events = [];
	}
}

// Singleton instance
export const analytics = new AnalyticsService();
