#!/bin/sh
set -e

echo "🔄 Running database migrations..."

# Wait for postgres to be ready
echo "⏳ Waiting for PostgreSQL..."
timeout=30
counter=0
until nc -z postgres 5432 || [ $counter -eq $timeout ]; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
  counter=$((counter + 1))
done

if [ $counter -eq $timeout ]; then
  echo "❌ PostgreSQL connection timeout"
  exit 1
fi

echo "✅ PostgreSQL is up"

# Run database push (applies schema)
echo "📊 Pushing database schema..."
cd /app
pnpm --filter @rewind/api db:push

echo "✅ Database ready"
echo "🚀 Starting API server..."

# Start the application
exec node packages/api/dist/index.js
