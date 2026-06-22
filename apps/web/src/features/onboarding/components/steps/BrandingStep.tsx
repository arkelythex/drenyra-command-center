import { Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CompanySetup } from "../../types/onboarding.types";

interface Props {
	data: Partial<CompanySetup>;
	onUpdate: (data: Partial<CompanySetup>) => void;
	onSubmit: () => void;
	onBack: () => void;
	isSubmitting: boolean;
}

const BRAND_COLOR_OPTIONS = [
	{ id: "sky", value: "var(--color-blue-base)", label: "Azul operativo" },
	{ id: "success", value: "var(--color-success)", label: "Verde éxito" },
	{ id: "warning", value: "var(--color-warning)", label: "Ámbar control" },
	{ id: "danger", value: "var(--color-danger)", label: "Rojo riesgo" },
	{ id: "steel", value: "var(--color-steel-base)", label: "Azul acero" },
] as const;

export const BrandingStep = ({
	data,
	onUpdate,
	onSubmit,
	onBack,
	isSubmitting,
}: Props) => {
	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
			<div className="space-y-2">
				<h3 className="text-lg font-black uppercase tracking-tight">
					Marca e Identidad
				</h3>
				<p className="text-sm text-muted-foreground">
					Personaliza tus facturas y correos.
				</p>
			</div>

			<div className="flex gap-6 items-start">
				<div className="h-24 w-24 rounded-2xl bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
					{data.logo ? (
						<img
							src={URL.createObjectURL(data.logo)}
							alt="Logo Preview"
							className="w-full h-full object-cover"
						/>
					) : (
						<ImageIcon size={32} className="text-muted-foreground/50" />
					)}
				</div>
				<div className="space-y-2 flex-1">
					<label className="text-2xs font-black uppercase tracking-widest text-muted-foreground">
						Logo de la Empresa
					</label>
					<Input
						type="file"
						accept="image/*"
						onChange={(e) => onUpdate({ logo: e.target.files?.[0] })}
						className="text-xs"
					/>
					<p className="text-2xs text-muted-foreground">
						Recomendado: PNG transparente, 500x500px.
					</p>
				</div>
			</div>

			<div className="space-y-2">
				<label className="text-2xs font-black uppercase tracking-widest text-muted-foreground">
					Color Primario
				</label>
				<div className="flex gap-3">
					{BRAND_COLOR_OPTIONS.map(({ id, value, label }) => (
						<button
							key={id}
							type="button"
							aria-label={label}
							aria-pressed={data.primaryColor === value}
							className="h-8 w-8 rounded-full border-2 border-background shadow-sm hover:scale-110 transition-transform ring-1 ring-border aria-pressed:scale-110 aria-pressed:ring-2 aria-pressed:ring-primary"
							style={{ backgroundColor: value }}
							onClick={() => onUpdate({ primaryColor: value })}
						/>
					))}
				</div>
			</div>

			<div className="flex gap-3 pt-4">
				<Button
					variant="outline"
					onClick={onBack}
					className="flex-1 font-black uppercase tracking-widest"
					disabled={isSubmitting}
				>
					Atrás
				</Button>
				<Button
					onClick={onSubmit}
					className="flex-[2] font-black uppercase tracking-widest"
					disabled={isSubmitting}
				>
					{isSubmitting ? "Guardando..." : "Finalizar y Abrir Dashboard"}
				</Button>
			</div>
		</div>
	);
};
