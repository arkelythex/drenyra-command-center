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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { LEGIBILITY } from "@/lib/legibility";
import { cn } from "@/lib/utils";
import {
	INPUT_CLASS,
	type ProductFormData,
	type ProductFormValues,
} from "./constants";

interface ProductFormPricingSectionProps {
	form: UseFormReturn<ProductFormValues, unknown, ProductFormData>;
	onFieldFocus: () => void;
	onTaxTypeSelect: () => void;
}

const LABEL_CLASS = cn(
	"text-2xs font-black uppercase tracking-widest text-muted-foreground",
	LEGIBILITY.textShadow.light,
);

const toFloat = (value: string): number => Number.parseFloat(value) || 0;

export function ProductFormPricingSection({
	form,
	onFieldFocus,
	onTaxTypeSelect,
}: ProductFormPricingSectionProps) {
	return (
		<SurfacePanel padding="lg" className="space-y-4">
			<div className="grid grid-cols-3 gap-4">
				<FormField
					control={form.control}
					name="unitPrice"
					render={({ field }) => (
						<FormItem>
							<FormLabel className={LABEL_CLASS}>
								Precio Venta (PEN) *
							</FormLabel>
							<FormControl>
								<Input
									{...field}
									onFocus={onFieldFocus}
									type="number"
									step="0.01"
									placeholder="0.00"
									className={INPUT_CLASS}
									onChange={(event) =>
										field.onChange(toFloat(event.target.value))
									}
								/>
							</FormControl>
							<FormMessage className="text-label" />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="costPrice"
					render={({ field }) => (
						<FormItem>
							<FormLabel className={LABEL_CLASS}>Costo (PEN)</FormLabel>
							<FormControl>
								<Input
									{...field}
									onFocus={onFieldFocus}
									type="number"
									step="0.01"
									placeholder="0.00"
									className={INPUT_CLASS}
									onChange={(event) =>
										field.onChange(toFloat(event.target.value))
									}
								/>
							</FormControl>
							<FormMessage className="text-label" />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="taxType"
					render={({ field }) => (
						<FormItem>
							<FormLabel className={LABEL_CLASS}>Tipo de Impuesto *</FormLabel>
							<Select
								onValueChange={(value) => {
									onTaxTypeSelect();
									field.onChange(value);
								}}
								defaultValue={field.value}
							>
								<FormControl>
									<SelectTrigger className="h-11 bg-[var(--surface-1)] border-[var(--border-default)] font-mono text-xs">
										<SelectValue placeholder="Seleccionar" />
									</SelectTrigger>
								</FormControl>
								<SelectContent className="bg-[var(--surface-1)] border-[var(--border-default)]">
									<SelectItem value="GRAVADO">Gravado (18%)</SelectItem>
									<SelectItem value="EXONERADO">Exonerado</SelectItem>
									<SelectItem value="INAFECTO">Inafecto</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage className="text-label" />
						</FormItem>
					)}
				/>
			</div>
		</SurfacePanel>
	);
}
