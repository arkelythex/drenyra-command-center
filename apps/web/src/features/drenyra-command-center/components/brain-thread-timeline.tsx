import type {
	DrenyraBrainItem,
	DrenyraBrainItemContent,
	DrenyraBrainWebResearchContent,
} from "@arkelythex/domain/drenyra";

interface BrainThreadTimelineProps {
	items: DrenyraBrainItem[];
}

function isTextContent(content: DrenyraBrainItemContent): content is { text: string } {
	return (
		typeof content === "object" &&
		content !== null &&
		"text" in content &&
		typeof content.text === "string"
	);
}

function isWebResearchContent(
	content: DrenyraBrainItemContent,
): content is DrenyraBrainWebResearchContent {
	return (
		typeof content === "object" &&
		content !== null &&
		"query" in content &&
		typeof content.query === "string" &&
		"sourceUrl" in content &&
		typeof content.sourceUrl === "string" &&
		"sourceTitle" in content &&
		typeof content.sourceTitle === "string" &&
		"retrievedAt" in content &&
		typeof content.retrievedAt === "string" &&
		"snippet" in content &&
		typeof content.snippet === "string" &&
		"citationText" in content &&
		typeof content.citationText === "string" &&
		"toolName" in content &&
		typeof content.toolName === "string" &&
		"purpose" in content &&
		typeof content.purpose === "string"
	);
}

export function BrainThreadTimeline({ items }: BrainThreadTimelineProps) {
	return (
		<ol className="space-y-3">
			{items.map((item) => (
				<li key={item.id} className="rounded-lg border border-border/60 p-3">
					<p className="text-xs text-muted-foreground">
						{item.type} · {new Date(item.createdAt).toLocaleString()}
					</p>

					{isTextContent(item.content) ? (
						<p className="mt-1 text-sm">{item.content.text}</p>
					) : null}

					{isWebResearchContent(item.content) ? (
						<div className="mt-2 space-y-1 text-sm">
							<p className="font-medium">{item.content.sourceTitle}</p>
							<p>{item.content.snippet}</p>
							<p className="text-xs text-muted-foreground">
								{item.content.citationText}
							</p>
						</div>
					) : null}
				</li>
			))}
		</ol>
	);
}
