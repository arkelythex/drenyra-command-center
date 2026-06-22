import { ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiquidGlass } from "@/components/ui/liquid-glass";

interface EntityInfoCardProps {
	onOpenRucSheet: () => void;
}

export function EntityInfoCard({ onOpenRucSheet }: EntityInfoCardProps) {
	return (
		<LiquidGlass intensity="light" className="p-8 space-y-8 border-border/50">
			<h3 className="text-label font-black text-muted-foreground uppercase tracking-[0.25em]">
				Informacion Registrada
			</h3>

			<div className="space-y-6">
				<div className="flex items-start gap-5 group">
					<div className="p-3 rounded-xl bg-muted/60 text-muted-foreground border border-border/60 group-hover:text-primary transition-colors">
						<MapPin size={18} />
					</div>
					<div className="min-w-0">
						<p className="text-xs font-black text-muted-foreground uppercase tracking-widest opacity-50 mb-1">
							Direccion Fiscal
						</p>
						<p className="text-xs font-bold text-foreground leading-relaxed opacity-90">
							Av. Principal 123, Edificio Capital, San Isidro, Lima - Peru
						</p>
					</div>
				</div>

				<div className="flex items-start gap-5 group">
					<div className="p-3 rounded-xl bg-muted/60 text-muted-foreground border border-border/60 group-hover:text-primary transition-colors">
						<Phone size={18} />
					</div>
					<div>
						<p className="text-xs font-black text-muted-foreground uppercase tracking-widest opacity-50 mb-1">
							Contacto
						</p>
						<p className="text-xs font-bold text-foreground opacity-90">+51 999 888 777</p>
					</div>
				</div>

				<div className="flex items-start gap-5 group">
					<div className="p-3 rounded-xl bg-muted/60 text-muted-foreground border border-border/60 group-hover:text-primary transition-colors">
						<Mail size={18} />
					</div>
					<div className="min-w-0">
						<p className="text-xs font-black text-muted-foreground uppercase tracking-widest opacity-50 mb-1">
							Email Facturacion
						</p>
						<p className="text-xs font-bold text-foreground opacity-90 truncate">
							facturacion@entidad.com.pe
						</p>
					</div>
				</div>
			</div>

			<div className="pt-6 border-t border-border/50">
				<Button
					variant="link"
					onClick={onOpenRucSheet}
					className="p-0 text-primary h-auto text-label font-black uppercase tracking-widest hover:no-underline group transition-all"
				>
					Ver Ficha Ruc Completa{" "}
					<ExternalLink
						size={12}
						className="ml-2 group-hover:translate-x-1 transition-transform"
					/>
				</Button>
			</div>
		</LiquidGlass>
	);
}
