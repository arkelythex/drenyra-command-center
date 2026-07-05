import { ShieldCheck } from "lucide-react";
import { Text } from "@/components/atoms/text";
import { entranceVariants, MotionDiv } from "@/components/ui/motion-primitives";

export function AuthBrandHeader() {
	return (
		<MotionDiv variants={entranceVariants} className="text-center mb-12">
			<div className="inline-flex items-center gap-4 mb-6">
				<div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/40 shadow-sm">
					<ShieldCheck className="h-7 w-7 text-foreground/80" />
				</div>
				<Text
					variant="hero"
					className="text-4xl font-bold tracking-tight text-foreground"
				>
					ARK<span className="text-foreground/75">O</span>NYX
				</Text>
			</div>
			<Text
				variant="label"
				className="mt-3 block text-sm font-mono uppercase tracking-wider text-muted-foreground"
			>
				Perú Primero • Listo Para Escalar En Latam
			</Text>
		</MotionDiv>
	);
}
