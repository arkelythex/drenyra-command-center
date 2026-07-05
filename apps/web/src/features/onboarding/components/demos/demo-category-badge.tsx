interface DemoCategoryBadgeProps {
	category: string;
}

export const DemoCategoryBadge = ({ category }: DemoCategoryBadgeProps) => (
	<span className="rounded border border-border/20 bg-foreground/10 px-2 py-0.5 text-3xs font-black uppercase tracking-widest text-muted-foreground">
		{category}
	</span>
);
