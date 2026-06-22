package brain

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCreateThreadSendsFiscalHeadersAndDecodesThread(t *testing.T) {
	t.Parallel()

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got, want := r.Method, http.MethodPost; got != want {
			t.Fatalf("method = %s, want %s", got, want)
		}
		if got, want := r.URL.Path, "/threads"; got != want {
			t.Fatalf("path = %s, want %s", got, want)
		}
		if got, want := r.Header.Get("x-company-ruc"), "20123456789"; got != want {
			t.Fatalf("x-company-ruc = %q, want %q", got, want)
		}
		if got, want := r.Header.Get("x-company-id"), "company-123"; got != want {
			t.Fatalf("x-company-id = %q, want %q", got, want)
		}
		if got, want := r.Header.Get("x-fiscal-period"), "2026-05"; got != want {
			t.Fatalf("x-fiscal-period = %q, want %q", got, want)
		}

		var body map[string]any
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		if got, want := body["title"], "Reconcile sales"; got != want {
			t.Fatalf("title = %v, want %v", got, want)
		}
		if got, want := body["sourceSurface"], "cli"; got != want {
			t.Fatalf("sourceSurface = %v, want %v", got, want)
		}

		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"id":"thread-42","title":"Reconcile sales","status":"idle","sourceSurface":"cli"}`))
	}))
	defer ts.Close()

	client := NewClient(ts.URL)
	thread, err := client.CreateThread(context.Background(), CreateThreadRequest{
		Title:         "Reconcile sales",
		SourceSurface: "cli",
		FiscalContext: FiscalContext{
			OrganizationID: "org-123",
			CompanyID:      "company-123",
			CompanyRUC:     "20123456789",
			Period:         "2026-05",
			UserID:         "user-123",
		},
	})
	if err != nil {
		t.Fatalf("CreateThread error: %v", err)
	}
	if got, want := thread.ID, "thread-42"; got != want {
		t.Fatalf("thread.ID = %q, want %q", got, want)
	}
}

func TestStartTurnEscapesThreadIDPath(t *testing.T) {
	t.Parallel()

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got, want := r.URL.EscapedPath(), "/threads/thread%2Fwith%2Fslash/turns"; got != want {
			t.Fatalf("escaped path = %s, want %s", got, want)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"id":"turn-1","threadId":"thread/with/slash","status":"queued","prompt":"hola","sourceSurface":"cli"}`))
	}))
	defer ts.Close()

	client := NewClient(ts.URL)
	_, err := client.StartTurn(context.Background(), "thread/with/slash", StartTurnRequest{
		Prompt:        "hola",
		SourceSurface: "cli",
	})
	if err != nil {
		t.Fatalf("StartTurn error: %v", err)
	}
}

func TestCreateThreadRejects3xx(t *testing.T) {
	t.Parallel()

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusFound)
		_, _ = w.Write([]byte("redirect"))
	}))
	defer ts.Close()

	client := NewClient(ts.URL)
	_, err := client.CreateThread(context.Background(), CreateThreadRequest{Title: "x", SourceSurface: "cli"})
	if err == nil {
		t.Fatal("expected error for 3xx response")
	}
	if !strings.Contains(err.Error(), "brain HTTP 302") {
		t.Fatalf("unexpected error: %v", err)
	}
}
