import type { Session, User } from "../types/auth.types";

interface AuthSessionEnvelope {
	success?: boolean;
	data?: {
		session?: Session | null;
		user?: User | null;
	};
}

export async function readAuthSessionSnapshot(): Promise<{
	session: Session;
	user: User;
} | null> {
	try {
		const response = await fetch("/api/auth/session", {
			method: "GET",
			credentials: "include",
			headers: {
				Accept: "application/json",
			},
		});

		if (!response.ok) return null;

		const payload = (await response.json().catch(() => null)) as AuthSessionEnvelope | null;
		if (!payload?.success || !payload.data?.session || !payload.data?.user) {
			return null;
		}

		return {
			session: payload.data.session,
			user: payload.data.user,
		};
	} catch {
		return null;
	}
}

export function isAuthenticatedSessionSnapshot(
	snapshot: Awaited<ReturnType<typeof readAuthSessionSnapshot>>,
): snapshot is {
	session: Session;
	user: User;
} {
	return Boolean(snapshot?.session && snapshot?.user);
}
