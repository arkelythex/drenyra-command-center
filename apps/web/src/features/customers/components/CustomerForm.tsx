import { zodResolver } from "@hookform/resolvers/zod";
import { type ChangeEvent, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "../../../components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../../../components/ui/form";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import {
	type CreateCustomerDTO,
	customerSchema,
} from "../../../lib/schemas/customer.schema";
import { useActiveCompanyContext } from "../../../lib/use-active-company-context";
import { buildCustomerFormDefaults } from "./customer-form-defaults";

const customerFormSchema = customerSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

type CustomerFormValues = z.input<typeof customerFormSchema>;

interface CustomerFormProps {
	defaultValues?: Partial<CreateCustomerDTO>;
	onSubmit: (data: CreateCustomerDTO) => void;
	isLoading?: boolean;
}

export const CustomerForm = ({
	defaultValues,
	onSubmit,
	isLoading,
}: CustomerFormProps) => {
	const { companyContext } = useActiveCompanyContext();
	const resolvedDefaultValues = useMemo(
		() => buildCustomerFormDefaults(companyContext.companyId, defaultValues),
		[companyContext.companyId, defaultValues],
	);

	const form = useForm<CustomerFormValues, unknown, CreateCustomerDTO>({
		resolver: zodResolver(customerFormSchema),
		defaultValues: resolvedDefaultValues,
	});

	useEffect(() => {
		if (defaultValues?.companyId) return;
		form.setValue("companyId", companyContext.companyId, {
			shouldDirty: false,
			shouldTouch: false,
			shouldValidate: false,
		});
	}, [companyContext.companyId, defaultValues?.companyId, form]);

	const handleOptionalCurrencyChange = (
		event: ChangeEvent<HTMLInputElement>,
		onChange: (value: number | undefined) => void,
	): void => {
		const nextValue = event.target.value;
		onChange(nextValue === "" ? undefined : Number.parseFloat(nextValue));
	};

	const handleOptionalIntegerChange = (
		event: ChangeEvent<HTMLInputElement>,
		onChange: (value: number | undefined) => void,
	): void => {
		const nextValue = event.target.value;
		onChange(nextValue === "" ? undefined : Number.parseInt(nextValue, 10));
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="taxId"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-label font-black uppercase tracking-widest text-muted-foreground">
									RUC *
								</FormLabel>
								<FormControl>
									<Input
										{...field}
										value={field.value ?? ""}
										placeholder="20123456789"
										className="h-11 bg-background border-border font-mono text-xs"
										maxLength={11}
									/>
								</FormControl>
								<FormMessage className="text-label" />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="legalName"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-label font-black uppercase tracking-widest text-muted-foreground">
									Razón Social *
								</FormLabel>
								<FormControl>
									<Input
										{...field}
										value={field.value ?? ""}
										placeholder="Empresa SAC"
										className="h-11 bg-background border-border font-mono text-xs"
									/>
								</FormControl>
								<FormMessage className="text-label" />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="tradeName"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-label font-black uppercase tracking-widest text-muted-foreground">
								Nombre Comercial
							</FormLabel>
							<FormControl>
								<Input
									{...field}
									value={field.value ?? ""}
									placeholder="Nombre comercial (opcional)"
									className="h-11 bg-background border-border font-mono text-xs"
								/>
							</FormControl>
							<FormMessage className="text-label" />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="address"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-label font-black uppercase tracking-widest text-muted-foreground">
								Dirección Fiscal *
							</FormLabel>
							<FormControl>
								<Textarea
									{...field}
									value={field.value ?? ""}
									placeholder="Av. Principal 123, Lima"
									className="min-h-[80px] bg-background border-border font-mono text-xs resize-none"
								/>
							</FormControl>
							<FormMessage className="text-label" />
						</FormItem>
					)}
				/>

				<div className="grid grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-label font-black uppercase tracking-widest text-muted-foreground">
									Email *
								</FormLabel>
								<FormControl>
									<Input
										{...field}
										value={field.value ?? ""}
										type="email"
										placeholder="contacto@empresa.com"
										className="h-11 bg-background border-border font-mono text-xs"
									/>
								</FormControl>
								<FormMessage className="text-label" />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="phone"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-label font-black uppercase tracking-widest text-muted-foreground">
									Teléfono
								</FormLabel>
								<FormControl>
									<Input
										{...field}
										value={field.value ?? ""}
										placeholder="+51 999 999 999"
										className="h-11 bg-background border-border font-mono text-xs"
									/>
								</FormControl>
								<FormMessage className="text-label" />
							</FormItem>
						)}
					/>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="creditLimit"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-label font-black uppercase tracking-widest text-muted-foreground">
									Límite de Crédito (PEN)
								</FormLabel>
								<FormControl>
									<Input
										{...field}
										value={field.value ?? ""}
										type="number"
										step="0.01"
										placeholder="0.00"
										className="h-11 bg-background border-border font-mono text-xs"
										onChange={(event) =>
											handleOptionalCurrencyChange(event, field.onChange)
										}
									/>
								</FormControl>
								<FormMessage className="text-label" />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="creditDays"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-label font-black uppercase tracking-widest text-muted-foreground">
									Días de Crédito
								</FormLabel>
								<FormControl>
									<Input
										{...field}
										value={field.value ?? ""}
										type="number"
										placeholder="30"
										className="h-11 bg-background border-border font-mono text-xs"
										onChange={(event) =>
											handleOptionalIntegerChange(event, field.onChange)
										}
									/>
								</FormControl>
								<FormMessage className="text-label" />
							</FormItem>
						)}
					/>
				</div>

				<Button
					type="submit"
					disabled={isLoading}
					className="w-full h-11 font-black text-xs bg-primary hover:bg-primary/90"
				>
					{isLoading ? "GUARDANDO..." : "GUARDAR CLIENTE"}
				</Button>
			</form>
		</Form>
	);
};
