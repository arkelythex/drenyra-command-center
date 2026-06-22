import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findMonorepoRoot(startDir) {
	let current = startDir;
	while (current !== path.dirname(current)) {
		if (
			existsSync(path.join(current, "package.json")) &&
			existsSync(path.join(current, "apps", "landing"))
		) {
			return current;
		}
		current = path.dirname(current);
	}
	return path.resolve(startDir, "../..");
}

const monorepoRoot = findMonorepoRoot(__dirname);

/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "standalone",
	productionBrowserSourceMaps: false,
	turbopack: {
		root: monorepoRoot,
	},
	compress: true,
	poweredByHeader: false,
	images: {
		formats: ["image/avif", "image/webp"],
		minimumCacheTTL: 31536000,
		deviceSizes: [640, 768, 1024, 1280, 1536],
	},
	async redirects() {
		return [
			{ source: "/v2", destination: "/", permanent: true },
			{ source: "/v2/:path*", destination: "/", permanent: true },
			{ source: "/verik", destination: "/drenyra", permanent: true },
			{ source: "/verik/:path*", destination: "/drenyra", permanent: true },
			{ source: "/kyro", destination: "/drenyra", permanent: true },
			{ source: "/kyro/:path*", destination: "/drenyra/:path*", permanent: true },
			{ source: "/flux", destination: "/ledger", permanent: true },
			{ source: "/firma", destination: "/studio", permanent: true },
			{ source: "/forge", destination: "/cortex", permanent: true },
			{ source: "/docs", destination: "/api", permanent: true },
			{ source: "/docs/", destination: "/api", permanent: true },
		];
	},
};

export default nextConfig;
