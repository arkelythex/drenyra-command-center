package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/Albert-fer02/ARKELYTHEX/services/go/reconciliation-worker/internal/reconcile"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/v1/reconcile", reconcileHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8120"
	}

	server := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	log.Printf("go-reconciliation-worker listening on :%s", port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}

func healthHandler(writer http.ResponseWriter, _ *http.Request) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(http.StatusOK)
	_, _ = writer.Write([]byte(`{"status":"ok","service":"go-reconciliation-worker"}`))
}

func reconcileHandler(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodPost {
		http.Error(writer, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload reconcile.Request
	if err := json.NewDecoder(request.Body).Decode(&payload); err != nil {
		http.Error(writer, "invalid json payload", http.StatusBadRequest)
		return
	}

	result := reconcile.Reconcile(payload)
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(writer).Encode(result)
}
