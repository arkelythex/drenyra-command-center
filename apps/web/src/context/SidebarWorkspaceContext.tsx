import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

const SIDEBAR_PREFS_KEY = "drenyra-sidebar-prefs-v2";
const STREAM_WIDTH_DEFAULT = 400;
const STREAM_WIDTH_MIN = 320;
const STREAM_WIDTH_MAX = 680;
const WORKSPACE_MODE_DEFAULT = true;

type SidebarPreferences = {
	isWorkspaceMode: boolean;
	streamWidth: number;
};

function readWorkspaceModeFromUrl(): boolean | null {
	if (typeof window === "undefined") {
		return null;
	}

	const workspace = new URLSearchParams(window.location.search).get(
		"workspace",
	);
	if (workspace === "1" || workspace === "true") {
		return true;
	}
	if (workspace === "0" || workspace === "false") {
		return false;
	}

	return null;
}

function clampStreamWidth(width: number): number {
	if (!Number.isFinite(width)) return STREAM_WIDTH_DEFAULT;
	return Math.min(STREAM_WIDTH_MAX, Math.max(STREAM_WIDTH_MIN, width));
}

function readInitialPreferences(): SidebarPreferences {
	if (typeof window === "undefined") {
		return {
			isWorkspaceMode: WORKSPACE_MODE_DEFAULT,
			streamWidth: STREAM_WIDTH_DEFAULT,
		};
	}

	const workspaceModeFromUrl = readWorkspaceModeFromUrl();
	if (workspaceModeFromUrl !== null) {
		return {
			isWorkspaceMode: workspaceModeFromUrl,
			streamWidth: STREAM_WIDTH_DEFAULT,
		};
	}

	try {
		const raw = window.localStorage.getItem(SIDEBAR_PREFS_KEY);
		if (!raw) {
			return {
				isWorkspaceMode: WORKSPACE_MODE_DEFAULT,
				streamWidth: STREAM_WIDTH_DEFAULT,
			};
		}

		const parsed = JSON.parse(raw) as Partial<SidebarPreferences>;
		return {
			isWorkspaceMode: parsed.isWorkspaceMode ?? WORKSPACE_MODE_DEFAULT,
			streamWidth: clampStreamWidth(parsed.streamWidth ?? STREAM_WIDTH_DEFAULT),
		};
	} catch {
		return {
			isWorkspaceMode: WORKSPACE_MODE_DEFAULT,
			streamWidth: STREAM_WIDTH_DEFAULT,
		};
	}
}

interface SidebarWorkspaceContextType {
	isWorkspaceMode: boolean;
	setIsWorkspaceMode: (v: boolean) => void;
	streamWidth: number;
	setStreamWidth: (v: number) => void;
}

const SidebarWorkspaceContext = createContext<
	SidebarWorkspaceContextType | undefined
>(undefined);

export const SidebarWorkspaceProvider: React.FC<{
	children: React.ReactNode;
}> = ({ children }) => {
	const [isWorkspaceMode, setIsWorkspaceMode] = useState(
		() => readInitialPreferences().isWorkspaceMode,
	);
	const [streamWidth, setStreamWidthState] = useState(
		() => readInitialPreferences().streamWidth,
	);

	const setStreamWidth = useCallback((value: number) => {
		setStreamWidthState(clampStreamWidth(value));
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const preferences: SidebarPreferences = {
			isWorkspaceMode,
			streamWidth: clampStreamWidth(streamWidth),
		};
		window.localStorage.setItem(SIDEBAR_PREFS_KEY, JSON.stringify(preferences));
	}, [isWorkspaceMode, streamWidth]);

	return (
		<SidebarWorkspaceContext.Provider
			value={{
				isWorkspaceMode,
				setIsWorkspaceMode,
				streamWidth,
				setStreamWidth,
			}}
		>
			{children}
		</SidebarWorkspaceContext.Provider>
	);
};

export const useSidebarWorkspace = (): SidebarWorkspaceContextType => {
	const context = useContext(SidebarWorkspaceContext);
	if (!context) {
		throw new Error(
			"useSidebarWorkspace must be used within SidebarWorkspaceProvider",
		);
	}
	return context;
};
