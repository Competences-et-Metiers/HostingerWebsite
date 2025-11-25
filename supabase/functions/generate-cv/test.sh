#!/bin/bash

# Test script for the generate-cv edge function
# Usage: ./test.sh [jwt_token]

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
FUNCTION_URL="${SUPABASE_URL:-http://127.0.0.1:54321}/functions/v1/generate-cv"
JWT_TOKEN="${1:-your_jwt_token_here}"

echo -e "${YELLOW}Testing CV Generation Function${NC}"
echo -e "URL: $FUNCTION_URL\n"

# Test payload
PAYLOAD='{
  "additionalInstructions": "I have 5 years of experience as a Senior Full Stack Developer at TechCorp. I led a team of 5 developers and successfully delivered 10+ projects. I have a Masters degree in Computer Science from University of Paris. My technical skills include JavaScript, TypeScript, React, Node.js, Python, PostgreSQL, and AWS. I am certified in AWS Solutions Architect."
}'

echo -e "${YELLOW}Sending request...${NC}\n"

# Make the request
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Extract HTTP status
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d':' -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS:.*//')

# Check status
if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}✓ Success! (Status: $HTTP_STATUS)${NC}\n"
  echo -e "${YELLOW}Generated CV:${NC}"
  echo "$RESPONSE_BODY" | jq -r '.cv' || echo "$RESPONSE_BODY"
else
  echo -e "${RED}✗ Failed! (Status: $HTTP_STATUS)${NC}\n"
  echo -e "${RED}Error Response:${NC}"
  echo "$RESPONSE_BODY" | jq '.' || echo "$RESPONSE_BODY"
fi

echo ""



