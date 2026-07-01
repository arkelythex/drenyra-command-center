import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useRef, useState } from "react";

interface ClientSummary {
	id: string;
	name: string;
	ruc: string;
	status: string;
	healthScore: number | null;
	pendingItems: number;
}

interface ClientListResponse {
	clients: ClientSummary[];
	total: number;
}

async function fetchClients(
	search: string,
	status: string,
	limit: number,
	offset: number,
): Promise<ClientListResponse> {
	const params = new URLSearchParams();
	if (search) params.set("search", search);
	if (status) params.set("status", status);
	params.set("limit", String(limit));
	params.set("offset", String(offset));

	const res = await fetch(`/api/firm/clients?${params.toString()}`, {
		credentials: "include",
	});
	const json = await res.json();
	if (!json.success) throw new Error(json.error ?? "Failed to load clients");
	return json.data;
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
	ACTIVE: { bg: "var(--color-success)", text: "var(--color-success)" },
	SUSPENDED: { bg: "var(--color-warning)", text: "var(--color-warning)" },
	INACTIVE: { bg: "var(--text-tertiary)", text: "var(--text-tertiary)" },
};

const STATUS_LABELS: Record<string, string> = {
	ACTIVE: "Activo",
	SUSPENDED: "Suspendido",
	INACTIVE: "Inactivo",
};

const PAGE_SIZE = 20;

export function ClientList() {
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [status, setStatus] = useState("");
	const [offset, setOffset] = useState(0);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["firm", "clients", debouncedSearch, status, offset],
		queryFn: () => fetchClients(debouncedSearch, status, PAGE_SIZE, offset),
	});

	function handleSearchChange(value: string) {
		setSearch(value);
		setOffset(0);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300);
	}

	function handleStatusChange(value: string) {
		setStatus(value);
		setOffset(0);
	}

	return (
		<div className="space-y-6">
			<header>
				<h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
					Clientes
				</h1>
				<p className="text-xs text-[var(--text-tertiary)] mt-1">
					Gestiona los clientes de tu firma
				</p>
			</header>

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="relative flex-1 max-w-xs">
					<Search
						size={14}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
					/>
					<input
						type="text"
						placeholder="Buscar por nombre o RUC..."
						value={search}
						onChange={(e) => handleSearchChange(e.target.value)}
						className="w-full h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] pl-9 pr-3 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
					/>
				</div>

				<select
					aria-label="Filtrar por estado"
					value={status}
					onChange={(e) => handleStatusChange(e.target.value)}
					className="h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5 text-2xs font-bold text-[var(--text-primary)] outline-none"
				>
					<option value="">Todos los estados</option>
					<option value="ACTIVE">Activo</option>
					<option value="SUSPENDED">Suspendido</option>
					<option value="INACTIVE">Inactivo</option>
				</select>
			</div>

			{isLoading && (
				<div className="flex items-center justify-center py-12">
					<p className="text-xs text-[var(--text-tertiary)]">
						Cargando clientes...
					</p>
				</div>
			)}

			{isError && (
				<div className="flex items-center justify-center py-12">
					<div className="text-center space-y-2">
						<AlertTriangle
							size={24}
							className="mx-auto text-[var(--color-danger)]"
						/>
						<p className="text-xs font-bold text-[var(--color-danger)]">
							Error al cargar clientes
						</p>
						<p className="text-2xs text-[var(--text-tertiary)]">
							{error instanceof Error ? error.message : "Intente nuevamente"}
						</p>
					</div>
				</div>
			)}

			{data && data.clients.length === 0 && (
				<div className="flex items-center justify-center py-12">
					<p className="text-xs text-[var(--text-tertiary)]">
						No se encontraron clientes
					</p>
				</div>
			)}

			{data && data.clients.length > 0 && (
				<>
					<div className="rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
						<table className="w-full">
							<thead>
								<tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-2)]">
									<th className="text-left px-4 py-3 text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
										Nombre
									</th>
									<th className="text-left px-4 py-3 text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
										RUC
									</th>
									<th className="text-left px-4 py-3 text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
										Estado
									</th>
									<th className="text-left px-4 py-3 text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
										Health Score
									</th>
									<th className="text-left px-4 py-3 text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
										Pendientes
									</th>
								</tr>
							</thead>
							<tbody>
								{data.clients.map((client) => {
									const statusStyle =
										STATUS_STYLES[client.status] ?? STATUS_STYLES.ACTIVE;
									return (
										<tr
											key={client.id}
											className="border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
											onClick={() => {
												window.location.href = `/firm/clients/${client.id}`;
											}}
										>
											<td className="px-4 py-3">
												<span className="text-xs font-bold text-[var(--color-primary)] hover:underline">
													{client.name}
												</span>
											</td>
											<td className="px-4 py-3 text-xs text-[var(--text-secondary)] font-mono">
												{client.ruc}
											</td>
											<td className="px-4 py-3">
												<span
													className="inline-block rounded-full px-2 py-0.5 text-2xs font-bold"
													style={{
														backgroundColor: `${statusStyle.bg}20`,
														color: statusStyle.text,
													}}
												>
													{STATUS_LABELS[client.status] ?? client.status}
												</span>
											</td>
											<td className="px-4 py-3">
												<span
													className="text-xs font-bold tabular-nums"
													style={{
														color:
															client.healthScore !== null &&
															client.healthScore >= 70
																? "var(--color-success)"
																: client.healthScore !== null &&
																		client.healthScore >= 40
																	? "var(--color-warning)"
																	: "var(--color-danger)",
													}}
												>
													{client.healthScore ?? "—"}
												</span>
											</td>
											<td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
												{client.pendingItems}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					<div className="flex items-center justify-between">
						<p className="text-2xs text-[var(--text-tertiary)]">
							{offset + 1}–{Math.min(offset + PAGE_SIZE, data.total)} de{" "}
							{data.total}
						</p>
						<div className="flex items-center gap-2">
							<button
								type="button"
								disabled={offset === 0}
								onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
								className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-2xs font-bold text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--surface-2)] transition-colors"
							>
								<ChevronLeft size={14} />
								Anterior
							</button>
							<button
								type="button"
								disabled={offset + PAGE_SIZE >= data.total}
								onClick={() => setOffset(offset + PAGE_SIZE)}
								className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-2xs font-bold text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--surface-2)] transition-colors"
							>
								Siguiente
								<ChevronRight size={14} />
							</button>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
