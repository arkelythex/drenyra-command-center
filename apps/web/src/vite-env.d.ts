/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_URL?: string;
	readonly VITE_APP_TITLE?: string;
	readonly VITE_ENABLE_API_MOCK?: string;
	readonly VITE_ENABLE_DEMO_AUTH?: string;
	readonly [key: string]: string | undefined;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
