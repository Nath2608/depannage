#!/bin/bash

# ============================================================
# Depan Express - Deployment Script
# ============================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
ENVIRONMENT="${1:-production}"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Depan Express - Deployment${NC}"
echo -e "${BLUE}  Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "${BLUE}============================================${NC}"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo -e "${YELLOW}Please copy .env.example to .env and configure it${NC}"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Functions
pull_images() {
    echo -e "${BLUE}Pulling latest images...${NC}"
    docker compose pull
}

build_images() {
    echo -e "${BLUE}Building images...${NC}"
    docker compose build --no-cache
}

run_migrations() {
    echo -e "${BLUE}Running database migrations...${NC}"
    docker compose exec -T api npx prisma migrate deploy
}

start_services() {
    echo -e "${BLUE}Starting services...${NC}"
    if [ "$ENVIRONMENT" == "production" ]; then
        docker compose --profile prod up -d --remove-orphans
    else
        docker compose --profile dev up -d --remove-orphans
    fi
}

stop_services() {
    echo -e "${BLUE}Stopping services...${NC}"
    docker compose down
}

restart_services() {
    echo -e "${BLUE}Restarting services...${NC}"
    docker compose restart
}

show_logs() {
    docker compose logs -f "$@"
}

show_status() {
    echo -e "${BLUE}Service Status:${NC}"
    docker compose ps
}

cleanup() {
    echo -e "${BLUE}Cleaning up unused resources...${NC}"
    docker system prune -f
    docker volume prune -f
}

backup_db() {
    echo -e "${BLUE}Creating database backup...${NC}"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="backups/depan_express_${TIMESTAMP}.sql"
    mkdir -p backups
    docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_FILE"
    gzip "$BACKUP_FILE"
    echo -e "${GREEN}Backup created: ${BACKUP_FILE}.gz${NC}"
}

restore_db() {
    if [ -z "$2" ]; then
        echo -e "${RED}Error: Please specify backup file${NC}"
        exit 1
    fi
    echo -e "${YELLOW}Warning: This will overwrite the current database!${NC}"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Restoring database from $2...${NC}"
        gunzip -c "$2" | docker compose exec -T postgres psql -U "$POSTGRES_USER" "$POSTGRES_DB"
        echo -e "${GREEN}Database restored!${NC}"
    fi
}

# Main command handling
case "$1" in
    "start")
        start_services
        show_status
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "build")
        build_images
        ;;
    "pull")
        pull_images
        ;;
    "deploy")
        pull_images
        start_services
        run_migrations
        show_status
        ;;
    "logs")
        shift
        show_logs "$@"
        ;;
    "status")
        show_status
        ;;
    "cleanup")
        cleanup
        ;;
    "backup")
        backup_db
        ;;
    "restore")
        restore_db "$@"
        ;;
    "migrate")
        run_migrations
        ;;
    *)
        echo -e "${YELLOW}Usage: $0 {start|stop|restart|build|pull|deploy|logs|status|cleanup|backup|restore|migrate}${NC}"
        echo ""
        echo "Commands:"
        echo "  start     - Start all services"
        echo "  stop      - Stop all services"
        echo "  restart   - Restart all services"
        echo "  build     - Build Docker images"
        echo "  pull      - Pull latest images"
        echo "  deploy    - Full deployment (pull, start, migrate)"
        echo "  logs      - Show service logs (append service name for specific logs)"
        echo "  status    - Show service status"
        echo "  cleanup   - Remove unused Docker resources"
        echo "  backup    - Create database backup"
        echo "  restore   - Restore database from backup"
        echo "  migrate   - Run database migrations"
        exit 1
        ;;
esac

echo -e "${GREEN}Done!${NC}"
