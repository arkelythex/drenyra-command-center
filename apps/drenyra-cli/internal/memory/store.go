package memory

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

// Target is a Hermes memory store: memory (agent notes) or user (profile).
type Target string

const (
	TargetMemory Target = "memory"
	TargetUser   Target = "user"
)

// Store is bounded curated memory with §-delimited entries (Hermes MemoryStore).
type Store struct {
	settings Settings
	mu       sync.Mutex
}

func NewStore(settings Settings) *Store {
	return &Store{settings: settings}
}

// LoadSnapshot reads disk and builds frozen snapshot for harness injection.
func (st *Store) LoadSnapshot() (Snapshot, error) {
	st.mu.Lock()
	defer st.mu.Unlock()

	if err := EnsureDefaults(); err != nil {
		return Snapshot{}, err
	}
	return st.loadSnapshotLocked()
}

// LoadSnapshotReadOnly reads disk without creating seed files or directories.
func (st *Store) LoadSnapshotReadOnly() (Snapshot, error) {
	st.mu.Lock()
	defer st.mu.Unlock()
	return st.loadSnapshotLocked()
}

func (st *Store) loadSnapshotLocked() (Snapshot, error) {
	memPath, userPath, err := Paths()
	if err != nil {
		return Snapshot{}, err
	}

	memEntries := st.readSnapshotEntries(memPath, st.settings.MemoryCharLimit)
	userEntries := st.readSnapshotEntries(userPath, st.settings.UserCharLimit)

	snap := Snapshot{
		MemoryPath:   memPath,
		UserPath:     userPath,
		MemoryLimit:  st.settings.MemoryCharLimit,
		UserLimit:    st.settings.UserCharLimit,
		MemoryBlocks: st.renderBlock(TargetMemory, memEntries),
		UserBlocks:   st.renderBlock(TargetUser, userEntries),
	}
	if st.settings.MemoryEnabled {
		snap.Memory = truncate(joinEntries(memEntries), st.settings.MemoryCharLimit)
		snap.MemoryUsed = len(snap.Memory)
	}
	if st.settings.UserProfileEnabled {
		snap.User = truncate(joinEntries(userEntries), st.settings.UserCharLimit)
		snap.UserUsed = len(snap.User)
	}
	if st.settings.MemoryEnabled && snap.MemoryBlocks != "" {
		snap.MemoryBlocks = truncate(snap.MemoryBlocks, st.settings.MemoryCharLimit+200) // header overhead
	}
	if st.settings.UserProfileEnabled && snap.UserBlocks != "" {
		snap.UserBlocks = truncate(snap.UserBlocks, st.settings.UserCharLimit+200)
	}
	snap.MemoryEntries = len(memEntries)
	snap.UserEntries = len(userEntries)
	return snap, nil
}

// ListEntries returns live entries for a target.
func (st *Store) ListEntries(target Target) ([]string, error) {
	path, err := st.pathFor(target)
	if err != nil {
		return nil, err
	}
	return st.readEntries(path), nil
}

// Add appends one entry (Hermes memory tool: add).
func (st *Store) Add(target Target, content string) (Result, error) {
	content = normalizeEntry(content)
	if content == "" {
		return Result{}, fmt.Errorf("content cannot be empty")
	}
	if msg := scanEntry(content); msg != "" {
		return Result{}, fmt.Errorf("%s", msg)
	}

	st.mu.Lock()
	defer st.mu.Unlock()

	path, err := st.pathFor(target)
	if err != nil {
		return Result{}, err
	}
	entries := st.readEntries(path)
	limit := st.limitFor(target)

	if isDuplicate(entries, content) {
		return st.result(target, entries, "entry already exists (no duplicate added)"), nil
	}

	newEntries := append(append([]string{}, entries...), content)
	if joinLen(newEntries) > limit {
		cur := joinLen(entries)
		return Result{}, fmt.Errorf(
			"memory at %d/%d chars — adding %d chars would exceed limit; replace or remove entries first",
			cur, limit, len(content),
		)
	}

	if err := st.writeEntries(path, newEntries); err != nil {
		return Result{}, err
	}
	return st.result(target, newEntries, "entry added"), nil
}

