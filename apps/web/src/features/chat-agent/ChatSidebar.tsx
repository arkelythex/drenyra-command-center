import { useState } from "react";
import { type Thread, threadStore } from "./thread-store";

interface SidebarProps {
	activeThreadId: string;
	onSelectThread: (id: string) => void;
	onNewThread: () => void;
}

type Section = "threads" | "skills" | "automations" | "settings";

export function ChatSidebar({
	activeThreadId,
	onSelectThread,
	onNewThread,
}: SidebarProps) {
	const [collapsed, setCollapsed] = useState(false);
	const [section, setSection] = useState<Section>("threads");
	const [showProjects, setShowProjects] = useState(true);

	if (collapsed) {
		return (
			<aside
				className="flex flex-col items-center py-3 border-r"
				style={{
					width: 48,
					borderColor: "var(--border)",
					backgroundColor: "var(--surface-2)",
				}}
			>
				<SidebarIcon
					icon="💬"
					label="Threads"
					active={section === "threads"}
					onClick={() => setSection("threads")}
				/>
				<SidebarIcon
					icon="🧩"
					label="Skills"
					active={section === "skills"}
					onClick={() => setSection("skills")}
				/>
				<SidebarIcon
					icon="⚡"
					label="Automations"
					active={section === "automations"}
					onClick={() => setSection("automations")}
				/>
				<SidebarIcon
					icon="⚙"
					label="Settings"
					active={section === "settings"}
					onClick={() => setSection("settings")}
				/>
				<div className="flex-1" />
				<button
					type="button"
					onClick={() => setCollapsed(false)}
					className="text-xs p-2"
					style={{ color: "var(--text-secondary)" }}
				>
					→
				</button>
			</aside>
		);
	}

	return (
		<aside
			className="flex flex-col border-r"
			style={{
				width: 260,
				borderColor: "var(--border)",
				backgroundColor: "var(--surface-2)",
			}}
		>
			{/* Header */}
			<div
				className="flex items-center justify-between px-3 py-3 border-b"
				style={{ borderColor: "var(--border)" }}
			>
				<span
					className="text-sm font-semibold"
					style={{ color: "var(--text-primary)" }}
				>
					Drenyra
				</span>
				<button
					type="button"
					onClick={() => setCollapsed(true)}
					className="text-xs"
					style={{ color: "var(--text-secondary)" }}
				>
					←
				</button>
			</div>

			{/* Search */}
			<div className="px-3 py-2">
				<div
					className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs"
					style={{
						borderColor: "var(--border)",
						backgroundColor: "var(--surface-1)",
					}}
				>
					<span style={{ color: "var(--text-secondary)" }}>🔍</span>
					<input
						type="text"
						placeholder="Buscar threads..."
						className="flex-1 bg-transparent outline-none"
						style={{ color: "var(--text-primary)" }}
					/>
				</div>
			</div>

			{/* Section Nav */}
			<div className="flex px-3 pb-2 gap-0.5">
				{[
					{ id: "threads" as Section, icon: "💬", label: "Chats" },
					{ id: "skills" as Section, icon: "🧩", label: "Skills" },
					{ id: "automations" as Section, icon: "⚡", label: "Auto" },
					{ id: "settings" as Section, icon: "⚙", label: "Config" },
				].map((s) => (
					<button
						key={s.id}
						type="button"
						onClick={() => setSection(s.id)}
						className="flex-1 rounded-md py-1.5 text-xs font-medium transition-colors"
						style={{
							backgroundColor:
								section === s.id ? "var(--accent-bg, #dbeafe)" : "transparent",
							color:
								section === s.id ? "var(--accent)" : "var(--text-secondary)",
						}}
					>
						{s.icon} {s.label}
					</button>
				))}
			</div>

			<div className="flex-1 overflow-y-auto">
				{section === "threads" && (
					<ThreadsSection
						activeThreadId={activeThreadId}
						onSelectThread={onSelectThread}
						onNewThread={onNewThread}
						showProjects={showProjects}
						onToggleProjects={() => setShowProjects(!showProjects)}
					/>
				)}
				{section === "skills" && <SkillsSection />}
				{section === "automations" && <AutomationsSection />}
				{section === "settings" && <SettingsSection />}
			</div>
		</aside>
	);
}

