import { Button } from "@/components/ui/button";
import { useBatchValidate } from "../hooks/useEvidence";

interface BatchValidateButtonProps {
	evidenceIds: string[];
	onComplete?: () => void;
}

export function BatchValidateButton({
	evidenceIds,
	onComplete,
}: BatchValidateButtonProps) {
	const batchValidate = useBatchValidate();
	const count = evidenceIds.length;

	return (
		<div>
			<Button
				type="button"
				disabled={count === 0 || batchValidate.isPending}
				onClick={() => batchValidate.mutate(evidenceIds, { onSuccess: onComplete })}
			>
				{batchValidate.isPending
					? "Validando..."
					: `Validar ${count} ${count === 1 ? "documento" : "documentos"}`}
			</Button>
			{batchValidate.isError && (
				<p className="mt-2 text-xs text-[var(--color-danger-text)]">
					{batchValidate.error.message}
				</p>
			)}
		</div>
	);
}
