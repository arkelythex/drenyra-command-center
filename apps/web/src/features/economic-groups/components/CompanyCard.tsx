import type React from "react";
/**
 * CompanyCard Component
 * Displays a single company/RUC in the Economic Group
 */

import { Building2 } from "lucide-react";

interface Company {
	id: string;
	ruc: string;
	businessName: string;
	tradeName?: string | null;
	isPrimary: boolean;
	isActive: boolean;
}

interface CompanyCardProps {
	company: Company;
	onClick?: () => void;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({
	company,
	onClick,
}) => {
	const className = `
     bg-card/70 border border-border rounded-xl p-6
    transition-[background-color,border-color,box-shadow] duration-200 text-left
    ${onClick ? "hover:bg-muted/70 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background" : ""}
  `;
	const content = <CompanyCardContent company={company} />;

	if (onClick) {
		return (
			<button
				type="button"
				onClick={onClick}
				aria-label={`Seleccionar ${company.businessName} RUC ${company.ruc}`}
				className={className}
			>
				{content}
			</button>
		);
	}

	return <article className={className}>{content}</article>;
};

function CompanyCardContent({ company }: { company: Company }) {
	return (
		<>
			<div className="flex items-start justify-between">
				<Building2 className="h-8 w-8 text-primary" />
				{company.isPrimary && (
					<span className="text-xs font-black bg-primary/20 text-primary px-2 py-1 rounded uppercase">
						Principal
					</span>
				)}
			</div>

			<h3 className="text-lg font-bold text-foreground mt-4 line-clamp-2">
				{company.businessName}
			</h3>

			{company.tradeName && (
				<p className="text-sm text-muted-foreground mt-1">
					{company.tradeName}
				</p>
			)}

			<p className="text-sm text-muted-foreground font-mono mt-2">
				RUC: {company.ruc}
			</p>

			{!company.isActive && (
				<div className="mt-3 text-xs text-red-400 font-bold">INACTIVA</div>
			)}
		</>
	);
}
