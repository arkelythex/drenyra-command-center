import { useEffect, useCallback } from "react";
import { Command } from "cmdk";
import { useNavigate } from "@tanstack/react-router";
import { useThreadStore } from "../../../stores/thread-store";
import { useUIStore } from "../../../store/ui-store";
import {
  CommandPaletteStyles,
  NAV_TARGETS,
  ACTION_ITEMS,
} from "./CommandPalette.data";
import { CommandPaletteInput } from "./components/CommandPaletteInput";
import { CommandPaletteList } from "./components/CommandPaletteList";

export function CommandPalette() {
  const navigate = useNavigate();
  const threads = useThreadStore((s) => s.threads);
  const setActiveThread = useThreadStore((s) => s.setActiveThread);
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setOpen]);

  const handleSelect = useCallback(
    (callback: () => void) => {
      setOpen(false);
      callback();
    },
    [setOpen],
  );

  const activeThreads = threads.filter(
    (t) => t.status === "active" || t.status === "pinned",
  );

  return (
    <>
      <CommandPaletteStyles />
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Command Palette"
      >
        <CommandPaletteInput />
        <CommandPaletteList
          navTargets={NAV_TARGETS}
          actionItems={ACTION_ITEMS}
          activeThreads={activeThreads}
          onNavigate={(path) =>
            handleSelect(() => navigate({ to: path }))
          }
          onAction={(action) => handleSelect(action)}
          onSelectThread={(id) =>
            handleSelect(() => setActiveThread(id))
          }
        />
      </Command.Dialog>
    </>
  );
}
