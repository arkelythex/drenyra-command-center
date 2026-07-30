// Stub — API client
export const api = {
	url: "",
	async get(path: string) {
		const res = await fetch(`${this.url}${path}`);
		return res.json();
	},
	async post(path: string, body: unknown) {
		const res = await fetch(`${this.url}${path}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
		return res.json();
	},
};
