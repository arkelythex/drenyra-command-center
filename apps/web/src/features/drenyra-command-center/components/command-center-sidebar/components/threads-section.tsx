import { GitBranch } from "lucide-react";
import { useLocalStorageThreads } from "../use-local-storage-threads";

interface ThreadsSectionProps {
	companyId: string;
	t: (key: string) => string;
}

export function ThreadsSection({ companyId, t }: ThreadsSectionProps) {
	const threads = useLocalStorageThreads(companyId);
	return (
		<section
			className="space-y-2"
			role="region"
			aria-label={t("sidebar.threads")}
		>
			<p className="text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
				{t("sidebar.threads")}
			</p>
			{threads.length === 0 ? (
				<p className="px-1 text-2xs text-[var(--text-tertiary)]">
					{t("sidebar.threads.hint")}
				</p>
			) : (
				<div className="space-y-1">
					{threads.map((thread) => (
						<button
							key={thread.id}
							type="button"
							className="flex w-full items-center gap-2 rounded-xl border border-transparent p-3 text-left text-xs transition hover:bg-[var(--surface-1)]/60"
						>
							<GitBranch
								size={14}
								className="shrink-0 text-[var(--text-tertiary)]"
								aria-hidden="true"
							/>
							<span className="flex-1 truncate font-medium">{thread.name}</span>
						</button>
					))}
				</div>
			)}
		</section>
	);
}
