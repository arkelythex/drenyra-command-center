import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, FileText, Sparkles, Upload } from "lucide-react";
import { Text } from "@/components/atoms/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SurfacePanel } from "@/components/ui/SurfacePanel";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { cn, n } from "@/lib/utils";
import { dashboardRecentDocumentsQueryOptions } from "../../dashboard.query-options";

export const ProcessedDocumentsWidget = () => {
	const {
		companyContext: { companyId },
	} = useActiveCompanyContext();

	const { data: documents = [], isLoading: loading } = useQuery(
		dashboardRecentDocumentsQueryOptions(companyId, 3),
	);

	return (
		<SurfacePanel padding="lg">
			<div className="relative z-10 mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<div className="flex items-center gap-5">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl border border-info-subtle bg-info-subtle shadow-sm">
						<FileText size={22} className="text-info" />
					</div>
					<div className="space-y-1">
						<Text
							variant="hero"
							className="text-xl lowercase first-letter:uppercase"
						>
							Documentos Procesados
						</Text>
						<div className="flex items-center gap-2">
							<Sparkles size={12} className="text-info" />
							<Text
								variant="label"
								className="text-3xs tracking-[0.15em] text-[var(--text-tertiary)]"
							>
								Motor de extracción cognitivo v2
							</Text>
						</div>
					</div>
				</div>
				<Button
					variant="glass"
					size="sm"
					className="group h-9 overflow-hidden rounded-xl border-border/50 px-5 shadow-sm"
					onClick={() => (window.location.href = "/inbox")}
				>
					<Upload
						size={14}
						className="mr-2 transition-transform duration-200 group-hover:-translate-y-0.5"
					/>
					<Text
						variant="label"
						className="text-2xs lowercase first-letter:uppercase text-inherit"
					>
						Gestionar Inbox
					</Text>
				</Button>
			</div>

			{loading ? (
				<div className="flex items-center justify-center py-20">
					<div className="h-10 w-10 animate-spin rounded-full border-b-2 border-info" />
				</div>
			) : documents.length === 0 ? (
				<div className="rounded-2xl border-2 border-dashed border-border/40 bg-[var(--surface-1)]/68 py-20 text-center">
					<FileText
						size={40}
						className="mx-auto mb-4 text-muted-foreground/50"
					/>
					<Text variant="body" className="mb-1 block text-muted-foreground">
						Esperando Documentos
					</Text>
					<Text variant="label" className="text-2xs text-muted-foreground/80">
						La IA procesará tus archivos en milisegundos
					</Text>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					{documents.map((doc) => (
						<div
							key={doc.id}
							className="group/item relative flex items-center justify-between overflow-hidden rounded-xl border border-border/40 bg-[var(--surface-1)]/78 p-4 transition-[background-color,border-color] duration-200 hover:border-info-subtle hover:bg-[var(--surface-2)]/84"
						>
							<div className="relative z-10 flex items-center gap-4">
								<div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)]/62">
									<CheckCircle2
										size={16}
										className={cn(
											"transition-colors duration-200",
											doc.status === "processed"
												? "text-success"
												: "text-warning",
										)}
									/>
								</div>

								<div className="min-w-0 space-y-1.5">
									<Text
										variant="body"
										className="block max-w-[170px] truncate text-sm font-bold text-foreground transition-colors duration-200 group-hover/item:text-info"
									>
										{doc.name}
									</Text>
									<div className="flex items-center gap-2">
										<Badge
											variant="outline"
											className="border-border/50 bg-[var(--surface-2)]/60 text-[8px] text-muted-foreground"
										>
											{doc.type}
										</Badge>
										<Text
											variant="data"
											className="text-2xs tracking-wider text-muted-foreground"
										>
											{doc.ruc}
										</Text>
									</div>
								</div>
							</div>

							<div className="relative z-10 flex flex-col items-end gap-1.5 text-right">
								<div className="flex items-baseline gap-1">
									{doc.displayMode !== "count" && (
										<Text
											variant="label"
											className="text-3xs font-black text-muted-foreground"
										>
											S/
										</Text>
									)}
									<Text
										variant="data"
										className="text-[15px] font-black tracking-tighter text-foreground"
									>
										{n(doc.amount ?? 0)}
									</Text>
									{doc.displayMode === "count" && (
										<Text
											variant="label"
											className="ml-0.5 text-3xs text-muted-foreground"
										>
											DOCS
										</Text>
									)}
								</div>

								<Badge
									variant="outline"
									className={cn(
										"border-transparent bg-transparent py-0 text-3xs lowercase first-letter:uppercase",
										doc.extractionMethod === "ai"
											? "text-info"
											: "text-success",
									)}
								>
									{doc.extractionMethod === "ai" ? "agente ia" : "validado"}
								</Badge>
							</div>
						</div>
					))}
				</div>
			)}
		</SurfacePanel>
	);
};
