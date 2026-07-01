import { Link } from "@tanstack/react-router";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DemoFeatureUnavailableProps {
	title: string;
	description: string;
}

export function DemoFeatureUnavailable({
	title,
	description,
}: DemoFeatureUnavailableProps) {
	return (
		<div className="min-h-screen bg-background flex items-center justify-center px-6">
			<div className="w-full max-w-xl rounded-3xl border border-border/50 bg-card/80 p-10 shadow-xl ">
				<div className="flex items-center gap-4">
					<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-500">
						<LockKeyhole size={22} />
					</div>
					<div>
						<p className="text-2xs font-black uppercase tracking-[0.2em] text-amber-500">
							Demo Curado
						</p>
						<h1 className="text-xl font-black tracking-tight text-foreground">
							{title}
						</h1>
					</div>
				</div>

				<p className="mt-6 text-sm leading-relaxed text-muted-foreground">
					{description}
				</p>

				<div className="mt-8 flex flex-wrap gap-3">
					<Button asChild className="font-black uppercase tracking-widest">
						<Link to="/dashboard">
							<ArrowLeft size={16} className="mr-2" />
							Volver al Dashboard
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
