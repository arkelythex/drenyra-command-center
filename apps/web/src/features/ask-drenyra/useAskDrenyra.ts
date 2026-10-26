import { useCallback, useEffect, useRef, useState } from "react";
import { AskError, streamAsk } from "./ask-client";

export type AskStatus = "idle" | "streaming" | "done" | "error";

interface AskState {
	status: AskStatus;
	question: string;
	answer: string;
	error: string | null;
}

const IDLE: AskState = {
	status: "idle",
	question: "",
	answer: "",
	error: null,
};

/** One question at a time: a new question or unmount cancels the previous stream. */
export function useAskDrenyra(companyId: string | null | undefined) {
	const [state, setState] = useState<AskState>(IDLE);
	const controllerRef = useRef<AbortController | null>(null);

	useEffect(() => () => controllerRef.current?.abort(), []);

	const reset = useCallback(() => {
		controllerRef.current?.abort();
		setState(IDLE);
	}, []);

	const ask = useCallback(
		async (question: string) => {
			controllerRef.current?.abort();
			if (!companyId) {
				setState({
					status: "error",
					question,
					answer: "",
					error: "Selecciona una empresa para preguntarle a Drenyra.",
				});
				return;
			}
			const controller = new AbortController();
			controllerRef.current = controller;
			setState({ status: "streaming", question, answer: "", error: null });

			try {
				for await (const event of streamAsk({
					companyId,
					question,
					signal: controller.signal,
				})) {
					if (event.type === "token") {
						setState((current) => ({
							...current,
							answer: current.answer + event.text,
						}));
					}
				}
				setState((current) => ({ ...current, status: "done" }));
			} catch (cause) {
				if (controller.signal.aborted) return;
				const message =
					cause instanceof AskError
						? cause.message
						: "Drenyra no pudo responder. Inténtalo de nuevo.";
				setState((current) => ({
					...current,
					status: "error",
					error: message,
				}));
			}
		},
		[companyId],
	);

	return { ...state, ask, reset };
}
