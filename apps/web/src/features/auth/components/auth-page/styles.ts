export const baseInputClass = [
	"pl-12 h-14",
	"bg-card border border-border",
	"text-foreground focus:border-foreground/60",
	"rounded-2xl placeholder:text-muted-foreground",
	"transition-[background-color,border-color,box-shadow,color] duration-200",
	"focus:ring-2 focus:ring-foreground/10 focus:ring-offset-0",
	"hover:border-border/80",
].join(" ");

export const primaryButtonClass = [
	"w-full h-14",
	"bg-foreground hover:bg-foreground/90",
	"text-background font-bold uppercase tracking-wider text-sm",
	"rounded-2xl transition-[background-color,box-shadow,opacity] duration-200",
	"hover:opacity-95 motion-reduce:transition-none",
	"disabled:opacity-50 disabled:cursor-not-allowed",
	"shadow-sm focus:ring-2 focus:ring-foreground/10 focus:ring-offset-2",
].join(" ");
