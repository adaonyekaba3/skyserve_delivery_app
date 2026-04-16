#!/bin/sh
set -eu

API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:3000/api/v1}"
LOG_FILE="${LOG_FILE:-/tmp/skyserve-backend.log}"

if [ ! -f ".env" ]; then
  echo "Missing .env file. Copy .env.example to .env and add your Neon connection strings first."
  exit 1
fi

echo "Generating Prisma client..."
npm run prisma:generate

echo "Applying migrations..."
npm run prisma:migrate:deploy

echo "Seeding baseline data..."
npm run db:seed

echo "Building application..."
npm run build

echo "Starting API..."
npm run start:prod >"$LOG_FILE" 2>&1 &
APP_PID=$!

cleanup() {
  if kill -0 "$APP_PID" 2>/dev/null; then
    kill "$APP_PID" 2>/dev/null || true
    wait "$APP_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "Waiting for health endpoint..."
ATTEMPT=1
until curl -sf "$API_BASE_URL/health" >/dev/null 2>&1; do
  if [ "$ATTEMPT" -ge 30 ]; then
    echo "API did not become healthy in time."
    echo "Server log:"
    cat "$LOG_FILE"
    exit 1
  fi

  ATTEMPT=$((ATTEMPT + 1))
  sleep 2
done

echo "Running smoke test..."
npm run smoke

echo "Local verification completed successfully."
