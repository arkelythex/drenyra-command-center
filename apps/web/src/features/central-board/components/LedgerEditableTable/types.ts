export interface EditableCellProps {
	value: string | number;
	type?: "text" | "money";
	onSave: (value: string) => void;
}
