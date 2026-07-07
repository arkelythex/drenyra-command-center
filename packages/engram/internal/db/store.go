// Package db — SQLite persistence for fiscal evidence records.
// Uses modernc.org/sqlite (pure Go, no CGO) for portability.
package db

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"encoding/json"

	"github.com/drenyra/drenyra-engram/internal/types"
	_ "modernc.org/sqlite"
)

// Schema DDL — created on first run.
const schemaSQL = `
CREATE TABLE IF NOT EXISTS evidence (
    id          TEXT PRIMARY KEY,
    operation_id TEXT NOT NULL,
    phase       TEXT NOT NULL,
    tier        TEXT NOT NULL,
    timestamp   TEXT NOT NULL,
    actor       TEXT NOT NULL,
    action      TEXT NOT NULL,
    input       TEXT,
    output      TEXT,
    reasoning   TEXT,
    metadata    TEXT,
    tenant_id   TEXT NOT NULL,
    ruc         TEXT NOT NULL,
    company_id  TEXT NOT NULL,
    user_id     TEXT,
    trace_id    TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_evidence_operation ON evidence(operation_id);
CREATE INDEX IF NOT EXISTS idx_evidence_tenant ON evidence(tenant_id);
CREATE INDEX IF NOT EXISTS idx_evidence_ruc ON evidence(ruc);
CREATE INDEX IF NOT EXISTS idx_evidence_phase ON evidence(phase);
CREATE INDEX IF NOT EXISTS idx_evidence_tier ON evidence(tier);
CREATE INDEX IF NOT EXISTS idx_evidence_timestamp ON evidence(timestamp);
CREATE INDEX IF NOT EXISTS idx_evidence_trace ON evidence(trace_id);

CREATE VIRTUAL TABLE IF NOT EXISTS evidence_fts USING fts5(
    id UNINDEXED,
    action,
    reasoning,
    metadata,
    content='evidence',
    content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS evidence_ai AFTER INSERT ON evidence BEGIN
    INSERT INTO evidence_fts(id, action, reasoning, metadata)
    VALUES (new.id, new.action, new.reasoning, new.metadata);
END;

CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    tenant_id   TEXT NOT NULL,
    ruc         TEXT NOT NULL,
    user_id     TEXT,
    status      TEXT NOT NULL DEFAULT 'active',
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS session_evidence (
    session_id  TEXT NOT NULL,
    evidence_id TEXT NOT NULL,
    PRIMARY KEY (session_id, evidence_id),
    FOREIGN KEY (session_id) REFERENCES sessions(id),
    FOREIGN KEY (evidence_id) REFERENCES evidence(id)
);
`

// Store handles all database operations.
type Store struct {
	db *sql.DB
}

