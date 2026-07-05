# ═══════════════════════════════════════════════════════════
# DRENYRA — Makefile
# Single entry point for ALL development workflows.
#
# Usage:
#   make up         Start full dev stack (infra + API + Web)
#   make down       Stop everything
#   make status     Check what's running
#   make setup      Bootstrap from scratch (fresh clone)
#   make reset-db   Wipe DB and reseed
#   make logs       Follow all logs
#   make api-logs   API logs only
#   make db-studio  Open Drizzle Studio
#   make test       Run tests
#   make lint       Run linter
#   make typecheck  TypeScript type check
# ═══════════════════════════════════════════════════════════

SHELL := /usr/bin/env bash
.ONESHELL:
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := up
MAKEFLAGS += --warn-undefined-variables
MAKEFLAGS += --no-builtin-rules

ROOT_DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

# ── Dev stack ─────────────────────────────────────────────

.PHONY: up
up: ## Start full dev stack (infra + API + Web with hot-reload)
	@echo "🚀 Starting DRENYRA dev stack..."
	@cd "$(ROOT_DIR)" && bash scripts/dev/dev-start.sh

.PHONY: down
down: ## Stop everything (containers + dev servers)
	@echo "🛑 Stopping DRENYRA dev stack..."
	@cd "$(ROOT_DIR)" && bash scripts/dev/dev-stop.sh

.PHONY: status
status: ## Show status of all services
	@cd "$(ROOT_DIR)" && bash scripts/dev/dev-services.sh

.PHONY: restart
restart: down up ## Restart the full stack

# ── First-time setup ──────────────────────────────────────

.PHONY: setup
setup: ## Bootstrap from scratch (fresh clone onboarding)
	@cd "$(ROOT_DIR)" && bash scripts/dev/dev-setup.sh

.PHONY: reset-db
reset-db: ## Wipe database, re-run migrations, and reseed
	@echo "⚠️  WARNING: This will DESTROY all local data!"
	@read -p "Are you sure? (y/N): " confirm
	@if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then
		cd "$(ROOT_DIR)" && bash scripts/dev/rebuild-db-baseline.sh
		@echo "✅ Database reset complete"
	else
		@echo "Cancelled."
	fi

# ── Logs ──────────────────────────────────────────────────

.PHONY: logs
logs: ## Follow all Docker logs
	@cd "$(ROOT_DIR)" && docker compose logs -f

.PHONY: api-logs
api-logs: ## Follow API logs
	@echo "📡 API server logs (apps/api):"
	@tail -f /tmp/api-dev.log 2>/dev/null || echo "API log not found"

.PHONY: web-logs
web-logs: ## Follow Web logs
	@echo "🌐 Web server logs (apps/web):"
	@tail -f /tmp/web-dev.log 2>/dev/null || echo "Web log not found"

# ── Database ──────────────────────────────────────────────

.PHONY: db-studio
db-studio: ## Open Drizzle Studio
	@cd "$(ROOT_DIR)" && bun run db:studio

.PHONY: db-push
db-push: ## Push schema directly to DB
	@cd "$(ROOT_DIR)" && bun run db:push

.PHONY: db-migrate
db-migrate: ## Apply pending migrations
	@cd "$(ROOT_DIR)" && bun run db:migrate

.PHONY: db-seed
db-seed: ## Seed development data + admin user
	@cd "$(ROOT_DIR)" && ./scripts/dev/seed-dev-bootstrap.sh

# ── Go ────────────────────────────────────────────────────

.PHONY: go-build
go-build: ## Build all Go apps
	@cd "$(ROOT_DIR)/apps/drenyra-cli" && go build ./...

.PHONY: go-test
go-test: ## Test all Go apps
	@cd "$(ROOT_DIR)/apps/drenyra-cli" && go test ./...

.PHONY: go-vet
go-vet: ## Vet all Go apps
	@cd "$(ROOT_DIR)/apps/drenyra-cli" && go vet ./...

.PHONY: go-lint
go-lint: ## Lint Go code (golangci-lint if available)
	@if command -v golangci-lint &>/dev/null; then \
		cd "$(ROOT_DIR)/apps/drenyra-cli" && golangci-lint run ./...; \
	else \
		echo "golangci-lint not installed, running go vet instead"; \
		$(MAKE) go-vet; \
	fi

.PHONY: go-all
go-all: go-vet go-build go-test ## Run all Go checks (vet + build + test)

# ── All-in-one ────────────────────────────────────────────

.PHONY: all
all: typecheck lint go-all ## Full local quality gate (TS + Go)

# ── Quality ───────────────────────────────────────────────

.PHONY: test
test: ## Run all tests
	@cd "$(ROOT_DIR)" && bun run test

.PHONY: typecheck
typecheck: ## TypeScript type check
	@cd "$(ROOT_DIR)" && bun run typecheck

.PHONY: lint
lint: ## Run linter
	@cd "$(ROOT_DIR)" && bun run lint

.PHONY: quality
quality: ## Full quality gate (typecheck + lint + test)
	@cd "$(ROOT_DIR)" && bash scripts/dev/quality-core.sh

# ── Help ──────────────────────────────────────────────────

.PHONY: help
help: ## Show this help
	@echo "╔══════════════════════════════════════════════╗"
	@echo "║   DRENYRA — Development Makefile         ║"
	@echo "╚══════════════════════════════════════════════╝"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Credentials (after setup):"
	@echo "  Email:    admin@drenyrafounders.com"
	@echo "  Password: password123"
	@echo "  Web:      http://localhost:5173"
	@echo "  API:      http://localhost:3000"
	@echo "  Swagger:  http://localhost:3000/api/swagger"
