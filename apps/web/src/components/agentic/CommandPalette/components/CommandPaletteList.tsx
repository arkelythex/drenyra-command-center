import { Command } from "cmdk";
import { MessageSquare } from "lucide-react";
import type {
	ActionItem,
	CommandItemBase,
	NavTarget,
} from "../CommandPalette.types";
import { CommandPaletteItem } from "./CommandPaletteItem";

interface ThreadListItem {
	id: string;
	title: string;
	snippet?: string;
	messageCount: number;
}

interface CommandPaletteListProps {
	navTargets: NavTarget[];
	actionItems: ActionItem[];
	activeThreads: ThreadListItem[];
	onNavigate: (path: string) => void;
	onAction: (action: () => void) => void;
	onSelectThread: (id: string) => void;
}

function renderItem(
	item: CommandItemBase,
	onSelect: () => void,
	extraKeywords?: string[],
) {
	return (
		<CommandPaletteItem
			key={item.id}
			value={item.id}
			icon={item.icon}
			label={item.label}
			description={item.description}
			keywords={[item.label, item.description, ...(extraKeywords ?? [])]}
			onSelect={onSelect}
		/>
	);
}

export function CommandPaletteList({
	navTargets,
	actionItems,
	activeThreads,
	onNavigate,
	onAction,
	onSelectThread,
}: CommandPaletteListProps) {
	return (
		<Command.List>
			<Command.Empty>No se encontraron resultados</Command.Empty>

			<Command.Group heading="Navegar">
				{navTargets.map((target) =>
					renderItem(target, () => onNavigate(target.path)),
				)}
			</Command.Group>

			<Command.Group heading="Acciones">
				{actionItems.map((item) =>
					renderItem(item, () => onAction(item.action)),
				)}
			</Command.Group>

			{activeThreads.length > 0 && (
				<Command.Group heading="Threads reacentes">
					{activeThreads.slice(0, 8).map((thread) => (
						<CommandPaletteItem
							key={thread.id}
							value={thread.id}
							icon={MessageSquare}
							label={thread.title}
							description={thread.snippet || `${thread.messageCount} mensajes`}
							keywords={[thread.title, thread.snippet ?? ""]}
							onSelect={() => onSelectThread(thread.id)}
						/>
					))}
				</Command.Group>
			)}
		</Command.List>
	);
}