// ─── Sections ───────────────────────────────────────────────────────────

function ThreadsSection({
	activeThreadId,
	onSelectThread,
	onNewThread,
	showProjects,
	onToggleProjects,
}: {
	activeThreadId: string;
	onSelectThread: (id: string) => void;
	onNewThread: () => void;
	showProjects: boolean;
	onToggleProjects: () => void;
}) {
	const { projects } = threadStore;

	return (
		<div className="px-2 space-y-0.5">
			{/* New Thread */}
			<button
				type="button"
				onClick={onNewThread}
				className="w-full rounded-lg px-3 py-2 text-sm font-medium text-left transition-colors"
				style={{
					color: "var(--accent)",
					backgroundColor: "var(--accent-bg, #dbeafe)",
				}}
			>
				+ Nuevo thread
			</button>

			<div className="h-2" />

			{/* Projects */}
			<button
				type="button"
				onClick={onToggleProjects}
				className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium"
				style={{ color: "var(--text-secondary)" }}
			>
				<span>📁 Proyectos</span>
				<span>{showProjects ? "▼" : "▶"}</span>
			</button>

			{showProjects &&
				projects.map((project) => (
					<div key={project.id}>
						<div
							className="px-3 py-1 text-xs font-medium"
							style={{ color: "var(--text-secondary)" }}
						>
							{project.name}
						</div>
						{threadStore.getThreadsForProject(project.id).map((thread) => (
							<ThreadRow
								key={thread.id}
								thread={thread}
								isActive={thread.id === activeThreadId}
								onClick={() => onSelectThread(thread.id)}
							/>
						))}
					</div>
				))}

			{/* Unorganized threads */}
			{threadStore.getThreadsByProject().map((thread) => (
				<ThreadRow
					key={thread.id}
					thread={thread}
					isActive={thread.id === activeThreadId}
					onClick={() => onSelectThread(thread.id)}
				/>
			))}
		</div>
	);
}

function ThreadRow({
	thread,
	isActive,
	onClick,
}: {
	thread: Thread;
	isActive: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="w-full rounded-lg px-3 py-2 text-left transition-colors text-xs"
			style={{
				backgroundColor: isActive ? "var(--accent-bg, #dbeafe)" : "transparent",
				color: isActive ? "var(--accent)" : "var(--text-primary)",
			}}
		>
			<div className="truncate font-medium">{thread.title}</div>
			<div className="truncate" style={{ color: "var(--text-secondary)" }}>
				{thread.messages.length} mensajes
			</div>
		</button>
	);
}

function SkillsSection() {
	const skills = [
		{
			name: "Fiscal Query",
			desc: "Consultar IGV, detracciones, SIRE",
			status: "active",
		},
		{
			name: "Approval Manager",
			desc: "Aprobar/rechazar recomendaciones",
			status: "active",
		},
		{
			name: "Compliance Pipeline",
			desc: "Ejecutar pipeline SDD fiscal",
			status: "active",
		},
		{ name: "SIRE Reporter", desc: "Generar reportes SIRE", status: "active" },
		{ name: "RUC Validator", desc: "Validar alcance RUC", status: "active" },
		{ name: "Detracciones Check", desc: "Verificar SPOT", status: "inactive" },
	];

	return (
		<div className="px-3 space-y-2">
			<div
				className="text-xs font-medium py-1"
				style={{ color: "var(--text-secondary)" }}
			>
				🧩 Skills ({skills.length})
			</div>
			{skills.map((s) => (
				<div
					key={s.name}
					className="rounded-lg px-3 py-2 text-xs"
					style={{ backgroundColor: "var(--surface-1)" }}
				>
					<div className="flex items-center justify-between">
						<span
							className="font-medium"
							style={{ color: "var(--text-primary)" }}
						>
							{s.name}
						</span>
						<span
							className="px-1.5 py-0.5 rounded text-xs"
							style={{
								backgroundColor:
									s.status === "active"
										? "var(--success-bg, #dcfce7)"
										: "var(--surface-3)",
								color:
									s.status === "active"
										? "var(--success, #16a34a)"
										: "var(--text-secondary)",
							}}
						>
							{s.status}
						</span>
					</div>
					<div style={{ color: "var(--text-secondary)" }} className="mt-0.5">
						{s.desc}
					</div>
				</div>
			))}
			<div className="pt-2">
				<button
					type="button"
					className="w-full rounded-lg py-2 text-xs font-medium transition-colors"
					style={{
						color: "var(--accent)",
						backgroundColor: "var(--accent-bg, #dbeafe)",
					}}
				>
					+ Crear skill
				</button>
			</div>
		</div>
	);
}

