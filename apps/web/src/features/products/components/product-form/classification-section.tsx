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
import { LEGIBILITY } from "@/lib/legibility";
import { cn } from "@/lib/utils";
import {
	INPUT_CLASS,
	type ProductFormData,
	type ProductFormValues,
} from "./constants";

interface ProductFormClassificationSectionProps {
	form: UseFormReturn<ProductFormValues, unknown, ProductFormData>;
	onFieldFocus: () => void;
}

const LABEL_CLASS = cn(
	"text-2xs font-black uppercase tracking-widest text-muted-foreground",
	LEGIBILITY.textShadow.light,
);

export function ProductFormClassificationSection({
	form,
	onFieldFocus,
}: ProductFormClassificationSectionProps) {
	return (
		<SurfacePanel padding="lg" className="space-y-4">
			<div className="grid grid-cols-2 gap-4">
				<FormField
					control={form.control}
					name="category"
					render={({ field }) => (
						<FormItem>
							<FormLabel className={LABEL_CLASS}>Categoria</FormLabel>
							<FormControl>
								<Input
									{...field}
									onFocus={onFieldFocus}
									placeholder="Ej: Electronica, Servicios"
									className={INPUT_CLASS}
								/>
							</FormControl>
							<FormMessage className="text-label" />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="unit"
					render={({ field }) => (
						<FormItem>
							<FormLabel className={LABEL_CLASS}>Unidad</FormLabel>
							<FormControl>
								<Input
									{...field}
									onFocus={onFieldFocus}
									placeholder="UND, KG, M, etc."
									className={INPUT_CLASS}
								/>
							</FormControl>
							<FormMessage className="text-label" />
						</FormItem>
					)}
				/>
			</div>
		</SurfacePanel>
	);
}
