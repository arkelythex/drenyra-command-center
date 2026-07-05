import { useLocation, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import type React from "react";
import { useEffect } from "react";
import { useAuthSession } from "../hooks/useAuthSession";

interface ProtectedRouteProps {
	children: React.ReactNode;
	requireEmailVerified?: boolean;
}

export function ProtectedRoute({
	children,
	requireEmailVerified = false,
}: ProtectedRouteProps) {
	const { session, user, isLoading, isAuthenticated } = useAuthSession();
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			// Save intended destination
			const redirectUrl = `${location.pathname}${location.search}`;

			navigate({
				to: "/login",
				search: { redirect: redirectUrl },
			});
		}
	}, [isAuthenticated, isLoading, navigate, location]);

	// Loading state
	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-app-shell">
				<div className="text-center space-y-4">
					<Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
					<p className="text-muted-foreground text-sm">Verificando sesión...</p>
				</div>
			</div>
		);
	}

	// Not authenticated
	if (!isAuthenticated || !session) {
		return null; // Will redirect via useEffect
	}

	// Email verification required but not verified
	if (requireEmailVerified && user && !user.emailVerified) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-app-shell px-4">
				<div className="max-w-md w-full space-y-6 text-center">
					<div className="space-y-2">
						<h2 className="text-2xl font-bold text-foreground">
							Email no verificado
						</h2>
						<p className="text-muted-foreground">
							Por favor verifica tu email para acceder a esta funcionalidad.
						</p>
					</div>
					<button
						onClick={() => navigate({ to: "/" })}
						className="text-primary hover:underline text-sm"
					>
						Volver al dashboard
					</button>
				</div>
			</div>
		);
	}

	// Authenticated and verified (if required)
	return <>{children}</>;
}
