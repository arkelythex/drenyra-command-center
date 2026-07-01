import type React from "react";

/**
 * AddCompanyModal Component
 * Modal to add a new company/RUC to Economic Group
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Loader2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Validation Schema
const addCompanySchema = z.object({
	ruc: z
		.string()
		.length(11, "El RUC debe tener 11 dígitos")
		.regex(/^\d+$/, "El RUC solo debe contener números"),
	businessName: z
		.string()
		.min(3, "La razón social debe tener al menos 3 caracteres")
		.max(255, "La razón social es demasiado larga"),
	tradeName: z.string().optional(),
	address: z.string().optional(),
});

type AddCompanyFormData = z.infer<typeof addCompanySchema>;

interface AddCompanyModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: AddCompanyFormData) => void;
	isSubmitting?: boolean;
	error?: Error | null;
}

export const AddCompanyModal: React.FC<AddCompanyModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	isSubmitting = false,
	error,
}) => {
	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<AddCompanyFormData>({
		resolver: zodResolver(addCompanySchema),
	});

	const handleClose = () => {
		reset();
		onClose();
	};

	const handleFormSubmit = (data: AddCompanyFormData) => {
		onSubmit(data);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<button
				type="button"
				aria-label="Cerrar modal"
				className="absolute inset-0 ui-overlay"
				onClick={handleClose}
			/>

			{/* Modal */}
			<div className="relative w-full max-w-lg  bg-card/95 border border-border rounded-2xl shadow-2xl p-6">
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-3">
						<div className=" bg-primary/20 p-2 rounded-lg">
							<Building2 className="h-6 w-6 text-primary" />
						</div>
						<div>
							<h2 className="text-xl font-black text-foreground uppercase tracking-wider">
								Agregar RUC
							</h2>
							<p className="text-sm text-muted-foreground">
								Sin costo adicional
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={handleClose}
						className="text-muted-foreground hover:text-foreground transition-colors"
						disabled={isSubmitting}
					>
						<X className="h-6 w-6" />
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
					{/* RUC */}
					<div>
						<label
							htmlFor="add-company-ruc"
							className="block text-sm font-medium text-foreground mb-2"
						>
							RUC <span className="text-red-400">*</span>
						</label>
						<input
							id="add-company-ruc"
							{...register("ruc")}
							type="text"
							placeholder="20123456789"
							maxLength={11}
							className="w-full  bg-card/70 border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors font-mono"
							disabled={isSubmitting}
						/>
						{errors.ruc && (
							<p className="text-sm text-red-400 mt-1">{errors.ruc.message}</p>
						)}
					</div>

					{/* Business Name */}
					<div>
						<label
							htmlFor="add-company-business-name"
							className="block text-sm font-medium text-foreground mb-2"
						>
							Razón Social <span className="text-red-400">*</span>
						</label>
						<input
							id="add-company-business-name"
							{...register("businessName")}
							type="text"
							placeholder="EMPRESA EJEMPLO S.A.C."
							className="w-full  bg-card/70 border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
							disabled={isSubmitting}
						/>
						{errors.businessName && (
							<p className="text-sm text-red-400 mt-1">
								{errors.businessName.message}
							</p>
						)}
					</div>

					{/* Trade Name (Optional) */}
					<div>
						<label
							htmlFor="add-company-trade-name"
							className="block text-sm font-medium text-foreground mb-2"
						>
							Nombre Comercial{" "}
							<span className="text-muted-foreground">(Opcional)</span>
						</label>
						<input
							id="add-company-trade-name"
							{...register("tradeName")}
							type="text"
							placeholder="Empresa Ejemplo"
							className="w-full  bg-card/70 border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
							disabled={isSubmitting}
						/>
					</div>

					{/* Address (Optional) */}
					<div>
						<label
							htmlFor="add-company-address"
							className="block text-sm font-medium text-foreground mb-2"
						>
							Dirección{" "}
							<span className="text-muted-foreground">(Opcional)</span>
						</label>
						<input
							id="add-company-address"
							{...register("address")}
							type="text"
							placeholder="Av. Principal 123, Lima"
							className="w-full  bg-card/70 border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
							disabled={isSubmitting}
						/>
					</div>

					{/* Error Message */}
					{error && (
						<div className=" bg-red-500/10 border border-red-500/20 rounded-lg p-3">
							<p className="text-sm text-red-400">{error.message}</p>
						</div>
					)}

					{/* Actions */}
					<div className="flex gap-3 pt-2">
						<button
							type="button"
							onClick={handleClose}
							className="flex-1  bg-card/70 hover:bg-muted/70 border border-border text-foreground font-medium py-3 rounded-lg transition-colors"
							disabled={isSubmitting}
						>
							Cancelar
						</button>
						<button
							type="submit"
							className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Agregando...
								</>
							) : (
								"Agregar RUC"
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
