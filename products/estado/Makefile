.PHONY: bootstrap dev infra-up migrate seed smoke quality

bootstrap:
	bash ./scripts/bootstrap.sh

dev:
	bash ./scripts/dev-all.sh

infra-up:
	docker compose -f infra/docker-compose.yml up -d

migrate:
	bash ./scripts/migrate.sh

seed:
	bash ./scripts/seed.sh

smoke:
	bash ./scripts/smoke-e2e.sh

quality:
	pnpm quality:check