// Replace updates entry matching oldText substring (Hermes: replace).
func (st *Store) Replace(target Target, oldText, newContent string) (Result, error) {
	oldText = normalizeEntry(oldText)
	newContent = normalizeEntry(newContent)
	if oldText == "" {
		return Result{}, fmt.Errorf("old_text cannot be empty")
	}
	if newContent == "" {
		return Result{}, fmt.Errorf("new_content cannot be empty — use remove to delete")
	}
	if msg := scanEntry(newContent); msg != "" {
		return Result{}, fmt.Errorf("%s", msg)
	}

	st.mu.Lock()
	defer st.mu.Unlock()

	path, err := st.pathFor(target)
	if err != nil {
		return Result{}, err
	}
	entries := st.readEntries(path)
	limit := st.limitFor(target)

	idx, err := matchEntry(entries, oldText)
	if err != nil {
		return Result{}, err
	}

	test := append([]string{}, entries...)
	test[idx] = newContent
	if joinLen(test) > limit {
		return Result{}, fmt.Errorf("replacement would exceed %d char limit", limit)
	}

	entries[idx] = newContent
	if err := st.writeEntries(path, entries); err != nil {
		return Result{}, err
	}
	return st.result(target, entries, "entry replaced"), nil
}

// Remove deletes entry matching oldText substring (Hermes: remove).
func (st *Store) Remove(target Target, oldText string) (Result, error) {
	oldText = normalizeEntry(oldText)
	if oldText == "" {
		return Result{}, fmt.Errorf("old_text cannot be empty")
	}

	st.mu.Lock()
	defer st.mu.Unlock()

	path, err := st.pathFor(target)
	if err != nil {
		return Result{}, err
	}
	entries := st.readEntries(path)

	idx, err := matchEntry(entries, oldText)
	if err != nil {
		return Result{}, err
	}

	entries = append(entries[:idx], entries[idx+1:]...)
	if err := st.writeEntries(path, entries); err != nil {
		return Result{}, err
	}
	return st.result(target, entries, "entry removed"), nil
}

// Result is Hermes-style tool response metadata.
type Result struct {
	Target      Target
	Message     string
	Usage       string
	EntryCount  int
	Entries     []string
	Used        int
	Limit       int
	UsedPercent float64
}

func (st *Store) result(target Target, entries []string, msg string) Result {
	used := joinLen(entries)
	limit := st.limitFor(target)
	pct := pct(used, limit)
	return Result{
		Target:      target,
		Message:     msg,
		Usage:       fmt.Sprintf("%.0f%% — %d/%d chars", pct, used, limit),
		EntryCount:  len(entries),
		Entries:     append([]string{}, entries...),
		Used:        used,
		Limit:       limit,
		UsedPercent: pct,
	}
}

func (st *Store) pathFor(target Target) (string, error) {
	mem, user, err := Paths()
	if err != nil {
		return "", err
	}
	if target == TargetUser {
		return user, nil
	}
	return mem, nil
}

func (st *Store) limitFor(target Target) int {
	if target == TargetUser {
		return st.settings.UserCharLimit
	}
	return st.settings.MemoryCharLimit
}

func (st *Store) readEntries(path string) []string {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil
	}
	return parseEntries(string(data))
}

// snapshotReadSlackBytes bounds startup snapshot allocation while leaving room
// for delimiters and block-header overhead beyond the configured char limit.
const snapshotReadSlackBytes = 8 * 1024

func snapshotReadLimit(limit int) int64 {
	if limit <= 0 {
		return int64(snapshotReadSlackBytes)
	}
	return int64(limit + snapshotReadSlackBytes)
}

