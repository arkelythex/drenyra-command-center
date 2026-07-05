import {
	Grid,
	List as ListIcon,
	Search,
	ShieldCheck,
	UploadCloud,
} from "lucide-react";
import { Text } from "@/components/atoms/text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn, n } from "@/lib/utils";

// --- Sub-componente Interno: Header (Aislado) ---
interface DocumentHeaderProps {
	companyName: string;
	searchQuery: string;
	setSearchQuery: (value: string) => void;
	viewMode: "grid" | "list";
	setViewMode: (mode: "grid" | "list") => void;
}

const DocumentHeader = ({
	companyName,
	searchQuery,
	setSearchQuery,
	viewMode,
	setViewMode,
}: DocumentHeaderProps) => {
	return (
		<header className="shrink-0 border-b border-border/50 bg-background px-4 py-4 sm:px-6 sm:py-5">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="flex items-center gap-3 sm:gap-4">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-[var(--surface-2)] sm:h-11 sm:w-11">
						<ShieldCheck
							size={18}
							className="text-muted-foreground"
							strokeWidth={1.75}
						/>
					</div>
					<div className="min-w-0">
						<h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
							Archivo central
						</h1>
						<div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
							<span className="rounded-md border border-border/60 bg-[var(--surface-2)] px-2 py-0.5 font-medium">
								Sustento 2026
							</span>
							<span className="truncate" title={companyName}>
								Empresa activa: {companyName}
							</span>
						</div>
					</div>
				</div>

				<div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
					<div className="relative flex-1 lg:w-80">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Buscar por serie, RUC o categoría"
							className="h-10 pl-10"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>

					<div className="flex items-center gap-2">
						<div className="inline-flex rounded-lg border border-border/60 bg-[var(--surface-2)] p-1">
							<Button
								variant="ghost"
								size="icon"
								aria-label="Vista de cuadrícula"
								className={cn(
									"h-8 w-8 rounded-md",
									viewMode === "grid"
										? "bg-foreground text-background hover:bg-foreground/90"
										: "text-muted-foreground hover:text-foreground",
								)}
								onClick={() => setViewMode("grid")}
							>
								<Grid size={14} strokeWidth={2.25} />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								aria-label="Vista de lista"
								className={cn(
									"h-8 w-8 rounded-md",
									viewMode === "list"
										? "bg-foreground text-background hover:bg-foreground/90"
										: "text-muted-foreground hover:text-foreground",
								)}
								onClick={() => setViewMode("list")}
							>
								<ListIcon size={14} strokeWidth={2.25} />
							</Button>
						</div>

						<Button className="h-10 rounded-lg px-4 text-xs font-semibold">
							<UploadCloud size={15} strokeWidth={2.5} className="mr-2" />
							Cargar
						</Button>
					</div>
				</div>
			</div>
		</header>
	);
};

export const DocumentsView = () => {
	const {
		documents,
		companyContext,
		viewMode,
		setViewMode,
		searchQuery,
		setSearchQuery,
	} = useDocuments();

	return (
		<div className="flex h-full flex-col overflow-hidden bg-background">
			<DocumentHeader
				companyName={companyContext.companyName}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				viewMode={viewMode}
				setViewMode={setViewMode}
			/>

			<div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6">
				<div className="mx-auto max-w-7xl space-y-3 pb-20">
					{documents.length > 0 ? (
						documents.map((doc) => (
							<Card
								key={doc.id}
								className="ui-deferred-section group flex cursor-pointer flex-col items-start justify-between gap-5 rounded-xl border border-border/50 bg-card px-4 py-4 transition-[background-color,border-color] duration-150 hover:border-border/75 hover:bg-muted/25 sm:flex-row sm:items-center"
							>
								<div className="flex items-start gap-4">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-[var(--surface-2)]">
										<ShieldCheck
											size={18}
											strokeWidth={1.6}
											className="text-muted-foreground"
										/>
									</div>
									<div>
										<Text
											variant="label"
											className="text-sm font-semibold tracking-tight text-foreground"
										>
											{doc.series}-{doc.name}
										</Text>
										<div className="mt-1.5 flex flex-wrap items-center gap-2.5">
											<span className="rounded-md border border-border/55 bg-[var(--surface-2)] px-2 py-0.5 text-label font-medium text-muted-foreground">
												{doc.category}
											</span>
											<span className="text-xs font-medium text-muted-foreground">
												{new Date(doc.date).toLocaleDateString()}
											</span>
											<span className="text-xs text-muted-foreground">
												{doc.ruc}
											</span>
										</div>
									</div>
								</div>

								<div className="flex w-full items-center justify-between gap-6 sm:w-auto sm:justify-end">
									<div className="text-right">
										<Text
											variant="data"
											className="text-xl font-semibold tracking-tight tabular-nums sm:text-2xl"
										>
											{n(doc.amount || 0)}
										</Text>
										<div className="mt-1 flex items-center justify-end gap-1.5">
											<div
												className={cn(
													"h-2 w-2 rounded-full",
													doc.hasCDR
														? "bg-[var(--premium-success)]"
														: "bg-amber-500",
												)}
											/>
											<span
												className={cn(
													"text-2xs font-medium",
													doc.hasCDR
														? "text-[var(--premium-success)]"
														: "text-amber-500",
												)}
											>
												{doc.hasCDR ? "Con CDR" : "Pendiente"}
											</span>
										</div>
									</div>
									<Button
										variant="ghost"
										size="icon"
										className="h-9 w-9 rounded-md text-muted-foreground opacity-0 transition-[background-color,color,opacity] group-hover:opacity-100 hover:text-foreground"
									>
										<ListIcon size={18} />
									</Button>
								</div>
							</Card>
						))
					) : (
						<div className="rounded-xl border border-dashed border-border/50 bg-card p-16 text-center">
							<div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-border/50 bg-[var(--surface-2)]">
								<ShieldCheck
									className="text-muted-foreground/50"
									size={32}
									strokeWidth={1.5}
								/>
							</div>
							<Text
								variant="label"
								className="block text-xs font-medium text-muted-foreground"
							>
								No se encontraron documentos
							</Text>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
