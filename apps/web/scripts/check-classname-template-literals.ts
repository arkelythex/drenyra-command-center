import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const sourceRoot = join(process.cwd(), "src");
const targetExtensions = new Set([".ts", ".tsx"]);

interface Finding {
	file: string;
	line: number;
	text: string;
}

function hasTargetExtension(filePath: string): boolean {
	return Array.from(targetExtensions).some((extension) =>
		filePath.endsWith(extension),
	);
}

function collectSourceFiles(directory: string): string[] {
	return readdirSync(directory).flatMap((entry) => {
		const fullPath = join(directory, entry);
		const stats = statSync(fullPath);

		if (stats.isDirectory()) {
			return collectSourceFiles(fullPath);
		}

		return stats.isFile() && hasTargetExtension(fullPath) ? [fullPath] : [];
	});
}

function findUnsafeTokenTemplateLiterals(filePath: string): Finding[] {
	const content = readFileSync(filePath, "utf8");
	const lines = content.split(/\r?\n/);

	return lines.flatMap((line, index) => {
		const embedsTokenHelperInsideString =
			line.includes('className="') && line.includes("${tokensToClasses");

		if (!embedsTokenHelperInsideString) {
			return [];
		}

		return [
			{
				file: relative(process.cwd(), filePath),
				line: index + 1,
				text: line.trim(),
			},
		];
	});
}

const findings = collectSourceFiles(sourceRoot).flatMap((filePath) =>
	findUnsafeTokenTemplateLiterals(filePath),
);

if (findings.length > 0) {
	console.error(
		"[check:classnames] Found tokensToClasses embedded inside a quoted className string. Use cn(tokensToClasses..., '...') instead.",
	);
	for (const finding of findings) {
		console.error(`${finding.file}:${finding.line} ${finding.text}`);
	}
	process.exit(1);
}

console.log(
	"[check:classnames] No unsafe tokensToClasses className strings found.",
);
