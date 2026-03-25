#!/bin/bash

# ===========================================
# Depan Express - Development Reset Script
# ===========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}⚠ This will reset your development environment!${NC}"
echo "  - Drop all database tables"
echo "  - Re-run migrations"
echo "  - Re-seed the database"
echo ""
read -p "Are you sure? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo -e "\n${GREEN}▸${NC} Resetting database..."

# Reset database
pnpm --filter @depan-express/database db:reset

echo -e "\n${GREEN}▸${NC} Seeding database..."

# Re-seed
pnpm --filter @depan-express/database db:seed

echo -e "\n${GREEN}✔${NC} Development environment reset complete!"
echo -e "\n${YELLOW}Test accounts:${NC}"
echo "  Admin: admin@depan-express.fr / Admin123!"
echo "  Customer: jean.dupont@email.com / Customer123!"
echo "  Professional: paul.plombier@artisan.fr / Pro123!"
