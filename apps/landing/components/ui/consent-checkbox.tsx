"use client";

import type { ReactElement } from "react";

type ConsentCheckboxProps = {
	checked: boolean;
	id: string;
	label: ReactElement | string;
	onCheckedChange: (checked: boolean) => void;
	required?: boolean;
};

export function ConsentCheckbox({
	checked,
	id,
	label,
	onCheckedChange,
	required = true,
}: ConsentCheckboxProps): ReactElement {
	return (
		<label
			htmlFor={id}
			className="mt-4 flex items-start gap-3 text-left text-xs leading-5 text-muted-foreground"
		>
			<input
				id={id}
				name={id}
				type="checkbox"
				checked={checked}
				onChange={(event) => onCheckedChange(event.target.checked)}
				required={required}
				className="mt-1 h-4 w-4 rounded border-foreground/20 bg-background"
			/>
			<span>{label}</span>
		</label>
	);
}
