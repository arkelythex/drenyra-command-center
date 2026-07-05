import { AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "../hooks/useAuthSession";
import { UserMenu } from "./UserMenu";

export function AuthStatus() {
	const { user, isLoading, isAuthenticated } = useAuthSession();

	// Loading state
	if (isLoading) {
		return (
			<div className="flex items-center space-x-2">
				<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
				<span className="text-sm text-muted-foreground">
					Verificando sesión...
				</span>
			</div>
		);
	}

	// Authenticated state - show user menu
	if (isAuthenticated && user) {
		return (
			<div className="flex items-center space-x-2">
				{!user.emailVerified && (
					<Badge
						variant="outline"
						className="gap-1 border-amber-500/50 bg-amber-500/10 text-amber-600"
					>
						<AlertCircle className="h-3 w-3" />
						Email no verificado
					</Badge>
				)}
				<UserMenu />
			</div>
		);
	}

	// Not authenticated - show login/signup buttons
	return (
		<div className="flex items-center space-x-2">
			<Button variant="outline" size="sm" asChild>
				<a href="/login">Iniciar Sesión</a>
			</Button>
			<Button size="sm" asChild>
				<a href="/signup">Crear Cuenta</a>
			</Button>
		</div>
	);
}
