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
import type {
	ProductFormData,
	ProductFormValues,
} from "./product-form/constants";

interface ProductFormStockSectionProps {
	form: UseFormReturn<ProductFormValues, unknown, ProductFormData>;
	onFieldFocus: () => void;
}

const LABEL_CLASS = cn(
	"text-2xs font-black uppercase tracking-widest text-muted-foreground",
	LEGIBILITY.textShadow.light,
);

const toInt = (value: string): number => Number.parseInt(value, 10) || 0;

export const ProductFormStockSection = ({
	form,
	onFieldFocus,
}: ProductFormStockSectionProps) => (
	<SurfacePanel padding="lg" className="space-y-4">
		<div className="grid grid-cols-3 gap-4">
			<FormField
				control={form.control}
				name="currentStock"
				render={({ field }) => (
					<FormItem>
						<FormLabel className={LABEL_CLASS}>Stock Actual</FormLabel>
						<FormControl>
							<Input
								{...field}
								onFocus={onFieldFocus}
								type="number"
								placeholder="0"
								className="h-11 border-[var(--border-default)] bg-[var(--surface-1)] font-mono text-xs placeholder:text-muted-foreground/70"
								onChange={(event) => field.onChange(toInt(event.target.value))}
							/>
						</FormControl>
						<FormMessage className="text-label" />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="stockMin"
				render={({ field }) => (
					<FormItem>
						<FormLabel className={LABEL_CLASS}>Stock Mínimo</FormLabel>
						<FormControl>
							<Input
								{...field}
								onFocus={onFieldFocus}
								type="number"
								placeholder="0"
								className="h-11 border-[var(--border-default)] bg-[var(--surface-1)] font-mono text-xs placeholder:text-muted-foreground/70"
								onChange={(event) => field.onChange(toInt(event.target.value))}
							/>
						</FormControl>
						<FormMessage className="text-label" />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="stockMax"
				render={({ field }) => (
					<FormItem>
						<FormLabel className={LABEL_CLASS}>Stock Máximo</FormLabel>
						<FormControl>
							<Input
								{...field}
								onFocus={onFieldFocus}
								type="number"
								placeholder="0"
								className="h-11 border-[var(--border-default)] bg-[var(--surface-1)] font-mono text-xs placeholder:text-muted-foreground/70"
								onChange={(event) => field.onChange(toInt(event.target.value))}
							/>
						</FormControl>
						<FormMessage className="text-label" />
					</FormItem>
				)}
			/>
		</div>
	</SurfacePanel>
);
