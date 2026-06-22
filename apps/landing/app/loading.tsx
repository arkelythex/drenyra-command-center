export default function Loading() {
	return (
		<main
			className="flex min-h-screen flex-col bg-background"
			role="status"
			aria-live="polite"
			aria-busy="true"
		>
			{/* Screen reader-only initial announcement */}
			<span className="sr-only">Cargando página…</span>

			{/* ── Navbar skeleton ── */}
			<header className="landing-nav-fixed-outer fixed inset-x-0 top-0 z-50">
				<nav
					className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl border border-border bg-background/80 px-5 backdrop-blur-xl"
					aria-label="Navegación (esqueleto)"
				>
					<div className="skeleton-block h-5 w-24" />
					<div className="hidden items-center gap-6 md:flex">
						{[...Array(4)].map((_, i) => (
							<div key={i} className="skeleton-block h-3 w-16" />
						))}
					</div>
					<div className="skeleton-block h-8 w-24 rounded-full" />
				</nav>
			</header>

			{/* ── Hero skeleton ── */}
			<section
				className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden border-b border-border px-6"
				aria-label="Hero (esqueleto)"
			>
				{/* Subtle grid background */}
				<div
					className="pointer-events-none absolute inset-0 opacity-[0.03]"
					style={{
						backgroundImage:
							"linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
						backgroundSize: "72px 72px",
					}}
				/>

				<div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center text-center">
					{/* Brand mark placeholder */}
					<div className="skeleton-block--shimmer mb-10 h-14 w-14 rounded-xl" />

					{/* Eyebrow */}
					<div className="skeleton-block mb-6 h-3 w-32 rounded-full" />

					{/* Title */}
					<div className="skeleton-block--shimmer mb-4 h-20 w-[clamp(16rem,60vw,40rem)] rounded-lg" />

					{/* Subtitle */}
					<div className="mx-auto mb-10 flex w-full max-w-lg flex-col items-center gap-2">
						<div className="skeleton-block h-4 w-full rounded-full" />
						<div className="skeleton-block h-4 w-3/4 rounded-full" />
					</div>

					{/* CTA buttons */}
					<div className="flex items-center gap-4">
						<div className="skeleton-block--shimmer h-12 w-36 rounded-full" />
						<div className="skeleton-block h-12 w-28 rounded-full" />
					</div>
				</div>

				{/* Scroll cue placeholder */}
				<div className="absolute bottom-8 left-1/2 -translate-x-1/2">
					<div className="skeleton-block h-8 w-5 rounded-full" />
				</div>
			</section>

			{/* ── Stats / Mission skeleton ── */}
			<section className="py-32 md:py-40" aria-label="Misión (esqueleto)">
				<div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-10">
					<div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3">
						<div className="skeleton-block--shimmer h-4 w-12 rounded-full" />
						<div className="skeleton-block--shimmer h-16 w-full rounded-lg" />
						<div className="skeleton-block--shimmer h-16 w-11/12 rounded-lg" />
					</div>
				</div>
			</section>

			{/* ── Products grid skeleton ── */}
			<section className="border-t border-border py-24 md:py-32" aria-label="Productos (esqueleto)">
				<div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-10">
					<div className="skeleton-block mb-12 h-3 w-20 rounded-full" />
					<div className="grid gap-8 md:grid-cols-3">
						{[...Array(3)].map((_, i) => (
							<div
								key={i}
								className="skeleton-block--shimmer flex flex-col gap-4 rounded-xl p-8"
								style={{ animationDelay: `${i * 0.15}s` }}
							>
								<div className="skeleton-block h-4 w-24 rounded-full" />
								<div className="skeleton-block h-3 w-full rounded-full" />
								<div className="skeleton-block h-3 w-3/4 rounded-full" />
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ── Footer skeleton ── */}
			<footer className="border-t border-border" aria-label="Pie de página (esqueleto)">
				<div className="mx-auto max-w-6xl px-6 py-12 sm:px-8 lg:px-10">
					<div className="flex flex-col items-center justify-between gap-6 md:flex-row">
						<div className="skeleton-block h-4 w-32 rounded-full" />
						<div className="flex gap-6">
							{[...Array(4)].map((_, i) => (
								<div key={i} className="skeleton-block h-3 w-12 rounded-full" />
							))}
						</div>
					</div>
				</div>
			</footer>

			{/* Screen reader update on completion */}
			<span className="sr-only" role="status" aria-live="polite">
				Cargando contenido principal…
			</span>
		</main>
	);
}
