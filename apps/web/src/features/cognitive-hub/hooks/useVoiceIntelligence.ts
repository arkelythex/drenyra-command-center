import { useCallback, useRef, useState } from "react";

/**
 * useVoiceIntelligence: Hook modular para captura de voz.
 * Encapsula la lógica de procesamiento de audio y estados de amplitud.
 */
export function useVoiceIntelligence() {
	const [isRecording, setIsRecording] = useState(false);
	const [amplitude, setAmplitude] = useState<number[]>(new Array(20).fill(0));
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	const startRecording = useCallback(() => {
		setIsRecording(true);
		// Simulación de procesamiento de frecuencia para la visualización
		timerRef.current = setInterval(() => {
			setAmplitude((prev) => prev.map(() => Math.random() * 100));
		}, 100);
	}, []);

	const stopRecording = useCallback(() => {
		setIsRecording(false);
		if (timerRef.current) clearInterval(timerRef.current);
		setAmplitude(new Array(20).fill(0));
	}, []);

	return {
		isRecording,
		amplitude,
		startRecording,
		stopRecording,
	};
}
