package memorystore

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"hash/fnv"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

// Path returns the default local Drenyra operational memory database path.
func Path() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".drenyra", "drenyra.db"), nil
}

// Store wraps the local SQLite/FTS operational memory database.
type Store struct {
	db *sql.DB
}

// Open opens and initializes a Store at path.
func Open(path string) (*Store, error) {
	if path == "" {
		return nil, errors.New("memory store path is required")
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, err
	}
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	store := &Store{db: db}
	if err := store.Init(context.Background()); err != nil {
		_ = db.Close()
		return nil, err
	}
	return store, nil
}

// OpenDefault opens ~/.drenyra/drenyra.db.
func OpenDefault() (*Store, error) {
	path, err := Path()
	if err != nil {
		return nil, err
	}
	return Open(path)
}

// OpenReadOnly opens an existing SQLite memory store without initializing or writing tables.
func OpenReadOnly(path string) (*Store, error) {
	if path == "" {
		return nil, errors.New("memory store path is required")
	}
	if _, err := os.Stat(path); err != nil {
		return nil, err
	}
	dsn := (&url.URL{Scheme: "file", Path: path, RawQuery: "mode=ro"}).String()
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		_ = db.Close()
		return nil, err
	}
	return &Store{db: db}, nil
}

// OpenDefaultReadOnly opens ~/.drenyra/drenyra.db without creating it.
func OpenDefaultReadOnly() (*Store, error) {
	path, err := Path()
	if err != nil {
		return nil, err
	}
	return OpenReadOnly(path)
}

// Close closes the underlying DB handle.
func (s *Store) Close() error {
	if s == nil || s.db == nil {
		return nil
	}
	return s.db.Close()
}

// Init creates local store tables and FTS indexes.
func (s *Store) Init(ctx context.Context) error {
	stmts := []string{
		`PRAGMA journal_mode=WAL`,
		`CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			started_at TEXT NOT NULL,
			ended_at TEXT,
			summary TEXT NOT NULL DEFAULT ''
		)`,
		`CREATE TABLE IF NOT EXISTS runs (
			id TEXT PRIMARY KEY,
			session_id TEXT NOT NULL DEFAULT '',
			at TEXT NOT NULL,
			task TEXT NOT NULL,
			root_agent TEXT NOT NULL DEFAULT '',
			auto_level TEXT NOT NULL DEFAULT '',
			trace_id TEXT NOT NULL DEFAULT '',
			status TEXT NOT NULL DEFAULT ''
		)`,
		`CREATE TABLE IF NOT EXISTS memories (
			id TEXT PRIMARY KEY,
			scope TEXT NOT NULL,
			title TEXT NOT NULL,
			content TEXT NOT NULL,
			tags TEXT NOT NULL DEFAULT '',
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS decisions (
			id TEXT PRIMARY KEY,
			at TEXT NOT NULL,
			title TEXT NOT NULL,
			content TEXT NOT NULL,
			files TEXT NOT NULL DEFAULT ''
		)`,
		`CREATE TABLE IF NOT EXISTS bugs (
			id TEXT PRIMARY KEY,
			at TEXT NOT NULL,
			title TEXT NOT NULL,
			root_cause TEXT NOT NULL,
			fix TEXT NOT NULL DEFAULT '',
			files TEXT NOT NULL DEFAULT ''
		)`,
		`CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(kind, ref_id UNINDEXED, title, content)`,
		`CREATE INDEX IF NOT EXISTS idx_runs_at ON runs(at)`,
		`CREATE INDEX IF NOT EXISTS idx_memories_scope ON memories(scope)`,
	}
	for _, stmt := range stmts {
		if _, err := s.db.ExecContext(ctx, stmt); err != nil {
			return fmt.Errorf("init memory store: %w", err)
		}
	}
	return nil
}

