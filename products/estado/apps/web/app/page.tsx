async function getDatasets() {
	try {
		const res = await fetch("http://localhost:8080/public/datasets", {
			cache: "no-store",
		});
		if (!res.ok) return [{ error: `API status ${res.status}` }];
		return res.json();
	} catch {
		return [{ error: "API not reachable. Start civictech-api on :8080." }];
	}
}

export default async function Home() {
	const datasets = await getDatasets();

	return (
		<main style={{ padding: 24 }}>
			<h1>CivicTech Peru</h1>
			<p>Transparencia (MVP-A) + Reportes (MVP-B)</p>
			<pre>{JSON.stringify(datasets, null, 2)}</pre>
		</main>
	);
}
