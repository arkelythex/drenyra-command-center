/**
 * Drenyra TUI — Main Ink application.
 */

import React, { useState, useEffect } from "react";
import { render, Text, Box, Static } from "ink";
import { listSessions } from "../client.js";
import type { AgentSession } from "../types.js";

interface AppProps {
	refreshInterval?: number;
}

function SessionRow({ session }: { session: AgentSession }) {
	const statusColor =
		session.status === "running"
			? "green"
			: session.status === "paused"
				? "yellow"
				: session.status === "failed"
					? "red"
					: "white";

	const riskIcon =
		session.risk === "critical"
			? "🔴"
			: session.risk === "high"
				? "🟠"
				: session.risk === "medium"
					? "🟡"
					: "🟢";

	return (
		<Box>
			<Text>
				{riskIcon} <Text color={statusColor}>{session.status.padEnd(10)}</Text>{" "}
				<Text bold>{session.agentName.padEnd(20)}</Text>{" "}
				<Text dimColor>{session.phase?.padEnd(15) ?? "-".padEnd(15)}</Text>{" "}
				<Text>{`${session.progress}%`.padEnd(6)}</Text>{" "}
				<Text dimColor>{session.id.slice(0, 8)}</Text>
			</Text>
		</Box>
	);
}

function App({ refreshInterval = 5000 }: AppProps) {
	const [sessions, setSessions] = useState<AgentSession[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [lastUpdate, setLastUpdate] = useState<string>("");

	useEffect(() => {
		let mounted = true;

		async function fetchSessions() {
			try {
				const res = await listSessions();
				if (mounted) {
					if (res.success && res.data) {
						setSessions(res.data);
						setError(null);
					} else {
						setError(res.error?.message ?? "Unknown error");
					}
					setLastUpdate(new Date().toLocaleTimeString());
				}
			} catch (err) {
				if (mounted) {
					setError(err instanceof Error ? err.message : "Connection failed");
					setLastUpdate(new Date().toLocaleTimeString());
				}
			}
		}

		fetchSessions();
		const interval = setInterval(fetchSessions, refreshInterval);
		return () => {
			mounted = false;
			clearInterval(interval);
		};
	}, [refreshInterval]);

	return (
		<Box flexDirection="column" padding={1}>
			<Box marginBottom={1}>
				<Text bold underline>
					Drenyra Agent Sessions
				</Text>
			</Box>

			<Box>
				<Text dimColor>
					{"Status".padEnd(12)}
					{"Agent".padEnd(22)}
					{"Phase".padEnd(17)}
					{"Progress".padEnd(8)}
					{"ID"}
				</Text>
			</Box>
			<Box>
				<Text dimColor>
					{"─".repeat(60)}
				</Text>
			</Box>

			{sessions.length === 0 && !error && (
				<Box>
					<Text dimColor>No active sessions</Text>
				</Box>
			)}

			{error && (
				<Box>
					<Text color="red">⚠ {error}</Text>
				</Box>
			)}

			{sessions.map((s) => (
				<SessionRow key={s.id} session={s} />
			))}

			<Box marginTop={1}>
				<Text dimColor>
					{`${sessions.length} session(s) · Last update: ${lastUpdate}`}
				</Text>
			</Box>
		</Box>
	);
}

export function renderTUI(): void {
	render(<App />);
}
