import { useNavigate } from "@tanstack/react-router";
import { Clock, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { captureError } from "@/lib/monitoring";
import { useAuthStore } from "../hooks/useAuth";
import { useAuthSession } from "../hooks/useAuthSession";

/**
 * SessionExpiryNotification
 *
 * Monitors session expiration and shows notifications:
 * - Toast at 5 minutes before expiry
 * - Modal dialog at 1 minute before expiry with "Extend Session" button
 * - Auto-logout when session expires
 *
 * Should be rendered once in the app root (MainLayout or similar).
 *
 * @example
 * ```tsx
 * <MainLayout>
 *   <SessionExpiryNotification />
 *   {children}
 * </MainLayout>
 * ```
 */
// SECURITY: Rate limiting constants
const MAX_EXTENSIONS_PER_HOUR = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_STORAGE_KEY = "session-extension-timestamps";

export function SessionExpiryNotification() {
	const { session, isAuthenticated } = useAuthSession();
	const { logout } = useAuthStore();
	const navigate = useNavigate();

	const [showModal, setShowModal] = useState(false);
	const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
	const [isExtending, setIsExtending] = useState(false);
	const [hasShownToast, setHasShownToast] = useState(false);

	const handleSessionExpired = async () => {
		setShowModal(false);

		toast.error("Sesión expirada", {
			description: "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
			duration: 5000,
		});

		await logout();
		navigate({ to: "/login", search: { redirect: window.location.pathname } });
	};

	const handleExtendSession = async () => {
		// SECURITY FIX: Rate limiting to prevent abuse
		// Check if user has exceeded extension limit
		const now = Date.now();
		const storedTimestamps = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
		let extensionTimestamps: number[] = storedTimestamps
			? JSON.parse(storedTimestamps)
			: [];

		// Remove timestamps older than 1 hour
		extensionTimestamps = extensionTimestamps.filter(
			(timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
		);

		// Check if limit exceeded
		if (extensionTimestamps.length >= MAX_EXTENSIONS_PER_HOUR) {
			const oldestExtension = Math.min(...extensionTimestamps);
			const timeUntilNextAllowed =
				RATE_LIMIT_WINDOW_MS - (now - oldestExtension);
			const minutesRemaining = Math.ceil(timeUntilNextAllowed / (60 * 1000));

			toast.error("Límite de extensiones alcanzado", {
				description: `Has alcanzado el límite de ${MAX_EXTENSIONS_PER_HOUR} extensiones por hora. Podrás extender nuevamente en ${minutesRemaining} minutos.`,
				duration: 8000,
			});
			return;
		}

		setIsExtending(true);
		try {
			// Refresh session by making a session request
			// BetterAuth automatically extends session on any authenticated request
			await authClient.getSession();

			// SECURITY: Record this extension for rate limiting
			extensionTimestamps.push(now);
			localStorage.setItem(
				RATE_LIMIT_STORAGE_KEY,
				JSON.stringify(extensionTimestamps),
			);

			const remainingExtensions =
				MAX_EXTENSIONS_PER_HOUR - extensionTimestamps.length;

			toast.success("Sesión extendida", {
				description: `Tu sesión ha sido extendida exitosamente. Extensiones restantes: ${remainingExtensions}`,
			});

			setShowModal(false);
			setHasShownToast(false);
		} catch (error) {
			captureError(
				error instanceof Error ? error : new Error("Session extension failed"),
				{
					remainingMs: timeRemaining,
					source: "features/auth/SessionExpiryNotification.handleExtendSession",
				},
			);
			toast.error("Error al extender sesión", {
				description:
					"No pudimos extender tu sesión. Por favor inicia sesión nuevamente.",
			});

			await handleSessionExpired();
		} finally {
			setIsExtending(false);
		}
	};

	const formatTimeRemaining = (ms: number): string => {
		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;

		if (minutes > 0) {
			return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
		}
		return `${seconds}s`;
	};

	useEffect(() => {
		if (!isAuthenticated || !session?.expiresAt) {
			setShowModal(false);
			setHasShownToast(false);
			return;
		}

		const checkExpiry = () => {
			const expiresAt = new Date(session.expiresAt).getTime();
			const now = Date.now();
			const remaining = expiresAt - now;

			setTimeRemaining(remaining);

			// Session expired - auto logout
			if (remaining <= 0) {
				handleSessionExpired();
				return;
			}

			// 1 minute warning - show modal
			if (remaining <= 60 * 1000) {
				setShowModal(true);
				return;
			}

			// 5 minute warning - show toast (once)
			if (remaining <= 5 * 60 * 1000 && !hasShownToast) {
				setHasShownToast(true);
				toast.warning("Tu sesión expirará pronto", {
					description: "Tu sesión expirará en 5 minutos. Guarda tu trabajo.",
					icon: <Clock className="h-4 w-4" />,
					duration: 10000,
				});
			}
		};

		// Check immediately
		checkExpiry();

		// Check every 10 seconds
		const interval = setInterval(checkExpiry, 10000);

		return () => clearInterval(interval);
	}, [session, isAuthenticated, hasShownToast]);

	// Modal dialog
	if (!showModal || !timeRemaining) {
		return null;
	}

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 z-50 bg-background/50" aria-hidden="true" />

			{/* Modal */}
			<div className="fixed inset-0 flex items-center justify-center z-50 p-4">
				<div className="w-full max-w-md rounded-2xl border border-border bg-card/95 p-6 shadow-xl ">
					{/* Icon */}
					<div className="flex justify-center mb-4">
						<div className="h-16 w-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
							<Clock className="h-8 w-8 text-yellow-500" />
						</div>
					</div>

					{/* Content */}
					<div className="text-center mb-6">
						<h2 className="text-2xl font-bold text-foreground mb-2">
							Sesión por expirar
						</h2>
						<p className="text-muted-foreground mb-4">
							Tu sesión expirará en{" "}
							<span className="font-mono font-bold text-yellow-500">
								{formatTimeRemaining(timeRemaining)}
							</span>
						</p>
						<p className="text-sm text-muted-foreground/80">
							¿Deseas extender tu sesión? Si no actúas, serás desconectado
							automáticamente.
						</p>
					</div>

					{/* Actions */}
					<div className="flex flex-col gap-3">
						<button
							type="button"
							onClick={handleExtendSession}
							disabled={isExtending}
							className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<RefreshCw
								className={`h-4 w-4 ${isExtending ? "animate-spin" : ""}`}
							/>
							{isExtending ? "Extendiendo..." : "Extender sesión"}
						</button>

						<button
							type="button"
							onClick={handleSessionExpired}
							disabled={isExtending}
							className="w-full px-6 py-3 text-muted-foreground hover:text-foreground hover:bg-muted/70 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring/30"
						>
							Cerrar sesión
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
