#!/bin/sh
echo "=== Starting Stock Management Server ==="
echo "DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo 'yes' || echo 'no')"
echo "PORT: ${PORT:-3001}"

echo "=== Running Prisma migrations ==="
npx prisma migrate deploy || echo "Warning: Migration failed or no migrations to run"

echo "=== Starting Node.js server ==="
exec node dist/index.js