func (st *Store) readSnapshotEntries(path string, limit int) []string {
	data, truncated, err := readBoundedPrefix(path, snapshotReadLimit(limit))
	if err != nil {
		return nil
	}
	raw := string(data)
	if truncated && strings.Contains(raw, "§") {
		raw = trimTrailingPartialEntry(raw)
	}
	return parseEntries(raw)
}

func readBoundedPrefix(path string, maxBytes int64) ([]byte, bool, error) {
	if maxBytes <= 0 {
		return nil, false, nil
	}
	f, err := os.Open(path)
	if err != nil {
		return nil, false, err
	}
	defer f.Close()

	data, err := io.ReadAll(io.LimitReader(f, maxBytes+1))
	if err != nil {
		return nil, false, err
	}
	if int64(len(data)) <= maxBytes {
		return data, false, nil
	}
	return data[:maxBytes], true, nil
}

func trimTrailingPartialEntry(raw string) string {
	idx := strings.LastIndex(raw, EntryDelimiter)
	if idx < 0 {
		return raw
	}
	return raw[:idx]
}

func parseEntries(raw string) []string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}
	if strings.Contains(raw, "§") {
		parts := strings.Split(raw, EntryDelimiter)
		var out []string
		for _, p := range parts {
			p = strings.TrimSpace(p)
			if p != "" {
				out = append(out, p)
			}
		}
		return dedupeEntries(out)
	}
	// Legacy: whole file is one entry (pre-Hermes markdown templates)
	return []string{raw}
}

func (st *Store) writeEntries(path string, entries []string) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}
	content := strings.Join(entries, EntryDelimiter)
	if len(entries) == 0 {
		content = ""
	}
	tmp, err := os.CreateTemp(dir, ".mem-*.tmp")
	if err != nil {
		return err
	}
	tmpName := tmp.Name()
	if _, err := tmp.WriteString(content); err != nil {
		tmp.Close()
		os.Remove(tmpName)
		return err
	}
	if err := tmp.Close(); err != nil {
		os.Remove(tmpName)
		return err
	}
	return os.Rename(tmpName, path)
}

func (st *Store) renderBlock(target Target, entries []string) string {
	if len(entries) == 0 {
		return ""
	}
	content := strings.Join(entries, EntryDelimiter)
	used := len(content)
	limit := st.limitFor(target)
	pctVal := int(pct(used, limit))
	sep := strings.Repeat("═", 46)
	var header string
	if target == TargetUser {
		header = fmt.Sprintf("USER PROFILE (who the user is) [%d%% — %d/%d chars]", pctVal, used, limit)
	} else {
		header = fmt.Sprintf("MEMORY (your personal notes) [%d%% — %d/%d chars]", pctVal, used, limit)
	}
	return sep + "\n" + header + "\n" + sep + "\n" + content
}

func matchEntry(entries []string, oldText string) (int, error) {
	var matches []int
	for i, e := range entries {
		if strings.Contains(e, oldText) {
			matches = append(matches, i)
		}
	}
	if len(matches) == 0 {
		return 0, fmt.Errorf("no entry matched %q", oldText)
	}
	if len(matches) > 1 {
		unique := map[string]struct{}{}
		for _, i := range matches {
			unique[entries[i]] = struct{}{}
		}
		if len(unique) > 1 {
			return 0, fmt.Errorf("multiple entries matched %q — be more specific", oldText)
		}
	}
	return matches[0], nil
}

func joinEntries(entries []string) string {
	return strings.Join(entries, EntryDelimiter)
}

func joinLen(entries []string) int {
	return len(joinEntries(entries))
}

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	if max <= 3 {
		return s[:max]
	}
	return s[:max-3] + "..."
}

func dedupeEntries(in []string) []string {
	seen := map[string]struct{}{}
	var out []string
	for _, e := range in {
		if _, ok := seen[e]; ok {
			continue
		}
		seen[e] = struct{}{}
		out = append(out, e)
	}
	return out
}
