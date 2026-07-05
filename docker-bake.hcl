# ─────────────────────────────────────────────────────────
# DRENYRA — Docker Buildx Bake Configuration
# ─────────────────────────────────────────────────────────
# Build all services:    docker buildx bake
# Build single service:  docker buildx bake web
#                        docker buildx bake api
#                        docker buildx bake data-engine
#
# With custom tag:       docker buildx bake --set *.tags=drenyra/web:v1.0.0
# With cache push:       docker buildx bake --push
# ─────────────────────────────────────────────────────────

variable "TAG" {
  default = "latest"
}

variable "DOCKER_REGISTRY" {
  default = ""
}

variable "WEB_TAG" {
  default = "${DOCKER_REGISTRY}drenyra/web:${TAG}"
}

variable "API_TAG" {
  default = "${DOCKER_REGISTRY}drenyra/api:${TAG}"
}

variable "DATA_ENGINE_TAG" {
  default = "${DOCKER_REGISTRY}drenyra/data-engine:${TAG}"
}

# ── Groups ──────────────────────────────────────────────

group "default" {
  targets = ["web", "api", "data-engine"]
}

group "production" {
  targets = ["web", "api", "data-engine"]
}

group "frontend" {
  targets = ["web"]
}

group "backend" {
  targets = ["api"]
}

group "data" {
  targets = ["data-engine"]
}

# ── Targets ─────────────────────────────────────────────

target "web" {
  context   = "."
  dockerfile = "apps/web/Dockerfile"
  tags      = [WEB_TAG]
  platforms = ["linux/amd64"]
}

target "api" {
  context   = "."
  dockerfile = "apps/api/Dockerfile"
  tags      = [API_TAG]
  platforms = ["linux/amd64"]
}

target "data-engine" {
  context   = "apps/data-engine"
  dockerfile = "Dockerfile"
  tags      = [DATA_ENGINE_TAG]
  platforms = ["linux/amd64"]
}
