// Package api — HTTP handlers for the Drenyra Engram evidence store.
package api

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/drenyra/engram/internal/db"
	"github.com/drenyra/engram/internal/types"
)

// Handler holds references to the store and logger.
type Handler struct {
	store *db.Store
	log   *slog.Logger
}

// NewHandler creates a new Handler.
func NewHandler(store *db.Store, log *slog.Logger) *Handler {
	return &Handler{store: store, log: log}
}

// RegisterRoutes attaches all routes to the given mux.
func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/v1/evidence", h.saveEvidence)
	mux.HandleFunc("GET /api/v1/evidence/{id}", h.getEvidence)
	mux.HandleFunc("GET /api/v1/evidence", h.listEvidence)
	mux.HandleFunc("GET /api/v1/evidence/search", h.searchEvidence)
	mux.HandleFunc("GET /api/v1/stats", h.getStats)
	mux.HandleFunc("POST /api/v1/sessions", h.createSession)
	mux.HandleFunc("POST /api/v1/sessions/{sessionId}/evidence/{evidenceId}", h.linkEvidence)
	mux.HandleFunc("GET /health", h.health)
}

func (h *Handler) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": "drenyra-engram"})
}

func (h *Handler) saveEvidence(w http.ResponseWriter, r *http.Request) {
	var ev types.EvidenceRecord
	if err := json.NewDecoder(r.Body).Decode(&ev); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if ev.ID == "" || ev.OperationID == "" {
		writeError(w, http.StatusBadRequest, "id and operationId are required")
		return
	}

	if ev.Timestamp.IsZero() {
		ev.Timestamp = time.Now()
	}

	if err := h.store.SaveEvidence(&ev); err != nil {
		h.log.Error("failed to save evidence", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to save evidence")
		return
	}

	writeJSON(w, http.StatusCreated, ev)
}

func (h *Handler) getEvidence(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "id is required")
		return
	}

	ev, err := h.store.GetEvidence(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "evidence not found")
		return
	}

	writeJSON(w, http.StatusOK, ev)
}

func (h *Handler) listEvidence(w http.ResponseWriter, r *http.Request) {
	filter := types.EvidenceFilter{
		OperationID: r.URL.Query().Get("operationId"),
		Phase:       types.FdPhase(r.URL.Query().Get("phase")),
		Tier:        types.FiscalTier(r.URL.Query().Get("tier")),
		Actor:       types.Actor(r.URL.Query().Get("actor")),
		TenantID:    r.URL.Query().Get("tenantId"),
		RUC:         r.URL.Query().Get("ruc"),
	}

	if startStr := r.URL.Query().Get("startTime"); startStr != "" {
		t, err := time.Parse(time.RFC3339, startStr)
		if err == nil {
			filter.StartTime = &t
		}
	}
	if endStr := r.URL.Query().Get("endTime"); endStr != "" {
		t, err := time.Parse(time.RFC3339, endStr)
		if err == nil {
			filter.EndTime = &t
		}
	}
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if n, err := strconv.Atoi(limitStr); err == nil {
			filter.Limit = n
		}
	}
	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if n, err := strconv.Atoi(offsetStr); err == nil {
			filter.Offset = n
		}
	}

	results, err := h.store.ListEvidence(filter)
	if err != nil {
		h.log.Error("failed to list evidence", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list evidence")
		return
	}

	if results == nil {
		results = []*types.EvidenceRecord{}
	}

	writeJSON(w, http.StatusOK, results)
}

func (h *Handler) searchEvidence(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		writeError(w, http.StatusBadRequest, "query parameter 'q' is required")
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	results, err := h.store.SearchEvidence(query, limit, offset)
	if err != nil {
		h.log.Error("search failed", "error", err)
		writeError(w, http.StatusInternalServerError, "search failed")
		return
	}

	if results == nil {
		results = []*types.EvidenceRecord{}
	}

	writeJSON(w, http.StatusOK, results)
}

func (h *Handler) getStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.store.GetStats()
	if err != nil {
		h.log.Error("failed to get stats", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to get stats")
		return
	}
	writeJSON(w, http.StatusOK, stats)
}

func (h *Handler) createSession(w http.ResponseWriter, r *http.Request) {
	var s types.Session
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if s.ID == "" || s.TenantID == "" {
		writeError(w, http.StatusBadRequest, "id and tenantId are required")
		return
	}

	s.CreatedAt = time.Now()
	s.UpdatedAt = time.Now()
	if s.Status == "" {
		s.Status = "active"
	}

	if err := h.store.CreateSession(&s); err != nil {
		h.log.Error("failed to create session", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to create session")
		return
	}

	writeJSON(w, http.StatusCreated, s)
}

func (h *Handler) linkEvidence(w http.ResponseWriter, r *http.Request) {
	sessionID := r.PathValue("sessionId")
	evidenceID := r.PathValue("evidenceId")

	if sessionID == "" || evidenceID == "" {
		writeError(w, http.StatusBadRequest, "sessionId and evidenceId are required")
		return
	}

	if err := h.store.LinkEvidenceToSession(sessionID, evidenceID); err != nil {
		h.log.Error("failed to link evidence", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to link evidence")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"sessionId":  sessionID,
		"evidenceId": evidenceID,
		"status":     "linked",
	})
}

// --- Helpers ---

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
