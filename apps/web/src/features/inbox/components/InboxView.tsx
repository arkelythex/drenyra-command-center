import {
	BrainCircuit,
	CheckCircle,
	Clock,
	Download,
	FileText,
	Loader2,
	Search,
	Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { MobileTabNavigation } from "@/components/layout/MobileTabNavigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	containerVariants,
	entranceVariants,
	MotionDiv,
} from "@/components/ui/motion-primitives";
import { captureError, trackEvent } from "@/lib/monitoring";
import { cn, n } from "@/lib/utils";
import { useInbox } from "../hooks/useInbox";

type InboxFilter = "all" | "pending" | "processed";

const INBOX_FILTER_TABS: ReadonlyArray<{ id: InboxFilter; label: string }> = [
	{ id: "all", label: "Todos" },
	{ id: "pending", label: "Pendientes" },
	{ id: "processed", label: "Procesados" },
];

function isInboxFilter(value: string): value is InboxFilter {
	return value === "all" || value === "pending" || value === "processed";
}

export const InboxView = () => {
	const {
		filteredTransactions,
		searchQuery,
		setSearchQuery,
		uploadFile,
		refresh,
		loading,
	} = useInbox();
	const [selectedFilter, setSelectedFilter] = useState<InboxFilter>("all");
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const _handleFileUpload = async (file: File) => {
		setIsUploading(true);
		try {
			const res = await uploadFile(file);
			if (res.success) {
				trackEvent("inbox_upload_succeeded", {
					file_name: file.name,
					file_size_bytes: file.size,
					file_type: file.type || "unknown",
				});
			} else {
				alert(res.error || "Upload failed");
			}
		} catch (error) {
			captureError(
				error instanceof Error ? error : new Error("Inbox upload failed"),
				{
					fileName: file.name,
					source: "features/inbox/InboxView.handleFileUpload",
				},
			);
		} finally {
			setIsUploading(false);
			// Reset input
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const handleUploadClick = () => {
		fileInputRef.current?.click();
	};

	return (
		<div className="flex flex-col flex-1 bg-background text-foreground overflow-hidden font-sans relative">
			{/* Pull to Refresh Indicator */}
			{loading && (
				<div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-primary/90 text-primary-foreground px-4 py-2 rounded-full text-sm font-medium animate-bounce shadow-lg">
					🔄 Actualizando...
				</div>
			)}

			{/* 📱 MOBILE: Floating Filter Tabs (Pushed to the Right) */}
			<MobileTabNavigation
				tabs={INBOX_FILTER_TABS}
				activeTab={selectedFilter}
				onTabChange={(id) => {
					if (isInboxFilter(id)) {
						setSelectedFilter(id);
					}
				}}
				className="left-auto right-4 top-4"
			/>

			{/* Filters: Compact Glass */}
			<div className="relative z-40 mt-14 flex flex-col items-center gap-6 border-b border-border/50 bg-[var(--bg-1)] px-6 py-4 sm:mt-0 sm:flex-row">
				<div className="flex gap-2 w-full max-w-sm items-center">
					<div className="relative group flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground group-focus-within:text-foreground transition-colors" />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="BUSCAR DOCUMENTOS..."
							className="ui-search-input w-full h-10 rounded-xl pl-10 text-label font-bold uppercase tracking-wider transition-all"
						/>
					</div>

					{/* Mobile Actions: Inline with Search */}
					<div className="flex sm:hidden gap-2 items-center">
						<a
							href="/assets/sample-invoice.xml"
							download
							className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/30 border border-border/50 text-foreground hover:bg-background transition-all"
						>
							<Download size={16} />
						</a>
						<button
							onClick={handleUploadClick}
							disabled={isUploading}
							className="h-10 w-10 flex items-center justify-center rounded-xl bg-foreground text-background shadow-sm hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
						>
							{isUploading ? (
								<Loader2 size={16} className="animate-spin" />
							) : (
								<Upload size={16} strokeWidth={2} />
							)}
						</button>
					</div>
				</div>

				<div className="hidden sm:flex gap-1 bg-muted/30 p-1 rounded-xl border border-border/50 w-full sm:w-auto justify-center">
					{INBOX_FILTER_TABS.map((filter) => (
						<button
							key={filter.id}
							onClick={() => setSelectedFilter(filter.id)}
							className={cn(
								"px-5 h-8 text-xs font-black uppercase tracking-widest rounded-lg transition-all duration-300 relative overflow-hidden",
								selectedFilter === filter.id
									? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
									: "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
							)}
						>
							{filter.label}
						</button>
					))}
				</div>
			</div>

			{/* Document List */}
			<div className="flex-1 overflow-auto p-6 lg:p-10 custom-scrollbar bg-background">
				<MotionDiv
					variants={containerVariants}
					initial="hidden"
					animate="visible"
					className="max-w-[1600px] 2xl:max-w-[1920px] mx-auto space-y-6 pb-20"
				>
					<div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
						{filteredTransactions.map((doc) => (
							<MotionDiv
								key={doc.id}
								variants={entranceVariants}
								className="group relative"
							>
								<Card className="group h-full overflow-hidden rounded-3xl border-border/50 bg-card p-0 transition-[border-color,box-shadow] duration-300 hover:border-[rgba(var(--premium-info-rgb),0.20)] hover:shadow-[0_0_24px_rgba(var(--premium-info-rgb),0.10)]">
									<div className="flex flex-col sm:flex-row h-full">
										{/* Left: Icon & Status */}
										<div className="p-6 sm:p-8 flex flex-col justify-between items-start gap-6 border-b sm:border-b-0 sm:border-r border-border/50 bg-muted/10 w-full sm:w-auto sm:min-w-[200px]">
											<div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-background to-muted border border-border/50 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
												<FileText
													size={24}
													className="text-muted-foreground group-hover:text-foreground transition-colors"
													strokeWidth={1.5}
												/>
											</div>
											<div className="flex flex-col gap-2">
												<div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
													<Clock size={10} /> {doc.date}
												</div>
												<span
													className={cn(
														"status-badge w-fit px-3 py-1 text-xs font-black uppercase shadow-sm",
														doc.status === "confirmed" ||
															doc.status === "closed"
															? "status-badge-success"
															: "status-badge-warning",
													)}
												>
													{doc.status === "confirmed" || doc.status === "closed"
														? "Procesado"
														: "Pendiente"}
												</span>
											</div>
										</div>

										{/* Right: Content & Action */}
										<div className="p-6 sm:p-8 flex-1 flex flex-col justify-between gap-6">
											<div className="flex justify-between items-start gap-4">
												<div className="space-y-2">
													<h3 className="text-sm font-black uppercase tracking-tight text-foreground/90 group-hover:text-[var(--premium-action-cyan)] transition-colors">
														{doc.vendor}
													</h3>
													<p className="text-label font-medium text-muted-foreground uppercase tracking-wide">
														{doc.documentName
															? `Documento: ${doc.documentName}`
															: `ID: #TRX-${doc.id.substring(0, 8)}`}
													</p>
												</div>
												<span className="font-black font-mono text-xl tracking-tighter tabular-nums text-foreground">
													{n(doc.amount)}
												</span>
											</div>

											<div className="flex items-center justify-end gap-3">
												<Button
													variant="outline"
													onClick={() =>
														alert(
															"Generando Vista Previa del PDF desde el XML...\n\nProveedor: " +
																doc.vendor +
																"\nMonto: S/ " +
																doc.amount,
														)
													}
													className="h-9 px-4 rounded-xl text-label font-black uppercase tracking-widest border-border/50 hover:bg-muted transition-all flex items-center gap-2"
												>
													<FileText size={14} /> Ver PDF
												</Button>
												<div className="w-full sm:w-auto">
													{doc.status === "confirmed" ||
													doc.status === "closed" ? (
														<div className="status-badge status-badge-success flex items-center gap-2 px-4 py-2 text-label font-black uppercase">
															<CheckCircle size={14} strokeWidth={2.5} />{" "}
															Sincronizado
														</div>
													) : (
														<Button
															variant="ghost"
															className="w-full sm:w-auto relative overflow-hidden group/btn bg-foreground text-background hover:bg-foreground/90 h-9 rounded-xl text-label font-black uppercase tracking-widest shadow-lg shadow-[0_0_24px_rgba(var(--premium-info-rgb),0.20)]"
														>
															<div className="absolute inset-0 bg-gradient-to-r from-[var(--premium-action-cyan)] to-[var(--premium-action-blue)] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
															<span className="relative z-10 flex items-center gap-2">
																<BrainCircuit size={14} /> Procesar con IA
															</span>
														</Button>
													)}
												</div>
											</div>
										</div>
									</div>
								</Card>
							</MotionDiv>
						))}
					</div>
				</MotionDiv>
			</div>
		</div>
	);
};
