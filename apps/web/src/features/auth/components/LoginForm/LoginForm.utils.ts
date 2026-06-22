export function resolveSafeLoginRedirect(search: string): string {
	const redirect = new URLSearchParams(search).get("redirect");

	if (!redirect) return "/";

	const isSameAppPath =
		redirect.startsWith("/") &&
		!redirect.startsWith("//") &&
		!redirect.includes("://");

	return isSameAppPath ? redirect : "/";
}
