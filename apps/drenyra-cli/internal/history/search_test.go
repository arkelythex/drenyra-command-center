package history

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestSearch(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("HOME", dir)
	_ = os.MkdirAll(filepath.Join(dir, ".drenyra"), 0o755)

	e1 := Entry{At: time.Now(), Task: "conciliar SUNAT", Status: "ok"}
	e2 := Entry{At: time.Now(), Task: "refactor payroll", Status: "ok"}
	for _, e := range []Entry{e1, e2} {
		_ = Append(e)
	}

	got, err := Search("sunat", 10)
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 1 || got[0].Task != "conciliar SUNAT" {
		t.Fatalf("got %+v", got)
	}
}

func TestRecentLimitReturnsNewestLast(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("HOME", dir)

	for i := range 10 {
		if err := Append(Entry{At: time.Now(), Task: fmt.Sprintf("task-%02d", i), Status: "ok"}); err != nil {
			t.Fatal(err)
		}
	}

	got, err := Recent(3)
	if err != nil {
		t.Fatal(err)
	}
	want := []string{"task-07", "task-08", "task-09"}
	if len(got) != len(want) {
		t.Fatalf("len=%d want %d: %+v", len(got), len(want), got)
	}
	for i, wantTask := range want {
		if got[i].Task != wantTask {
			t.Fatalf("got[%d]=%q want %q", i, got[i].Task, wantTask)
		}
	}
}

func TestRecentLimitSkipsInvalidTailLines(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("HOME", dir)
	path := writeHistoryLines(t, dir,
		marshalEntry(t, Entry{At: time.Now(), Task: "old", Status: "ok"}),
		"not-json",
		marshalEntry(t, Entry{At: time.Now(), Task: "new", Status: "ok"}),
	)
	if _, err := os.Stat(path); err != nil {
		t.Fatal(err)
	}

	got, err := Recent(2)
	if err != nil {
		t.Fatal(err)
	}
	want := []string{"old", "new"}
	if len(got) != len(want) {
		t.Fatalf("len=%d want %d: %+v", len(got), len(want), got)
	}
	for i, wantTask := range want {
		if got[i].Task != wantTask {
			t.Fatalf("got[%d]=%q want %q", i, got[i].Task, wantTask)
		}
	}
}

func TestRecentTasksReturnsUniqueNewestFirst(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("HOME", dir)

	for _, task := range []string{"alpha", "beta", "alpha", "gamma", "beta", "delta"} {
		if err := Append(Entry{At: time.Now(), Task: task, Status: "ok"}); err != nil {
			t.Fatal(err)
		}
	}

	got, err := RecentTasks(3)
	if err != nil {
		t.Fatal(err)
	}
	want := []string{"delta", "beta", "gamma"}
	if strings.Join(got, "|") != strings.Join(want, "|") {
		t.Fatalf("got %v want %v", got, want)
	}
}

func TestRecentLimitHandlesLongHistoryLines(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("HOME", dir)
	longTask := strings.Repeat("x", 128*1024)
	writeHistoryLines(t, dir,
		marshalEntry(t, Entry{At: time.Now(), Task: longTask, Status: "ok"}),
		marshalEntry(t, Entry{At: time.Now(), Task: "recent-1", Status: "ok"}),
		marshalEntry(t, Entry{At: time.Now(), Task: "recent-2", Status: "ok"}),
	)

	got, err := Recent(2)
	if err != nil {
		t.Fatal(err)
	}
	want := []string{"recent-1", "recent-2"}
	if len(got) != len(want) {
		t.Fatalf("len=%d want %d: %+v", len(got), len(want), got)
	}
	for i, wantTask := range want {
		if got[i].Task != wantTask {
			t.Fatalf("got[%d]=%q want %q", i, got[i].Task, wantTask)
		}
	}
}

func writeHistoryLines(t *testing.T, home string, lines ...string) string {
	t.Helper()
	dir := filepath.Join(home, ".drenyra")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(dir, "history.jsonl")
	if err := os.WriteFile(path, []byte(strings.Join(lines, "\n")+"\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	return path
}

func marshalEntry(t *testing.T, entry Entry) string {
	t.Helper()
	data, err := json.Marshal(entry)
	if err != nil {
		t.Fatal(err)
	}
	return string(data)
}
