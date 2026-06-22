import { useCallback } from "react";

interface WindowWithAudio extends Window {
	webkitAudioContext?: typeof AudioContext;
}

/**
 * useSoundUI: Motor de retroalimentación auditiva minimalista.
 * Genera tonos sintetizados de alta fidelidad para interacciones agénticas.
 * Inspiración: iOS / VisionOS 2026.
 */
export function useSoundUI() {
	const playSound = useCallback(
		(type: "ping" | "success" | "alert" | "commit") => {
			if (typeof window === "undefined") return;

			const AudioCtx =
				window.AudioContext || (window as WindowWithAudio).webkitAudioContext;
			if (!AudioCtx) return;

			const ctx = new AudioCtx();
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();

			osc.connect(gain);
			gain.connect(ctx.destination);

			const now = ctx.currentTime;

			switch (type) {
				case "ping": // Sonido de entrada de mensaje o comando
					osc.type = "sine";
					osc.frequency.setValueAtTime(880, now);
					osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
					gain.gain.setValueAtTime(0.1, now);
					gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
					osc.start(now);
					osc.stop(now + 0.1);
					break;

				case "success": // Misión completada
					osc.type = "triangle";
					osc.frequency.setValueAtTime(440, now);
					osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
					gain.gain.setValueAtTime(0.1, now);
					gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
					osc.start(now);
					osc.stop(now + 0.2);
					break;

				case "commit": // Asiento contable registrado
					osc.type = "sine";
					osc.frequency.setValueAtTime(220, now);
					osc.frequency.setValueAtTime(440, now + 0.05);
					gain.gain.setValueAtTime(0.1, now);
					gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
					osc.start(now);
					osc.stop(now + 0.15);
					break;

				case "alert": // Anomalía Sentinel detectada
					osc.type = "square";
					osc.frequency.setValueAtTime(110, now);
					osc.frequency.setValueAtTime(165, now + 0.1);
					gain.gain.setValueAtTime(0.05, now);
					gain.gain.linearRampToValueAtTime(0, now + 0.3);
					osc.start(now);
					osc.stop(now + 0.3);
					break;
			}
		},
		[],
	);

	return { playSound };
}
