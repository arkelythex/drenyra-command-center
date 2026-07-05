// Public API for Assets Feature
// Enforces FSD isolation boundaries.

// Query Keys
export { assetKeys } from "./api/query-keys";
// UI Components
export { AssetsView } from "./components/AssetsView";
// Hooks
export {
	useAssetDepreciation,
	useAssets,
	useAssetsValuation,
} from "./hooks/useAssets";
