import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { toast } from "sonner";
import { DEMO_EVENTS } from "./simulation-demo-events";
import { SimulationToastCard } from "./simulation-toast-card";

interface SimulationContextType {
	isActive: boolean;
	toggleSimulation: () => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(
	undefined,
);

export const useSimulation = () => {
	const context = useContext(SimulationContext);
	if (!context)
		throw new Error("useSimulation must be used within a SimulationProvider");
	return context;
};

interface SimulationProviderProps {
	children: ReactNode;
	enabled?: boolean;
}

const IS_DEV = typeof window !== "undefined" && import.meta.env?.DEV === true;

/**
 * SimulationProvider: demo-only context for development.
 * In production, renders children without simulation logic.
 */
export const SimulationProvider = ({
	children,
	enabled = true,
}: SimulationProviderProps) => {
	const [isActive, setIsActive] = useState(false);
	const showDemoEvent = useCallback(() => {
		if (!IS_DEV) return;
		const event = DEMO_EVENTS[Math.floor(Math.random() * DEMO_EVENTS.length)];

		toast.custom(
			(toastRecord) => (
				<SimulationToastCard event={event} toastId={toastRecord} />
			),
			{ duration: event.duration },
		);
	}, []);

	useEffect(() => {
		if (!IS_DEV || !enabled || !isActive) return;

		const scheduleNextEvent = () => {
			const delay = Math.floor(Math.random() * (45000 - 15000 + 1) + 15000);
			return setTimeout(() => {
				showDemoEvent();
				timer = scheduleNextEvent();
			}, delay);
		};

		let timer = scheduleNextEvent();
		return () => clearTimeout(timer);
	}, [enabled, isActive, showDemoEvent]);

	const toggleSimulation = useCallback(() => {
		setIsActive((currentValue) => !currentValue);
	}, []);

	return (
		<SimulationContext.Provider value={{ isActive, toggleSimulation }}>
			{children}
		</SimulationContext.Provider>
	);
};
