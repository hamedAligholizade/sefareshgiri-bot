#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."
until nc -z postgres 5437; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done
echo "PostgreSQL is up - executing command"

echo "Running database migrations..."
node src/db/migrate.js

echo "Starting bot and server..."
node src/server.js & node src/index.js

# Keep the container running
wait 