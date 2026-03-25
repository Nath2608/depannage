#!/bin/bash

# ===========================================
# Depan Express - Generate API Client
# ===========================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Generating API client from OpenAPI spec...${NC}"

# Check if API is running
if ! curl -s http://localhost:3000/api/docs-json > /dev/null 2>&1; then
    echo "Error: API is not running. Please start the API first with 'pnpm dev:api'"
    exit 1
fi

# Create output directory
mkdir -p packages/api-client/src

# Download OpenAPI spec
echo -e "${GREEN}▸${NC} Downloading OpenAPI specification..."
curl -s http://localhost:3000/api/docs-json > packages/api-client/openapi.json

# Check if openapi-generator is installed
if ! command -v openapi-generator &> /dev/null; then
    echo "Installing openapi-generator-cli..."
    npm install -g @openapitools/openapi-generator-cli
fi

# Generate TypeScript client
echo -e "${GREEN}▸${NC} Generating TypeScript client..."
openapi-generator-cli generate \
    -i packages/api-client/openapi.json \
    -g typescript-fetch \
    -o packages/api-client/src \
    --additional-properties=supportsES6=true,typescriptThreePlus=true

echo -e "${GREEN}✔${NC} API client generated at packages/api-client/src"
echo ""
echo "Usage in mobile apps:"
echo "  import { AuthApi, Configuration } from '@depan-express/api-client';"
echo "  const config = new Configuration({ basePath: API_URL });"
echo "  const authApi = new AuthApi(config);"
