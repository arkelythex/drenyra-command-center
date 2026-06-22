// Command server — Drenyra Engram evidence store HTTP server.
//
// Usage:
//
//	# Default (port 8732, data dir ./data)
//	go run cmd/server/main.go
//
//	# Custom
//	PORT=8733 DB_PATH=/tmp/engram.db go run cmd/server/main.go
package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/arkelythex/drenyra-engram/internal/api"
	"github.com/arkelythex/drenyra-engram/internal/db"
)

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8732"
	}

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "data/engram.db"
	}

	// Ensure data directory exists
	if _, err := os.Stat("data"); os.IsNotExist(err) {
		os.MkdirAll("data", 0755)
	}

	store, err := db.NewStore(dbPath)
	if err != nil {
		log.Error("failed to open database", "path", dbPath, "error", err)
		os.Exit(1)
	}
	defer store.Close()

	handler := api.NewHandler(store, log)

	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	// Middleware: request logging + recovery
	wrapped := middleware(log)(mux)

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      wrapped,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Info("drenyra-engram server starting", "port", port, "db", dbPath)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	<-ctx.Done()
	log.Info("shutting down...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Error("shutdown error", "error", err)
	}
	log.Info("server stopped")
}

// middleware wraps an http.Handler with structured logging and panic recovery.
func middleware(log *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			// Recover from panics
			defer func() {
				if rec := recover(); rec != nil {
					log.Error("panic recovered", "method", r.Method, "path", r.URL.Path, "panic", rec)
					http.Error(w, "internal server error", http.StatusInternalServerError)
				}
			}()

			// Wrap response writer to capture status code
			rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
			next.ServeHTTP(rw, r)

			log.Info("request",
				"method", r.Method,
				"path", r.URL.Path,
				"status", rw.statusCode,
				"duration", time.Since(start).String(),
			)
		})
	}
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}
