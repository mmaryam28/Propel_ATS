/// <reference types="vite/client" />

// Extend ImportMetaEnv with your variables (add as needed)
interface ImportMetaEnv {
	readonly VITE_API_URL?: string;
	// add more: readonly VITE_SOME_FLAG?: string;
}

// Ensure TS knows about import.meta.env
interface ImportMeta {
	readonly env: ImportMetaEnv;
}
