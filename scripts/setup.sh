#!/bin/bash

# ============================================================
# Depan Express - Initial Setup Script
# ============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Depan Express - Initial Setup${NC}"
echo -e "${BLUE}============================================${NC}"

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ $1 is installed${NC}"
}

check_command "docker"
check_command "docker-compose"
check_command "node"
check_command "pnpm"

# Check Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Error: Docker is not running${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"

# Create .env file if not exists
if [ ! -f ".env" ]; then
    echo -e "${BLUE}Creating .env file from template...${NC}"
    cp .env.example .env

    # Generate random secrets
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')

    # Replace placeholders (macOS compatible)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|your-super-secret-jwt-key-change-in-production|${JWT_SECRET}|g" .env
        sed -i '' "s|your-super-secret-refresh-key-change-in-production|${JWT_REFRESH_SECRET}|g" .env
    else
        sed -i "s|your-super-secret-jwt-key-change-in-production|${JWT_SECRET}|g" .env
        sed -i "s|your-super-secret-refresh-key-change-in-production|${JWT_REFRESH_SECRET}|g" .env
    fi

    echo -e "${GREEN}✓ .env file created with generated secrets${NC}"
else
    echo -e "${YELLOW}⚠ .env file already exists, skipping...${NC}"
fi

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
pnpm install

# Start infrastructure services
echo -e "${BLUE}Starting infrastructure services (PostgreSQL, Redis, MinIO)...${NC}"
docker compose up -d postgres redis

# Wait for services to be ready
echo -e "${BLUE}Waiting for services to be ready...${NC}"
sleep 10

# Check if postgres is ready
until docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo -e "${YELLOW}Waiting for PostgreSQL...${NC}"
    sleep 2
done
echo -e "${GREEN}✓ PostgreSQL is ready${NC}"

# Generate Prisma client
echo -e "${BLUE}Generating Prisma client...${NC}"
cd apps/api && npx prisma generate && cd ../..

# Run migrations
echo -e "${BLUE}Running database migrations...${NC}"
cd apps/api && npx prisma migrate dev --name init && cd ../..

# Create MinIO bucket (development)
echo -e "${BLUE}Starting MinIO for development...${NC}"
docker compose --profile dev up -d minio
sleep 5

# Seed database (optional)
echo -e "${BLUE}Seeding database with sample data...${NC}"
cd apps/api && npx prisma db seed && cd ../.. || echo -e "${YELLOW}⚠ No seed script found, skipping...${NC}"

echo -e ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e ""
echo -e "Next steps:"
echo -e "  1. Review and update ${YELLOW}.env${NC} file with your API keys"
echo -e "  2. Start development servers:"
echo -e "     ${BLUE}pnpm dev${NC}"
echo -e ""
echo -e "Available services:"
echo -e "  - API:      ${BLUE}http://localhost:3000${NC}"
echo -e "  - Admin:    ${BLUE}http://localhost:3001${NC}"
echo -e "  - Adminer:  ${BLUE}http://localhost:8080${NC}"
echo -e "  - MinIO:    ${BLUE}http://localhost:9001${NC}"
echo -e "  - MailHog:  ${BLUE}http://localhost:8025${NC}"
echo -e ""
