import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import "@xterm/xterm/css/xterm.css";

interface TerminalShellProps {
	className?: string;
}

const WELCOME =
	"\r\n\x1b[32mDrenyra Terminal v0.1\x1b[0m — Type '\x1b[1mhelp\x1b[0m' for commands\r\n";

const HELP = [
	"Available commands:",
	"  \x1b[1m/doctor\x1b[0m   — Run system diagnostics",
	"  \x1b[1m/agents\x1b[0m   — List active agents",
	"  \x1b[1m/status\x1b[0m   — Show system status",
	"  \x1b[1mclear\x1b[0m     — Clear terminal",
	"  \x1b[1mhelp\x1b[0m      — Show this help message",
].join("\r\n");

const PROMPT = "\r\n\x1b[32m$\x1b[0m ";

function processCommand(term: Terminal, cmd: string) {
	if (!cmd) return;

	switch (cmd) {
		case "help":
			term.writeln(HELP);
			break;
		case "clear":
			term.clear();
			break;
		case "/doctor":
			term.writeln(
				"Running system diagnostics...\r\n\x1b[32m✓\x1b[0m All systems operational",
			);
			break;
		case "/agents":
			term.writeln(
				"Active agents:\r\n  \x1b[32m●\x1b[0m \x1b[1mCodex\x1b[0m — Primary coding agent\r\n  \x1b[32m●\x1b[0m \x1b[1mScribe\x1b[0m — Documentation agent\r\n  \x1b[33m●\x1b[0m \x1b[1mAerial\x1b[0m — Compliance agent (idle)",
			);
			break;
		case "/status":
			term.writeln(
				"System Status:\r\n  Memory: \x1b[32m✓\x1b[0m 1.2 GB / 8 GB\r\n  CPU:   \x1b[32m✓\x1b[0m 12%\r\n  Uptime: 2h 34m",
			);
			break;
		default:
			term.writeln(
				cmd.startsWith("/")
					? `\x1b[31mUnknown command:\x1b[0m ${cmd}`
					: `\x1b[33mCommand not found:\x1b[0m ${cmd}`,
			);
	}
}

export function TerminalShell({ className }: TerminalShellProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const buf = useRef("");
	const termRef = useRef<Terminal | null>(null);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		const fitAddon = new FitAddon();
		const term = new Terminal({
			cols: 80,
			rows: 10,
			cursorBlink: true,
			cursorStyle: "block",
			fontSize: 13,
			fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
			allowTransparency: true,
			theme: {
				background: "#0a0a0e",
				foreground: "#e4e4e7",
				cursor: "#e4e4e7",
				selectionBackground: "#ffffff20",
				black: "#0a0a0e",
				green: "#4ade80",
				white: "#e4e4e7",
				brightGreen: "#4ade80",
				brightWhite: "#ffffff",
			},
		});

		termRef.current = term;
		term.loadAddon(fitAddon);
		term.open(el);
		fitAddon.fit();

		term.writeln(WELCOME);
		term.write(PROMPT);

		term.onKey(({ key, domEvent }) => {
			if (domEvent.ctrlKey && domEvent.keyCode === 67) {
				term.write("^C");
				term.write(PROMPT);
				buf.current = "";
				return;
			}

			if (domEvent.keyCode === 13) {
				const cmd = buf.current.trim();
				term.writeln("");
				processCommand(term, cmd);
				buf.current = "";
				term.write(PROMPT);
				return;
			}

			if (domEvent.keyCode === 8 || domEvent.keyCode === 127) {
				if (buf.current.length > 0) {
					buf.current = buf.current.slice(0, -1);
					term.write("\b \b");
				}
				return;
			}

			if (key.length === 1) {
				buf.current += key;
				term.write(key);
			}
		});

		const ro = new ResizeObserver(() => {
			try {
				fitAddon.fit();
			} catch {
				/* noop */
			}
		});
		ro.observe(el);

		setTimeout(() => term.focus(), 100);

		return () => {
			ro.disconnect();
			term.dispose();
			termRef.current = null;
		};
	}, []);

	return (
		<div
			ref={containerRef}
			className={cn(
				"h-full w-full overflow-hidden font-mono tabular-nums",
				className,
			)}
			style={{ fontSize: "var(--text-sm)" }}
		/>
	);
}
