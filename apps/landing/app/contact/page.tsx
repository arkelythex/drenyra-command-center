import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin } from "lucide-react";

import { siteConfig } from "@/lib/seo/config";

export const metadata: Metadata = {
	title: "Contact | Arkelythex",
	description:
		"Contact Arkelythex for product, support, privacy, legal, and service inquiries.",
	alternates: { canonical: "/contact" },
};

export default function ContactPage() {
	return (
		<main className="min-h-screen bg-background text-foreground">
			<section className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-24 md:py-32" aria-label="Contacto">
				<header className="space-y-4 border-b border-foreground/10 pb-8">
					<p className="text-xs font-black uppercase tracking-[0.28em] text-muted-foreground">
						Legal and product contact
					</p>
					<h1 className="text-balance text-4xl font-black tracking-[-0.05em] md:text-6xl">
						Contact Arkelythex
					</h1>
					<p className="text-base leading-7 text-muted-foreground md:text-lg">
						Use this channel for product questions, privacy requests, legal
						notices, beta access, and service-related inquiries.
					</p>
				</header>

				<div className="grid gap-4 md:grid-cols-2">
					<a
						href={`mailto:${siteConfig.contactEmail}`}
						className="rounded-3xl border border-foreground/10 bg-foreground/[0.03] p-6 transition hover:border-foreground/25 hover:bg-foreground/[0.06]"
					>
						<Mail className="mb-5 h-5 w-5 text-foreground" aria-hidden />
						<h2 className="text-lg font-black tracking-[-0.03em]">Email</h2>
						<p className="mt-2 text-sm leading-7 text-muted-foreground">
							{siteConfig.contactEmail}
						</p>
					</a>

					<div className="rounded-3xl border border-foreground/10 bg-foreground/[0.03] p-6">
						<MapPin className="mb-5 h-5 w-5 text-foreground" aria-hidden />
						<h2 className="text-lg font-black tracking-[-0.03em]">Location</h2>
						<address className="mt-2 text-sm not-italic leading-7 text-muted-foreground">
							Lima, Peru
						</address>
					</div>
				</div>

				<section className="rounded-3xl border border-foreground/10 bg-foreground/[0.03] p-6 text-sm leading-7 text-muted-foreground" aria-label="Solicitudes de privacidad">
					<h2 className="text-lg font-black tracking-[-0.03em] text-foreground">
						Privacy and data requests
					</h2>
					<p className="mt-3">
						For access, correction, cancellation, opposition, or revocation of
						consent requests regarding personal data, contact us by email with
						the subject “Privacy request”.
					</p>
				</section>

				<Link href="/" className="text-sm font-bold uppercase tracking-[0.18em] text-foreground underline">
					Back to Arkelythex
				</Link>
			</section>
		</main>
	);
}
