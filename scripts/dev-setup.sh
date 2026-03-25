#!/bin/bash

# ===========================================
# Depan Express - Development Setup Script
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}\n"
}

print_step() {
    echo -e "${GREEN}▸${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✖${NC} $1"
}

print_success() {
    echo -e "${GREEN}✔${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        echo "Please install Node.js 18+ from https://nodejs.org"
        exit 1
    fi
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version must be 18 or higher (current: $(node -v))"
        exit 1
    fi
    print_success "Node.js $(node -v)"

    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        print_warning "pnpm is not installed, installing..."
        npm install -g pnpm
    fi
    print_success "pnpm $(pnpm -v)"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        echo "Please install Docker from https://docker.com"
        exit 1
    fi
    print_success "Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"

    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available"
        exit 1
    fi
    print_success "Docker Compose $(docker compose version --short)"
}

# Setup environment files
setup_env() {
    print_header "Setting Up Environment"

    # Root .env
    if [ ! -f .env ]; then
        print_step "Creating root .env from .env.example..."
        cp .env.example .env
        print_success "Created .env"
    else
        print_warning ".env already exists, skipping..."
    fi

    # API .env
    if [ ! -f apps/api/.env ]; then
        print_step "Creating apps/api/.env..."
        cp .env apps/api/.env
        print_success "Created apps/api/.env"
    else
        print_warning "apps/api/.env already exists, skipping..."
    fi

    # Admin .env.local
    if [ ! -f apps/admin/.env.local ]; then
        print_step "Creating apps/admin/.env.local..."
        echo "NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1" > apps/admin/.env.local
        print_success "Created apps/admin/.env.local"
    else
        print_warning "apps/admin/.env.local already exists, skipping..."
    fi
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"

    print_step "Running pnpm install..."
    pnpm install
    print_success "Dependencies installed"
}

# Start Docker services
start_docker() {
    print_header "Starting Docker Services"

    print_step "Starting PostgreSQL, Redis, MinIO, MailHog..."
    docker compose --profile dev up -d postgres redis minio mailhog adminer

    # Wait for PostgreSQL to be ready
    print_step "Waiting for PostgreSQL to be ready..."
    until docker compose exec -T postgres pg_isready -U postgres &> /dev/null; do
        sleep 1
    done
    print_success "PostgreSQL is ready"

    # Wait for Redis to be ready
    print_step "Waiting for Redis to be ready..."
    until docker compose exec -T redis redis-cli ping &> /dev/null; do
        sleep 1
    done
    print_success "Redis is ready"
}

# Setup database
setup_database() {
    print_header "Setting Up Database"

    print_step "Generating Prisma client..."
    pnpm --filter @depan-express/database db:generate

    print_step "Running database migrations..."
    pnpm --filter @depan-express/database db:migrate

    print_step "Seeding database..."
    pnpm --filter @depan-express/database db:seed

    print_success "Database setup complete"
}

# Print summary
print_summary() {
    print_header "Setup Complete!"

    echo -e "${GREEN}Development environment is ready!${NC}\n"

    echo "Services running:"
    echo "  • PostgreSQL: localhost:5432"
    echo "  • Redis: localhost:6379"
    echo "  • MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"
    echo "  • MailHog: http://localhost:8025"
    echo "  • Adminer: http://localhost:8080"

    echo -e "\n${YELLOW}Start the applications:${NC}"
    echo "  pnpm dev           # Start all apps"
    echo "  pnpm dev:api       # Start API only"
    echo "  pnpm dev:admin     # Start Admin only"

    echo -e "\n${YELLOW}Test accounts:${NC}"
    echo "  Admin: admin@depan-express.fr / Admin123!"
    echo "  Customer: jean.dupont@email.com / Customer123!"
    echo "  Professional: paul.plombier@artisan.fr / Pro123!"

    echo -e "\n${YELLOW}URLs:${NC}"
    echo "  API: http://localhost:3000"
    echo "  API Docs: http://localhost:3000/api/docs"
    echo "  Admin: http://localhost:3001"
}

# Main execution
main() {
    echo -e "\n${BLUE}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     DEPAN EXPRESS - Development Setup     ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"

    check_prerequisites
    setup_env
    install_dependencies
    start_docker
    setup_database
    print_summary
}

# Handle script arguments
case "${1:-}" in
    --docker-only)
        start_docker
        ;;
    --db-only)
        setup_database
        ;;
    --help)
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --docker-only   Start only Docker services"
        echo "  --db-only       Setup database only (migrations + seed)"
        echo "  --help          Show this help"
        echo ""
        echo "Without options, runs full setup."
        ;;
    *)
        main
        ;;
esac