function AutomationsSection() {
	const automations = [
		{
			name: "Cierre Mensual",
			desc: "Pipeline de cierre",
			schedule: "1er día del mes",
			status: "active",
		},
		{
			name: "SIRE Auto-Report",
			desc: "Reporte semanal",
			schedule: "Lunes 9am",
			status: "active",
		},
		{
			name: "Detracciones Check",
			desc: "Verificación diaria",
			schedule: "Diario 8am",
			status: "paused",
		},
	];

	return (
		<div className="px-3 space-y-2">
			<div
				className="text-xs font-medium py-1"
				style={{ color: "var(--text-secondary)" }}
			>
				⚡ Automations ({automations.length})
			</div>
			{automations.map((a) => (
				<div
					key={a.name}
					className="rounded-lg px-3 py-2 text-xs"
					style={{ backgroundColor: "var(--surface-1)" }}
				>
					<div className="flex items-center justify-between">
						<span
							className="font-medium"
							style={{ color: "var(--text-primary)" }}
						>
							{a.name}
						</span>
						<span
							className="px-1.5 py-0.5 rounded text-xs"
							style={{
								backgroundColor:
									a.status === "active"
										? "var(--success-bg, #dcfce7)"
										: "var(--surface-3)",
								color:
									a.status === "active"
										? "var(--success, #16a34a)"
										: "var(--text-secondary)",
							}}
						>
							{a.status}
						</span>
					</div>
					<div style={{ color: "var(--text-secondary)" }} className="mt-0.5">
						{a.desc}
					</div>
					<div style={{ color: "var(--text-secondary)" }} className="mt-0.5">
						⏰ {a.schedule}
					</div>
				</div>
			))}
			<div className="pt-2">
				<button
					type="button"
					className="w-full rounded-lg py-2 text-xs font-medium transition-colors"
					style={{
						color: "var(--accent)",
						backgroundColor: "var(--accent-bg, #dbeafe)",
					}}
				>
					+ Nueva automation
				</button>
			</div>
		</div>
	);
}

function SettingsSection() {
	return (
		<div className="px-3 space-y-3">
			<div
				className="text-xs font-medium py-1"
				style={{ color: "var(--text-secondary)" }}
			>
				⚙ Configuración
			</div>
			{[
				{ label: "RUC por defecto", value: "20123456789" },
				{ label: "Período default", value: "Último mes" },
				{ label: "Idioma", value: "Español (Perú)" },
				{ label: "Confianza mínima", value: "70%" },
				{ label: "Timeout aprobación", value: "24 horas" },
			].map((s) => (
				<div
					key={s.label}
					className="flex items-center justify-between rounded-lg px-3 py-2 text-xs"
					style={{ backgroundColor: "var(--surface-1)" }}
				>
					<span style={{ color: "var(--text-secondary)" }}>{s.label}</span>
					<span
						className="font-medium"
						style={{ color: "var(--text-primary)" }}
					>
						{s.value}
					</span>
				</div>
			))}
		</div>
	);
}

// ─── Collapsed icon ─────────────────────────────────────────────────────

function SidebarIcon({
	icon,
	label,
	active,
	onClick,
}: {
	icon: string;
	label: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			title={label}
			className="w-9 h-9 flex items-center justify-center rounded-lg text-base transition-colors"
			style={{
				backgroundColor: active ? "var(--accent-bg, #dbeafe)" : "transparent",
			}}
		>
			{icon}
		</button>
	);
}
