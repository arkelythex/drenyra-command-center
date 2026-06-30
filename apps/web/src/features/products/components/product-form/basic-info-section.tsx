import type { UseFormReturn } from "react-hook-form";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SurfacePanel } from "@/components/ui/SurfacePanel";
import { Textarea } from "@/components/ui/textarea";
import { LEGIBILITY } from "@/lib/legibility";
import { cn } from "@/lib/utils";
import {
	INPUT_CLASS,
	type ProductFormData,
	type ProductFormValues,
} from "./constants";

interface ProductFormBasicInfoSectionProps {
	form: UseFormReturn<ProductFormValues, unknown, ProductFormData>;
	onFieldFocus: () => void;
}

const LABEL_CLASS = cn(
	"text-2xs font-black uppercase tracking-widest text-muted-foreground",
	LEGIBILITY.textShadow.light,
);

export function ProductFormBasicInfoSection({
	form,
	onFieldFocus,
}: ProductFormBasicInfoSectionProps) {
	return (
		<SurfacePanel padding="lg" className="space-y-4">
			<div className="grid grid-cols-2 gap-4">
				<FormField
					control={form.control}
					name="sku"
					render={({ field }) => (
						<FormItem>
							<FormLabel className={LABEL_CLASS}>SKU *</FormLabel>
							<FormControl>
								<Input
									{...field}
									onFocus={onFieldFocus}
									placeholder="PROD-001"
									className={INPUT_CLASS}
								/>
							</FormControl>
							<FormMessage className="text-label" />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel className={LABEL_CLASS}>Nombre *</FormLabel>
							<FormControl>
								<Input
									{...field}
									onFocus={onFieldFocus}
									placeholder="Producto o Servicio"
									className={INPUT_CLASS}
								/>
							</FormControl>
							<FormMessage className="text-label" />
						</FormItem>
					)}
				/>
			</div>

			<FormField
				control={form.control}
				name="description"
				render={({ field }) => (
					<FormItem>
						<FormLabel className={LABEL_CLASS}>Descripcion</FormLabel>
						<FormControl>
							<Textarea
								{...field}
								onFocus={onFieldFocus}
								placeholder="Descripcion detallada del producto..."
								className="min-h-[80px] bg-[var(--surface-1)] border-[var(--border-default)] font-mono text-xs resize-none placeholder:text-muted-foreground/70"
							/>
						</FormControl>
						<FormMessage className="text-label" />
					</FormItem>
				)}
			/>
		</SurfacePanel>
	);
}
