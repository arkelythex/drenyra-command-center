package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
)

const (
	ansiGreen  = "\033[32m"
	ansiYellow = "\033[33m"
	ansiCyan   = "\033[36m"
	ansiRed    = "\033[31m"
	ansiBold   = "\033[1m"
	ansiReset  = "\033[0m"
)

// ─── Parent: drenyra hooks ─────────────────────────────────────────────

var hooksCmd = &cobra.Command{
	Use:   "hooks",
	Short: "Manage Drenyra git hooks (pre-commit, pre-push, prepare-commit-msg)",
	Long: `Install, check, and manage Drenyra's git hooks.

Drenyra uses three hooks:
  pre-commit          Advisory readability check on staged files
  pre-push            Advisory diff-size and hot-path check before push
  prepare-commit-msg  Conventional commit scope hints

Commands:
  install   Symlink hooks from .hooks/ to .git/hooks/
  status    Check which hooks are installed
  remove    Remove Drenyra hooks from .git/hooks/`,
}

// ─── drenyra hooks install ──────────────────────────────────────────────

var hooksInstallCmd = &cobra.Command{
	Use:   "install",
	Short: "Install Drenyra git hooks",
	Long: `Symlink hooks from .hooks/ into .git/hooks/ for the current repository.

Runs:
  .hooks/pre-commit          → .git/hooks/pre-commit
  .hooks/pre-push            → .git/hooks/pre-push
  .hooks/prepare-commit-msg  → .git/hooks/prepare-commit-msg

Hooks are advisory and never block the commit/push.`,
	Args: cobra.NoArgs,
	RunE: func(_ *cobra.Command, _ []string) error {
		return installHooks()
	},
}

// ─── drenyra hooks status ───────────────────────────────────────────────

var hooksStatusCmd = &cobra.Command{
	Use:   "status",
	Short: "Show which Drenyra hooks are installed",
	Args:  cobra.NoArgs,
	RunE: func(_ *cobra.Command, _ []string) error {
		return statusHooks()
	},
}

// ─── drenyra hooks remove ───────────────────────────────────────────────

var hooksRemoveCmd = &cobra.Command{
	Use:   "remove",
	Short: "Remove Drenyra hooks from .git/hooks/",
	Args:  cobra.NoArgs,
	RunE: func(_ *cobra.Command, _ []string) error {
		return removeHooks()
	},
}

// ─── Hook names ─────────────────────────────────────────────────────────

var hookNames = []string{
	"pre-commit",
	"pre-push",
	"prepare-commit-msg",
}

func findGitDir() (string, error) {
	cwd, err := os.Getwd()
	if err != nil {
		return "", fmt.Errorf("getwd: %w", err)
	}

	dir := cwd
	for {
		gitPath := filepath.Join(dir, ".git")
		if info, err := os.Stat(gitPath); err == nil && info.IsDir() {
			return gitPath, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("not a git repository (no .git found from %s)", cwd)
		}
		dir = parent
	}
}

func ok(msg string) {
	fmt.Printf("%s✓%s %s\n", ansiGreen, ansiReset, msg)
}

func warn(msg string) {
	fmt.Printf("%s⚠ %s%s\n", ansiYellow, msg, ansiReset)
}

func info(msg string) {
	fmt.Printf("%sℹ %s%s\n", ansiCyan, msg, ansiReset)
}

func fail(msg string) {
	fmt.Printf("%s✗ %s%s\n", ansiRed, msg, ansiReset)
}

