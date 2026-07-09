package cmd

import (
	"os"
	"path/filepath"
	"testing"
)

func TestFindGitDir(t *testing.T) {
	tmpDir := t.TempDir()
	gitDir := filepath.Join(tmpDir, ".git")
	if err := os.MkdirAll(gitDir, 0o755); err != nil {
		t.Fatal(err)
	}

	origWd, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}
	defer os.Chdir(origWd)

	found, err := findGitDir()
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if found != gitDir {
		t.Fatalf("expected %s, got %s", gitDir, found)
	}
}

func TestFindGitDir_NotFound(t *testing.T) {
	tmpDir := t.TempDir()

	origWd, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}
	defer os.Chdir(origWd)

	_, err = findGitDir()
	if err == nil {
		t.Fatal("expected error for non-git directory")
	}
}

func TestInstallAndRemoveHooks(t *testing.T) {
	tmpDir := t.TempDir()

	// Create .git directory
	gitDir := filepath.Join(tmpDir, ".git")
	if err := os.MkdirAll(filepath.Join(gitDir, "hooks"), 0o755); err != nil {
		t.Fatal(err)
	}

	// Create .hooks with hook scripts in project root
	hooksSrcDir := filepath.Join(tmpDir, ".hooks")
	if err := os.MkdirAll(hooksSrcDir, 0o755); err != nil {
		t.Fatal(err)
	}

	hooksContent := "#!/usr/bin/env bash\nexit 0\n"
	for _, name := range hookNames {
		if err := os.WriteFile(filepath.Join(hooksSrcDir, name), []byte(hooksContent), 0o755); err != nil {
			t.Fatal(err)
		}
	}

	origWd, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}
	defer os.Chdir(origWd)

	// Install hooks
	if err := installHooks(); err != nil {
		t.Fatalf("installHooks() error: %v", err)
	}

	// Verify all three hooks are installed as symlinks
	for _, name := range hookNames {
		hookPath := filepath.Join(gitDir, "hooks", name)
		fi, err := os.Lstat(hookPath)
		if err != nil {
			t.Fatalf("expected %s to exist: %v", name, err)
		}
		if fi.Mode()&os.ModeSymlink == 0 {
			t.Fatalf("expected %s to be a symlink", name)
		}
	}

	// Remove hooks
	if err := removeHooks(); err != nil {
		t.Fatalf("removeHooks() error: %v", err)
	}

	// Verify hooks are removed
	for _, name := range hookNames {
		hookPath := filepath.Join(gitDir, "hooks", name)
		if _, err := os.Lstat(hookPath); err == nil {
			t.Fatalf("expected %s to be removed", name)
		}
	}
}

func TestInstallHooks_MissingDotHooks(t *testing.T) {
	tmpDir := t.TempDir()

	gitDir := filepath.Join(tmpDir, ".git")
	if err := os.MkdirAll(gitDir, 0o755); err != nil {
		t.Fatal(err)
	}

	origWd, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}
	defer os.Chdir(origWd)

	err = installHooks()
	if err == nil {
		t.Fatal("expected error when .hooks/ is missing")
	}
}

func TestStatusHooks_NoneInstalled(t *testing.T) {
	tmpDir := t.TempDir()

	gitDir := filepath.Join(tmpDir, ".git")
	if err := os.MkdirAll(gitDir, 0o755); err != nil {
		t.Fatal(err)
	}

	origWd, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Chdir(tmpDir); err != nil {
		t.Fatal(err)
	}
	defer os.Chdir(origWd)

	// Should not error when no hooks installed
	if err := statusHooks(); err != nil {
		t.Fatalf("statusHooks() error: %v", err)
	}
}
