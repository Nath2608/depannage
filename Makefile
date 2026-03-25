# ============================================================
# Depan Express - Makefile
# ============================================================

.PHONY: help setup dev build test lint clean docker-up docker-down docker-logs migrate seed backup

# Default target
help:
	@echo "Depan Express - Available Commands"
	@echo "============================================"
	@echo ""
	@echo "Setup & Development:"
	@echo "  make setup          - Initial project setup"
	@echo "  make install        - Install dependencies"
	@echo "  make dev            - Start development servers"
	@echo "  make build          - Build all applications"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  make test           - Run all tests"
	@echo "  make test-api       - Run API tests"
	@echo "  make test-admin     - Run Admin tests"
	@echo "  make lint           - Run linting"
	@echo "  make typecheck      - Run type checking"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up      - Start all Docker services"
	@echo "  make docker-up-dev  - Start Docker with dev profile"
	@echo "  make docker-down    - Stop all Docker services"
	@echo "  make docker-logs    - Show Docker logs"
	@echo "  make docker-build   - Build Docker images"
	@echo ""
	@echo "Database:"
	@echo "  make migrate        - Run database migrations"
	@echo "  make migrate-create - Create new migration"
	@echo "  make seed           - Seed database"
	@echo "  make db-studio      - Open Prisma Studio"
	@echo "  make backup         - Create database backup"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean          - Clean build artifacts"
	@echo "  make clean-docker   - Clean Docker resources"

# ============================================================
# Setup & Development
# ============================================================

setup:
	@chmod +x scripts/*.sh
	@./scripts/setup.sh

install:
	pnpm install

dev:
	pnpm dev

build:
	pnpm build

# ============================================================
# Testing & Quality
# ============================================================

test:
	pnpm test

test-api:
	pnpm --filter api test

test-admin:
	pnpm --filter admin test

lint:
	pnpm lint

typecheck:
	pnpm typecheck

# ============================================================
# Docker Commands
# ============================================================

docker-up:
	docker compose up -d

docker-up-dev:
	docker compose --profile dev up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

docker-build:
	docker compose build --no-cache

docker-clean:
	docker compose down -v --remove-orphans
	docker system prune -f

# ============================================================
# Database Commands
# ============================================================

migrate:
	cd apps/api && npx prisma migrate deploy

migrate-dev:
	cd apps/api && npx prisma migrate dev

migrate-create:
	@read -p "Migration name: " name; \
	cd apps/api && npx prisma migrate dev --name $$name

seed:
	cd apps/api && npx prisma db seed

db-studio:
	cd apps/api && npx prisma studio

db-reset:
	cd apps/api && npx prisma migrate reset

backup:
	@mkdir -p backups
	@TIMESTAMP=$$(date +%Y%m%d_%H%M%S); \
	docker compose exec -T postgres pg_dump -U postgres depan_express > backups/backup_$$TIMESTAMP.sql && \
	gzip backups/backup_$$TIMESTAMP.sql && \
	echo "Backup created: backups/backup_$$TIMESTAMP.sql.gz"

# ============================================================
# Utilities
# ============================================================

clean:
	rm -rf node_modules
	rm -rf apps/*/node_modules
	rm -rf apps/*/.next
	rm -rf apps/*/dist
	rm -rf packages/*/node_modules
	rm -rf packages/*/dist

clean-docker:
	docker compose down -v --remove-orphans
	docker system prune -af
	docker volume prune -f

# ============================================================
# Production Deployment
# ============================================================

deploy-staging:
	@./scripts/deploy.sh staging

deploy-production:
	@./scripts/deploy.sh production