// Memory is one operational memory record.
type Memory struct {
	ID        string
	Scope     string
	Title     string
	Content   string
	Tags      string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// Decision is one captured architecture/product decision.
type Decision struct {
	ID      string
	At      time.Time
	Title   string
	Content string
	Files   string
}

// Bug is one captured bug/root-cause record.
type Bug struct {
	ID        string
	At        time.Time
	Title     string
	RootCause string
	Fix       string
	Files     string
}

// Run is one harness run record in the operational DB.
type Run struct {
	ID        string
	SessionID string
	At        time.Time
	Task      string
	RootAgent string
	AutoLevel string
	TraceID   string
	Status    string
}

// SearchResult is one FTS match.
type SearchResult struct {
	Kind    string
	ID      string
	Title   string
	Content string
}

// Status summarizes the local DB.
type Status struct {
	Path      string
	Sessions  int
	Runs      int
	Memories  int
	Decisions int
	Bugs      int
}

// UpsertMemory inserts or updates a memory and its FTS row.
func (s *Store) UpsertMemory(ctx context.Context, m Memory) (Memory, error) {
	now := time.Now().UTC()
	if m.ID == "" {
		m.ID = stableID("memory", m.Scope, m.Title, m.Content)
	}
	if m.Scope == "" {
		m.Scope = "project"
	}
	if m.CreatedAt.IsZero() {
		m.CreatedAt = now
	}
	m.UpdatedAt = now
	_, err := s.db.ExecContext(ctx, `INSERT INTO memories (id, scope, title, content, tags, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET scope=excluded.scope, title=excluded.title, content=excluded.content, tags=excluded.tags, updated_at=excluded.updated_at`,
		m.ID, m.Scope, m.Title, m.Content, m.Tags, formatTime(m.CreatedAt), formatTime(m.UpdatedAt))
	if err != nil {
		return m, err
	}
	return m, s.replaceFTS(ctx, "memory", m.ID, m.Title, m.Content)
}

// ReplaceMemoriesForScope replaces all mirrored Markdown memory rows for a scope.
func (s *Store) ReplaceMemoriesForScope(ctx context.Context, scope string, memories []Memory) error {
	if scope == "" {
		scope = "project"
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `DELETE FROM memory_fts WHERE kind = 'memory'`); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `DELETE FROM memories WHERE scope = ?`, scope); err != nil {
		return err
	}

	now := time.Now().UTC()
	for _, m := range memories {
		m.Scope = scope
		if m.ID == "" {
			m.ID = stableID("memory", m.Scope, m.Title, m.Content)
		}
		if m.CreatedAt.IsZero() {
			m.CreatedAt = now
		}
		m.UpdatedAt = now
		if _, err := tx.ExecContext(ctx, `INSERT INTO memories (id, scope, title, content, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
			m.ID, m.Scope, m.Title, m.Content, m.Tags, formatTime(m.CreatedAt), formatTime(m.UpdatedAt)); err != nil {
			return err
		}
	}

	rows, err := tx.QueryContext(ctx, `SELECT id, title, content FROM memories`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var id, title, content string
		if err := rows.Scan(&id, &title, &content); err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx, `INSERT INTO memory_fts (kind, ref_id, title, content) VALUES (?, ?, ?, ?)`, "memory", id, title, content); err != nil {
			return err
		}
	}
	if err := rows.Err(); err != nil {
		return err
	}
	return tx.Commit()
}

// RecordDecision inserts a decision and its FTS row.
func (s *Store) RecordDecision(ctx context.Context, d Decision) (Decision, error) {
	if d.At.IsZero() {
		d.At = time.Now().UTC()
	}
	if d.ID == "" {
		d.ID = stableID("decision", d.Title, d.Content, formatTime(d.At))
	}
	_, err := s.db.ExecContext(ctx, `INSERT OR REPLACE INTO decisions (id, at, title, content, files) VALUES (?, ?, ?, ?, ?)`,
		d.ID, formatTime(d.At), d.Title, d.Content, d.Files)
	if err != nil {
		return d, err
	}
	return d, s.replaceFTS(ctx, "decision", d.ID, d.Title, d.Content)
}

// RecordBug inserts a bug and its FTS row.
func (s *Store) RecordBug(ctx context.Context, b Bug) (Bug, error) {
	if b.At.IsZero() {
		b.At = time.Now().UTC()
	}
	if b.ID == "" {
		b.ID = stableID("bug", b.Title, b.RootCause, b.Fix, formatTime(b.At))
	}
	_, err := s.db.ExecContext(ctx, `INSERT OR REPLACE INTO bugs (id, at, title, root_cause, fix, files) VALUES (?, ?, ?, ?, ?, ?)`,
		b.ID, formatTime(b.At), b.Title, b.RootCause, b.Fix, b.Files)
	if err != nil {
		return b, err
	}
	return b, s.replaceFTS(ctx, "bug", b.ID, b.Title, b.RootCause+"\n"+b.Fix)
}

// RecordRun inserts a harness run and its FTS row.
func (s *Store) RecordRun(ctx context.Context, r Run) (Run, error) {
	if r.At.IsZero() {
		r.At = time.Now().UTC()
	}
	if r.ID == "" {
		r.ID = stableID("run", r.Task, r.TraceID, formatTime(r.At))
	}
	_, err := s.db.ExecContext(ctx, `INSERT OR REPLACE INTO runs (id, session_id, at, task, root_agent, auto_level, trace_id, status)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		r.ID, r.SessionID, formatTime(r.At), r.Task, r.RootAgent, r.AutoLevel, r.TraceID, r.Status)
	if err != nil {
		return r, err
	}
	return r, s.replaceFTS(ctx, "run", r.ID, r.Task, strings.Join([]string{r.RootAgent, r.AutoLevel, r.TraceID, r.Status}, " "))
}

// ListMemories returns recent memories by updated_at desc.
func (s *Store) ListMemories(ctx context.Context, limit int) ([]Memory, error) {
	if limit <= 0 {
		limit = 20
	}
	rows, err := s.db.QueryContext(ctx, `SELECT id, scope, title, content, tags, created_at, updated_at FROM memories ORDER BY updated_at DESC LIMIT ?`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Memory
	for rows.Next() {
		var m Memory
		var created, updated string
		if err := rows.Scan(&m.ID, &m.Scope, &m.Title, &m.Content, &m.Tags, &created, &updated); err != nil {
			return nil, err
		}
		m.CreatedAt = parseTime(created)
		m.UpdatedAt = parseTime(updated)
		out = append(out, m)
	}
	return out, rows.Err()
}

// Search uses SQLite FTS5 across memories, decisions, bugs, and runs.
func (s *Store) Search(ctx context.Context, query string, limit int) ([]SearchResult, error) {
	query = strings.TrimSpace(query)
	if query == "" {
		return nil, nil
	}
	if limit <= 0 {
		limit = 20
	}
	rows, err := s.db.QueryContext(ctx, `SELECT kind, ref_id, title, content FROM memory_fts WHERE memory_fts MATCH ? LIMIT ?`, escapeFTS(query), limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []SearchResult
	for rows.Next() {
		var r SearchResult
		if err := rows.Scan(&r.Kind, &r.ID, &r.Title, &r.Content); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

// Status returns row counts for local memory tables.
func (s *Store) Status(ctx context.Context, path string) (Status, error) {
	counts := Status{Path: path}
	for _, target := range []struct {
		table string
		set   func(int)
	}{
		{"sessions", func(v int) { counts.Sessions = v }},
		{"runs", func(v int) { counts.Runs = v }},
		{"memories", func(v int) { counts.Memories = v }},
		{"decisions", func(v int) { counts.Decisions = v }},
		{"bugs", func(v int) { counts.Bugs = v }},
	} {
		var n int
		if err := s.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM "+target.table).Scan(&n); err != nil {
			return counts, err
		}
		target.set(n)
	}
	return counts, nil
}

func (s *Store) replaceFTS(ctx context.Context, kind, refID, title, content string) error {
	if _, err := s.db.ExecContext(ctx, `DELETE FROM memory_fts WHERE kind = ? AND ref_id = ?`, kind, refID); err != nil {
		return err
	}
	_, err := s.db.ExecContext(ctx, `INSERT INTO memory_fts (kind, ref_id, title, content) VALUES (?, ?, ?, ?)`, kind, refID, title, content)
	return err
}

func stableID(parts ...string) string {
	h := fnv.New64a()
	for _, part := range parts {
		_, _ = h.Write([]byte(part))
		_, _ = h.Write([]byte{0})
	}
	return fmt.Sprintf("%x", h.Sum64())
}

func formatTime(t time.Time) string {
	return t.UTC().Format(time.RFC3339Nano)
}

func parseTime(value string) time.Time {
	t, _ := time.Parse(time.RFC3339Nano, value)
	return t
}

func escapeFTS(query string) string {
	terms := strings.Fields(query)
	quoted := make([]string, 0, len(terms))
	for _, term := range terms {
		term = strings.ReplaceAll(term, `"`, `""`)
		quoted = append(quoted, `"`+term+`"`)
	}
	return strings.Join(quoted, " ")
}