// NewStore opens or creates the SQLite database and applies schema.
func NewStore(path string) (*Store, error) {
	db, err := sql.Open("sqlite", path+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	db.SetMaxOpenConns(1) // SQLite writes are serialized
	db.SetMaxIdleConns(1)

	if _, err := db.Exec(schemaSQL); err != nil {
		return nil, fmt.Errorf("apply schema: %w", err)
	}

	return &Store{db: db}, nil
}

// Close closes the database connection.
func (s *Store) Close() error {
	return s.db.Close()
}

// SaveEvidence persists a fiscal evidence record.
func (s *Store) SaveEvidence(ev *types.EvidenceRecord) error {
	inputJSON, _ := json.Marshal(ev.Input)
	outputJSON, _ := json.Marshal(ev.Output)
	metaJSON, _ := json.Marshal(ev.Metadata)

	_, err := s.db.Exec(
		`INSERT INTO evidence (id, operation_id, phase, tier, timestamp, actor, action,
		                      input, output, reasoning, metadata, tenant_id, ruc, company_id, user_id, trace_id)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		ev.ID, ev.OperationID, string(ev.Phase), string(ev.Tier),
		ev.Timestamp.UTC().Format(time.RFC3339Nano), string(ev.Actor), ev.Action,
		string(inputJSON), string(outputJSON), ev.Reasoning, string(metaJSON),
		ev.TenantID, ev.RUC, ev.CompanyID, ev.UserID, ev.TraceID,
	)
	if err != nil {
		return fmt.Errorf("save evidence: %w", err)
	}
	return nil
}

// GetEvidence retrieves a single evidence record by ID.
func (s *Store) GetEvidence(id string) (*types.EvidenceRecord, error) {
	row := s.db.QueryRow(
		`SELECT id, operation_id, phase, tier, timestamp, actor, action,
		        input, output, reasoning, metadata, tenant_id, ruc, company_id, user_id, trace_id
		 FROM evidence WHERE id = ?`, id,
	)
	return scanEvidence(row)
}

// ListEvidence queries evidence records with optional filters.
func (s *Store) ListEvidence(filter types.EvidenceFilter) ([]*types.EvidenceRecord, error) {
	var conditions []string
	var args []any

	if filter.OperationID != "" {
		conditions = append(conditions, "operation_id = ?")
		args = append(args, filter.OperationID)
	}
	if filter.Phase != "" {
		conditions = append(conditions, "phase = ?")
		args = append(args, string(filter.Phase))
	}
	if filter.Tier != "" {
		conditions = append(conditions, "tier = ?")
		args = append(args, string(filter.Tier))
	}
	if filter.Actor != "" {
		conditions = append(conditions, "actor = ?")
		args = append(args, string(filter.Actor))
	}
	if filter.TenantID != "" {
		conditions = append(conditions, "tenant_id = ?")
		args = append(args, filter.TenantID)
	}
	if filter.RUC != "" {
		conditions = append(conditions, "ruc = ?")
		args = append(args, filter.RUC)
	}
	if filter.StartTime != nil {
		conditions = append(conditions, "timestamp >= ?")
		args = append(args, filter.StartTime.UTC().Format(time.RFC3339Nano))
	}
	if filter.EndTime != nil {
		conditions = append(conditions, "timestamp <= ?")
		args = append(args, filter.EndTime.UTC().Format(time.RFC3339Nano))
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	limit := 50
	offset := 0
	if filter.Limit > 0 && filter.Limit <= 1000 {
		limit = filter.Limit
	}
	if filter.Offset > 0 {
		offset = filter.Offset
	}

	query := fmt.Sprintf(
		`SELECT id, operation_id, phase, tier, timestamp, actor, action,
		        input, output, reasoning, metadata, tenant_id, ruc, company_id, user_id, trace_id
		 FROM evidence %s ORDER BY timestamp DESC LIMIT ? OFFSET ?`, whereClause)
	args = append(args, limit, offset)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("list evidence: %w", err)
	}
	defer rows.Close()

	var results []*types.EvidenceRecord
	for rows.Next() {
		ev, err := scanEvidence(rows)
		if err != nil {
			return nil, err
		}
		results = append(results, ev)
	}
	return results, rows.Err()
}

// SearchEvidence performs full-text search across evidence records.
func (s *Store) SearchEvidence(query string, limit, offset int) ([]*types.EvidenceRecord, error) {
	if limit <= 0 || limit > 1000 {
		limit = 50
	}

	rows, err := s.db.Query(
		`SELECT e.id, e.operation_id, e.phase, e.tier, e.timestamp, e.actor, e.action,
		        e.input, e.output, e.reasoning, e.metadata, e.tenant_id, e.ruc, e.company_id, e.user_id, e.trace_id
		 FROM evidence e
		 JOIN evidence_fts fts ON e.id = fts.id
		 WHERE evidence_fts MATCH ?
		 ORDER BY rank
		 LIMIT ? OFFSET ?`,
		query, limit, offset,
	)
	if err != nil {
		return nil, fmt.Errorf("search evidence: %w", err)
	}
	defer rows.Close()

	var results []*types.EvidenceRecord
	for rows.Next() {
		ev, err := scanEvidence(rows)
		if err != nil {
			return nil, err
		}
		results = append(results, ev)
	}
	return results, rows.Err()
}

// GetStats returns fiscal memory statistics.
func (s *Store) GetStats() (*types.EvidenceStats, error) {
	stats := &types.EvidenceStats{
		ByPhase: make(map[types.FdPhase]int64),
		ByTier:  make(map[types.FiscalTier]int64),
		ByActor: make(map[types.Actor]int64),
	}

	if err := s.db.QueryRow(`SELECT COUNT(*) FROM evidence`).Scan(&stats.TotalRecords); err != nil {
		return nil, err
	}

	// Phase breakdown
	phaseRows, _ := s.db.Query(`SELECT phase, COUNT(*) FROM evidence GROUP BY phase`)
	if phaseRows != nil {
		defer phaseRows.Close()
		for phaseRows.Next() {
			var phase string
			var count int64
			phaseRows.Scan(&phase, &count)
			stats.ByPhase[types.FdPhase(phase)] = count
		}
	}

	// Tier breakdown
	tierRows, _ := s.db.Query(`SELECT tier, COUNT(*) FROM evidence GROUP BY tier`)
	if tierRows != nil {
		defer tierRows.Close()
		for tierRows.Next() {
			var tier string
			var count int64
			tierRows.Scan(&tier, &count)
			stats.ByTier[types.FiscalTier(tier)] = count
		}
	}

	// Actor breakdown
	actorRows, _ := s.db.Query(`SELECT actor, COUNT(*) FROM evidence GROUP BY actor`)
	if actorRows != nil {
		defer actorRows.Close()
		for actorRows.Next() {
			var actor string
			var count int64
			actorRows.Scan(&actor, &count)
			stats.ByActor[types.Actor(actor)] = count
		}
	}

	s.db.QueryRow(`SELECT COUNT(DISTINCT tenant_id) FROM evidence`).Scan(&stats.UniqueTenants)
	s.db.QueryRow(`SELECT COUNT(DISTINCT ruc) FROM evidence`).Scan(&stats.UniqueRUCs)
	s.db.QueryRow(`SELECT COUNT(DISTINCT operation_id) FROM evidence`).Scan(&stats.TotalOperations)
	s.db.QueryRow(`SELECT total_bytes FROM pragma_page_count() * pragma_page_size()`).Scan(&stats.StorageBytes)

	return stats, nil
}

// --- Session operations ---

func (s *Store) CreateSession(session *types.Session) error {
	_, err := s.db.Exec(
		`INSERT INTO sessions (id, tenant_id, ruc, user_id, status, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		session.ID, session.TenantID, session.RUC, session.UserID,
		session.Status, session.CreatedAt.UTC().Format(time.RFC3339Nano),
		session.UpdatedAt.UTC().Format(time.RFC3339Nano),
	)
	return err
}

func (s *Store) LinkEvidenceToSession(sessionID, evidenceID string) error {
	_, err := s.db.Exec(
		`INSERT OR IGNORE INTO session_evidence (session_id, evidence_id) VALUES (?, ?)`,
		sessionID, evidenceID,
	)
	return err
}

// --- Scanner helper ---

type scanner interface {
	Scan(dest ...any) error
}

func scanEvidence(row scanner) (*types.EvidenceRecord, error) {
	var (
		id, opID, phase, tier, ts, actor, action string
		inputJSON, outputJSON, reasoning         sql.NullString
		metaJSON                                 sql.NullString
		tenantID, ruc, companyID                  string
		userID                                   sql.NullString
		traceID                                  string
	)

	err := row.Scan(&id, &opID, &phase, &tier, &ts, &actor, &action,
		&inputJSON, &outputJSON, &reasoning, &metaJSON,
		&tenantID, &ruc, &companyID, &userID, &traceID)
	if err != nil {
		return nil, err
	}

	timestamp, _ := time.Parse(time.RFC3339Nano, ts)

	ev := &types.EvidenceRecord{
		ID:          id,
		OperationID: opID,
		Phase:       types.FdPhase(phase),
		Tier:        types.FiscalTier(tier),
		Timestamp:   timestamp,
		Actor:       types.Actor(actor),
		Action:      action,
		TenantID:    tenantID,
		RUC:         ruc,
		CompanyID:   companyID,
		TraceID:     traceID,
	}

	if inputJSON.Valid {
		var v any
		json.Unmarshal([]byte(inputJSON.String), &v)
		ev.Input = v
	}
	if outputJSON.Valid {
		var v any
		json.Unmarshal([]byte(outputJSON.String), &v)
		ev.Output = v
	}
	if reasoning.Valid {
		ev.Reasoning = reasoning.String
	}
	if metaJSON.Valid {
		var v map[string]any
		json.Unmarshal([]byte(metaJSON.String), &v)
		ev.Metadata = v
	}
	if userID.Valid {
		ev.UserID = userID.String
	}

	return ev, nil
}
