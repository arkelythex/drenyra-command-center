// Stub — Auth client
import type { Session, User } from "../features/auth/types/auth.types";

type AuthResult =
	| { data: { session: Session; user: User }; error: null }
	| { data: null; error: Error };

export const authClient = {
	async signIn(email: string, password: string): Promise<AuthResult> {
		const res = await fetch("/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
		});
		if (!res.ok) return { data: null, error: new Error("Login failed") };
		return { data: await res.json(), error: null };
	},
	async signOut() {
		await fetch("/api/auth/logout", { method: "POST" });
	},
	async getSession(): Promise<Session | null> {
		const res = await fetch("/api/auth/session");
		if (!res.ok) return null;
		return (await res.json()).session ?? null;
	},
};