func installHooks() error {
	gitDir, err := findGitDir()
	if err != nil {
		return err
	}

	gitHooksDir := filepath.Join(gitDir, "hooks")
	if err := os.MkdirAll(gitHooksDir, 0o755); err != nil {
		return fmt.Errorf("mkdir .git/hooks: %w", err)
	}

	projectRoot := filepath.Dir(gitDir)
	hooksSrcDir := filepath.Join(projectRoot, ".hooks")

	if _, err := os.Stat(hooksSrcDir); os.IsNotExist(err) {
		return fmt.Errorf(".hooks/ directory not found at %s", hooksSrcDir)
	}

	installed := 0
	for _, name := range hookNames {
		src := filepath.Join(hooksSrcDir, name)
		dst := filepath.Join(gitHooksDir, name)

		if _, err := os.Lstat(dst); err == nil {
			if err := os.Remove(dst); err != nil {
				warn(fmt.Sprintf("Could not remove existing %s: %v", name, err))
				continue
			}
			info(fmt.Sprintf("Removed existing %s", name))
		}

		relSrc, err := filepath.Rel(gitHooksDir, src)
		if err != nil {
			relSrc = src
		}

		if err := os.Symlink(relSrc, dst); err != nil {
			warn(fmt.Sprintf("Could not install %s: %v", name, err))
			continue
		}
		installed++
		ok(fmt.Sprintf("Installed %s → %s", name, dst))
	}

	fmt.Printf("%s✔%s Installed %d/%d hooks\n", ansiGreen, ansiReset, installed, len(hookNames))
	return nil
}

func statusHooks() error {
	gitDir, err := findGitDir()
	if err != nil {
		return err
	}

	gitHooksDir := filepath.Join(gitDir, "hooks")
	projectRoot := filepath.Dir(gitDir)
	hooksSrcDir := filepath.Join(projectRoot, ".hooks")

	fmt.Printf("\n%s━━━ Drenyra Hooks Status ━━━%s\n\n", ansiBold, ansiReset)

	for _, hook := range hookNames {
		dst := filepath.Join(gitHooksDir, hook)

		if fi, err := os.Lstat(dst); err == nil {
			if fi.Mode()&os.ModeSymlink != 0 {
				if target, err := os.Readlink(dst); err == nil {
					targetAbs := filepath.Join(gitHooksDir, target)
					srcCheck := filepath.Clean(filepath.Join(hooksSrcDir, hook))
					if filepath.Clean(targetAbs) == srcCheck {
						ok(fmt.Sprintf("%s: installed", hook))
					} else {
						warn(fmt.Sprintf("%s: symlink points to %s (not Drenyra)", hook, target))
					}
				} else {
					warn(fmt.Sprintf("%s: broken symlink", hook))
				}
			} else {
				warn(fmt.Sprintf("%s: regular file (not Drenyra managed)", hook))
			}
		} else {
			info(fmt.Sprintf("%s: not installed", hook))
		}
	}

	return nil
}

func removeHooks() error {
	gitDir, err := findGitDir()
	if err != nil {
		return err
	}

	gitHooksDir := filepath.Join(gitDir, "hooks")
	projectRoot := filepath.Dir(gitDir)
	hooksSrcDir := filepath.Join(projectRoot, ".hooks")

	removed := 0
	for _, hook := range hookNames {
		dst := filepath.Join(gitHooksDir, hook)

		if fi, err := os.Lstat(dst); err == nil {
			if fi.Mode()&os.ModeSymlink != 0 {
				if target, err := os.Readlink(dst); err == nil {
					dstCheck := filepath.Clean(filepath.Join(gitHooksDir, target))
					srcCheck := filepath.Clean(filepath.Join(hooksSrcDir, hook))
					if dstCheck == srcCheck {
						if err := os.Remove(dst); err != nil {
							warn(fmt.Sprintf("Could not remove %s: %v", hook, err))
							continue
						}
						removed++
						ok(fmt.Sprintf("Removed %s", hook))
					} else {
						warn(fmt.Sprintf("Skipping %s — not a Drenyra hook", hook))
					}
				}
			} else {
				warn(fmt.Sprintf("Skipping %s — regular file, not a symlink", hook))
			}
		} else {
			info(fmt.Sprintf("%s: not installed, skipping", hook))
		}
	}

	if removed > 0 {
		fmt.Printf("%s✔%s Removed %d/%d hooks\n", ansiGreen, ansiReset, removed, len(hookNames))
	} else {
		info("No Drenyra hooks to remove")
	}

	return nil
}

func init() {
	hooksCmd.AddCommand(hooksInstallCmd)
	hooksCmd.AddCommand(hooksStatusCmd)
	hooksCmd.AddCommand(hooksRemoveCmd)
}
