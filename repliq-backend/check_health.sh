#!/bin/bash
set -e

# List of health endpoints (adjust ports as needed)
endpoints=(
  "http://localhost:3000/health"  # api-gateway
  "http://localhost:3001/health"  # review-ingestion
  "http://localhost:3002/health"  # review-processing
  "http://localhost:3003/health"  # jira-integration
  "http://localhost:3004/health"  # notification
  "http://localhost:3005/health"  # approval
  # Add more if needed, e.g., semantic-search, feature-spec, chroma, mongo
)

all_ok=true
for url in "${endpoints[@]}"; do
  if curl -fsS "$url" > /dev/null; then
    echo "$url is healthy"
  else
    echo "$url is NOT healthy"
    all_ok=false
  fi
done

if [ "$all_ok" = true ]; then
  echo "All services are healthy!"
  exit 0
else
  echo "Some services are not healthy."
  exit 1
fi
