import { useSettings } from "@/context/SettingsContext";

export const AppearancePreview = () => {
	const { settings } = useSettings();

	return (
		<div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl transition-all duration-500 group-hover:border-[var(--accent)]/20">
			{/* Simulated UI Background */}
			<div
				className="absolute inset-0 opacity-40 transition-opacity duration-700"
				style={{
					backgroundImage: settings.bgImage
						? `url(${settings.bgImage})`
						: "none",
					backgroundSize: "cover",
					backgroundPosition: "center",
					filter: settings.blur ? "blur(8px)" : "none",
				}}
			/>

			{/* Accent Glow */}
			<div
				className="absolute -left-10 -top-10 h-32 w-32 rounded-full blur-3xl transition-all duration-500"
				style={{ backgroundColor: "var(--accent, #c47f30)" }}
			/>

			{/* Mock UI Elements */}
			<div className="relative z-10 flex h-full flex-col p-4">
				<div className="flex items-center justify-between">
					<div className="flex gap-1.5">
						<div className="h-2 w-2 rounded-full bg-[var(--ink)]/20" />
						<div className="h-2 w-2 rounded-full bg-[var(--ink)]/10" />
						<div className="h-2 w-2 rounded-full bg-[var(--ink)]/10" />
					</div>
					<div className="h-4 w-12 rounded-full bg-[var(--ink)]/5 border border-[var(--border)]" />
				</div>

				<div className="mt-6 flex flex-1 gap-3">
					<div className="w-16 rounded-xl bg-[var(--ink)]/5 border border-[var(--border)] p-2 space-y-2">
						<div className="h-1.5 w-full rounded-full bg-[var(--ink)]/20" />
						<div className="h-1.5 w-full rounded-full bg-[var(--ink)]/10" />
						<div className="h-1.5 w-2/3 rounded-full bg-[var(--ink)]/10" />
					</div>
					<div className="flex-1 rounded-xl bg-[var(--ink)]/5 border border-[var(--border)] p-4 relative overflow-hidden">
						<div className="space-y-3">
							<div
								className="h-1 w-24 rounded-full transition-colors duration-300"
								style={{ backgroundColor: "var(--accent, #c47f30)" }}
							/>
							<div className="space-y-2">
								<div className="h-2 w-full rounded-full bg-[var(--ink)]/10" />
								<div className="h-2 w-full rounded-full bg-[var(--ink)]/10" />
								<div className="h-2 w-3/4 rounded-full bg-[var(--ink)]/10" />
							</div>
						</div>
					</div>
				</div>

				<div className="mt-3 h-8 w-full rounded-xl bg-[var(--ink)]/5 border border-[var(--border)] flex items-center px-3 gap-2">
					<div
						className="h-3 w-3 rounded-md shadow-sm transition-colors duration-300"
						style={{ backgroundColor: "var(--accent, #c47f30)" }}
					/>
					<div className="h-1.5 w-24 rounded-full bg-[var(--ink)]/20" />
				</div>
			</div>

			{/* Bottom Label */}
			<div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-[var(--surface)] to-transparent flex items-center justify-center">
				<span className="text-xs font-black uppercase tracking-[0.3em] text-[var(--ink)]/40">
					Real-time Engine Preview
				</span>
			</div>
		</div>
	);
};
