import { cn } from "@/lib/utils";

interface AuthTabSwitchProps {
	activeTab: "login" | "signup";
	onChange: (tab: "login" | "signup") => void;
}

const tabs = [
	{ key: "login" as const, label: "Ingresar" },
	{ key: "signup" as const, label: "Registro" },
];

export function AuthTabSwitch({ activeTab, onChange }: AuthTabSwitchProps) {
	return (
		<div className="mb-8 flex gap-2 rounded-2xl border border-border bg-muted/40 p-1">
			{tabs.map((tab) => (
				<button
					key={tab.key}
					onClick={() => onChange(tab.key)}
					className={cn(
						"flex-1 rounded-xl px-6 py-3 text-sm font-medium transition-[background-color,color,box-shadow,opacity] duration-200 motion-reduce:transition-none",
						activeTab === tab.key
							? "bg-foreground text-background shadow-sm"
							: "text-muted-foreground hover:bg-background/70 hover:text-foreground",
					)}
				>
					{tab.label}
				</button>
			))}
		</div>
	);
}
