import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getUserDisplayName, getUserRole } from "@/lib/api";
import type { PolicyApprovalProof } from "../types/artifact.types";
import type { PolicyGateRequest, PolicyGateResult } from "./types";

interface PendingApproval {
	request: PolicyGateRequest;
	resolve: (result: PolicyGateResult) => void;
}

interface PolicyGateContextValue {
	requestApproval: (request: PolicyGateRequest) => Promise<PolicyGateResult>;
}

const PolicyGateContext = createContext<PolicyGateContextValue | null>(null);

export function PolicyGateProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [pending, setPending] = useState<PendingApproval | null>(null);
	const [requester, setRequester] = useState(buildRequesterIdentity());
	const [reason, setReason] = useState("");
	const [approver, setApprover] = useState("");
	const [error, setError] = useState<string | null>(null);

	const requestApproval = useCallback(
		(request: PolicyGateRequest): Promise<PolicyGateResult> => {
			return new Promise((resolve) => {
				setError(null);
				setRequester(buildRequesterIdentity());
				setReason("");
				setApprover("");
				setPending({ request, resolve });
			});
		},
		[],
	);

	const closeAsCancelled = useCallback(() => {
		if (!pending) return;
		pending.resolve({
			allowed: false,
			reason: "Solicitud cancelada por usuario.",
		});
		setPending(null);
		setError(null);
	}, [pending]);

	const handleApprove = useCallback(() => {
		if (!pending) return;

		const gate = pending.request.policyGate;
		const normalizedRequester = requester.trim();
		const normalizedApprover = approver.trim();
		const normalizedReason = reason.trim();

		if (!normalizedRequester) {
			setError("Solicitante es obligatorio.");
			return;
		}

		if (gate?.requiresReason && normalizedReason.length < 8) {
			setError("Motivo obligatorio (minimo 8 caracteres).");
			return;
		}

		if (gate?.requiresDualApproval) {
			if (!normalizedApprover) {
				setError("Aprobador secundario es obligatorio.");
				return;
			}

			if (
				normalizedApprover.toLowerCase() === normalizedRequester.toLowerCase()
			) {
				setError("Solicitante y aprobador deben ser distintos.");
				return;
			}
		}

		const proof: PolicyApprovalProof = {
			controlId: [
				"pg",
				pending.request.actionId,
				Date.now().toString(36),
				Math.random().toString(36).slice(2, 7),
			].join("_"),
			approvedAt: new Date().toISOString(),
			requester: normalizedRequester,
			approver: normalizedApprover || undefined,
			reason: normalizedReason || "N/A",
		};

		pending.resolve({ allowed: true, proof });
		setPending(null);
		setError(null);
	}, [approver, pending, reason, requester]);

	const value = useMemo<PolicyGateContextValue>(
		() => ({ requestApproval }),
		[requestApproval],
	);

	return (
		<PolicyGateContext.Provider value={value}>
			{children}

			<Dialog
				open={Boolean(pending)}
				onOpenChange={(open) => !open && closeAsCancelled()}
			>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle className="text-base font-black uppercase tracking-widest">
							Policy Gate
						</DialogTitle>
						<DialogDescription>
							Confirma accion critica con trazabilidad completa (doble firma
							cuando aplique).
						</DialogDescription>
					</DialogHeader>

					{pending ? (
						<div className="space-y-3">
							<div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-label uppercase tracking-wider text-muted-foreground">
								Accion:{" "}
								<span className="font-mono text-foreground">
									{pending.request.actionLabel}
								</span>
							</div>
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
								<MetaPill label="Riesgo" value={pending.request.riskLevel} />
								<MetaPill label="Trace" value={pending.request.traceId} mono />
								<MetaPill
									label="Policy"
									value={pending.request.policyGate?.policyKey ?? "N/A"}
									mono
								/>
								<MetaPill
									label="Control"
									value={
										pending.request.policyGate?.requiresDualApproval
											? "DOBLE_FIRMA"
											: "FIRMA_UNICA"
									}
									mono
								/>
							</div>

							<div className="space-y-1">
								<label className="text-label font-semibold uppercase tracking-wider text-muted-foreground">
									Solicitante
								</label>
								<Input
									value={requester}
									onChange={(event) => setRequester(event.target.value)}
									placeholder="usuario.solicitante"
								/>
							</div>

							<div className="space-y-1">
								<label className="text-label font-semibold uppercase tracking-wider text-muted-foreground">
									Motivo{" "}
									{pending.request.policyGate?.requiresReason
										? "(obligatorio)"
										: "(opcional)"}
								</label>
								<Input
									value={reason}
									onChange={(event) => setReason(event.target.value)}
									placeholder="Justificacion operativa/compliance"
								/>
							</div>

							{pending.request.policyGate?.requiresDualApproval ? (
								<div className="space-y-1">
									<label className="text-label font-semibold uppercase tracking-wider text-muted-foreground">
										Aprobador Secundario
									</label>
									<Input
										value={approver}
										onChange={(event) => setApprover(event.target.value)}
										placeholder="usuario.aprobador"
									/>
								</div>
							) : null}

							{error ? (
								<div className="rounded-lg border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
									{error}
								</div>
							) : null}
						</div>
					) : null}

					<DialogFooter>
						<Button variant="outline" onClick={closeAsCancelled}>
							Cancelar
						</Button>
						<Button onClick={handleApprove}>Aprobar</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</PolicyGateContext.Provider>
	);
}

function MetaPill({
	label,
	value,
	mono = false,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-label uppercase tracking-wider text-muted-foreground">
			{label}:{" "}
			<span className={mono ? "font-mono text-foreground" : "text-foreground"}>
				{value}
			</span>
		</div>
	);
}

function buildRequesterIdentity(): string {
	const role = getUserRole().toUpperCase();
	return `${getUserDisplayName()} (${role})`;
}

export function usePolicyGate(): PolicyGateContextValue {
	const context = useContext(PolicyGateContext);
	if (!context) {
		throw new Error("usePolicyGate must be used within PolicyGateProvider");
	}
	return context;
}
