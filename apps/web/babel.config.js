/**
 * Babel configuration for Arkalythix Web
 * Includes React Compiler for automatic memoization (2026)
 */
export const plugins = [
	[
		"babel-plugin-react-compiler",
		{
			target: "19", // React 19
			// compilationMode: 'annotation', // Uncomment to only compile annotated functions
		},
	],
];

export const presets = [["@babel/preset-typescript"]];
