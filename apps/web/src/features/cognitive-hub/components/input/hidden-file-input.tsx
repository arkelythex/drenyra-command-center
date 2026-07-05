import type { ChangeEvent, RefObject } from "react";

interface HiddenFileInputProps {
	inputRef: RefObject<HTMLInputElement | null>;
	onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function HiddenFileInput({ inputRef, onChange }: HiddenFileInputProps) {
	return (
		<input
			type="file"
			multiple
			ref={inputRef}
			className="hidden"
			aria-label="Adjuntar archivo"
			onChange={onChange}
		/>
	);
}
