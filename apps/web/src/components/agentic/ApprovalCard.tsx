"use client";

import { motion } from "framer-motion";
import {
	CheckCircle2,
	Clock,
	FileCode,
	ShieldAlert,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
	type ApprovalRequest,
	useDiffApprovalStore,
} from "@/stores/diff-approval-store";

interface ApprovalCardProps {
	request: ApprovalRequest;
	onApprove?: (id: string) => void;
	onDeny?: (id: string) => void;
	onApproveOnce?: (id: string) => void;
	onApproveSession?: (id: string) => void;
}

const riskConfig = {
	low: {
		label: "Low Risk",
		bg: "bg-[var(--color-success)]/10",
		text: "text-[var(--color-success)]",
		border: "border-[var(--color-success)]/20",
	},
	medium: {
		label: "Medium Risk",
		bg: "bg-[var(--color-warning)]/10",
		text: "text-[var(--color-warning)]",
		border: "border-[var(--color-warning)]/20",
	},
	high: {
		label: "High Risk",
		bg: "bg-[var(--color-danger)]/10",
		text: "text-[var(--color-danger)]",
		border: "border-[var(--color-danger)]/20",
	},
};

const statusIcon = {
	pending: null,
	approved: CheckCircle2,
	denied: XCircle,
	"approved-once": CheckCircle2,
	"approved-session": CheckCircle2,
};

const statusText = {
	pending: "Awaiting approval",
	approved: "Approved",
	denied: "Denied",
	"approved-once": "Approved for this action",
	"approved-session": "Approved for session",
};

export function ApprovalCard({
	request,
	onApprove,
	onDeny,
	onApproveOnce,
	onApproveSession,
}: ApprovalCardProps) {
	const resolveApproval = useDiffApprovalStore((s) => s.resolveApproval);
	const isPending = request.status === "pending";
	const risk = riskConfig[request.riskLevel];
	const Icon = statusIcon[request.status];

	const handleApprove = useCallback(() => {
		resolveApproval(request.id, "approved");
		onApprove?.(request.id);
	}, [request.id, resolveApproval, onApprove]);

	const handleDeny = useCallback(() => {
		resolveApproval(request.id, "denied");
		onDeny?.(request.id);
	}, [request.id, resolveApproval, onDeny]);

	const handleApproveOnce = useCallback(() => {
		resolveApproval(request.id, "approved-once");
		onApproveOnce?.(request.id);
	}, [request.id, resolveApproval, onApproveOnce]);

	const handleApproveSession = useCallback(() => {
		resolveApproval(request.id, "approved-session");
		onApproveSession?.(request.id);
	}, [request.id, resolveApproval, onApproveSession]);

	useEffect(() => {
		if (!isPending) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Enter") {
				e.preventDefault();
				handleApprove();
			}
			if (e.key === "Escape") {
				e.preventDefault();
				handleDeny();
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [isPending, handleApprove, handleDeny]);

	const filesLabel = useMemo(() => {
		if (!request.filesChanged?.length) return null;
		if (request.filesChanged.length === 1) return "1 file";
		return `${request.filesChanged.length} files`;
	}, [request.filesChanged]);

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95, y: -4 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.95, y: -4 }}
			transition={{ duration: 0.2, ease: "easeOut" }}
			className={cn(
				"overflow-hidden rounded-xl border",
				"border-[var(--border-subtle)] bg-[var(--surface-1)]",
				"p-4",
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex min-w-0 flex-1 items-start gap-3">
					{request.riskLevel !== "low" && (
						<div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-warning)]/10">
							<ShieldAlert size={14} className="text-[var(--color-warning)]" />
						</div>
					)}
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<h4 className="truncate text-sm font-semibold text-[var(--text-primary)]">
								{request.action}
							</h4>
							<span
								className={cn(
									"inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-3xs font-medium",
									risk.bg,
									risk.text,
									risk.border,
								)}
							>
								{risk.label}
							</span>
						</div>
						<p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
							{request.description}
						</p>
					</div>
				</div>

				<span className="shrink-0 whitespace-nowrap text-3xs text-[var(--text-muted)]">
					{new Date(request.timestamp).toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
					})}
				</span>
			</div>

			{request.filesChanged && request.filesChanged.length > 0 && (
				<div className="mt-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-2.5">
					<div className="flex items-center gap-1.5 text-3xs font-medium text-[var(--text-muted)]">
						<FileCode size={11} />
						<span>{filesLabel}</span>
					</div>
					<ul className="mt-1.5 space-y-0.5">
						{request.filesChanged.map((file) => (
							<li
								key={file}
								className="flex items-center gap-1.5 font-mono text-3xs text-[var(--text-secondary)]"
							>
								<span className="h-1 w-1 rounded-full bg-[var(--text-muted)]" />
								{file}
							</li>
						))}
					</ul>
				</div>
			)}

			{isPending ? (
				<motion.div
					className="mt-4 flex items-center gap-2"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.1 }}
				>
					<motion.button
						whileTap={{ scale: 0.98 }}
						onClick={handleApprove}
						className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-primary)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
					>
						<CheckCircle2 size={13} />
						Allow
					</motion.button>

					<motion.button
						whileTap={{ scale: 0.98 }}
						onClick={handleApproveOnce}
						className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-3)]"
					>
						Allow Once
					</motion.button>

					<motion.button
						whileTap={{ scale: 0.98 }}
						onClick={handleApproveSession}
						className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-3)]"
					>
						Allow for Session
					</motion.button>

					<motion.button
						whileTap={{ scale: 0.98 }}
						onClick={handleDeny}
						className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)]"
					>
						<XCircle size={13} />
						Deny
					</motion.button>
				</motion.div>
			) : (
				<motion.div
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ type: "spring", stiffness: 400, damping: 20 }}
					className="mt-4 flex items-center gap-2"
				>
					{Icon && (
						<Icon
							size={16}
							className={
								request.status === "denied"
									? "text-[var(--color-danger)]"
									: "text-[var(--color-success)]"
							}
						/>
					)}
					<span
						className={cn(
							"text-xs font-medium",
							request.status === "denied"
								? "text-[var(--color-danger)]"
								: "text-[var(--color-success)]",
						)}
					>
						{statusText[request.status]}
					</span>
				</motion.div>
			)}

			<div className="mt-2 flex items-center gap-1.5 text-3xs text-[var(--text-muted)]">
				<Clock size={10} />
				<span>{new Date(request.timestamp).toLocaleString()}</span>
			</div>
		</motion.div>
	);
}

ApprovalCard.displayName = "ApprovalCard";
