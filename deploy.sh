#!/bin/bash
set -e

# ===========================================================================
# OLPU — Production Deploy Script
# ===========================================================================
# Usage:
#   ./deploy.sh              Deploy latest code (normal deploy)
#   ./deploy.sh --fresh      Reset DB + reseed (TESTING PHASE ONLY)
#   ./deploy.sh --seed       Run seeders after migration (TESTING PHASE ONLY)
#
# This script must be run from the project root on the production server:
#   cd /var/www/olpu && ./deploy.sh
# ===========================================================================

APP_DIR="/var/www/olpu"
PHP="/usr/bin/php"
NPM="/usr/bin/npm"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[deploy]${NC} $1"; }
warn() { echo -e "${YELLOW}[deploy]${NC} $1"; }
err()  { echo -e "${RED}[deploy]${NC} $1"; exit 1; }

# Ensure we're in the right directory
cd "$APP_DIR" || err "Cannot cd to $APP_DIR"

# Parse flags
FRESH=false
SEED=false
for arg in "$@"; do
    case $arg in
        --fresh) FRESH=true ;;
        --seed)  SEED=true ;;
    esac
done

# ── 1. Maintenance mode ──────────────────────────────────────────────────
log "Enabling maintenance mode..."
$PHP artisan down --retry=30 || true

# ── 2. Pull latest code ─────────────────────────────────────────────────
log "Pulling latest code from GitHub..."
git pull origin main

# ── 3. Install PHP dependencies ──────────────────────────────────────────
log "Installing Composer dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction

# ── 4. Install Node dependencies & build ─────────────────────────────────
log "Installing Node dependencies..."
$NPM ci

log "Building frontend assets + SSR..."
$NPM run build:ssr

# ── 5. Database migrations ───────────────────────────────────────────────
if [ "$FRESH" = true ]; then
    warn "Running migrate:fresh --seed (DESTROYS ALL DATA)..."
    $PHP artisan migrate:fresh --seed --force
elif [ "$SEED" = true ]; then
    log "Running migrations + seeders..."
    $PHP artisan migrate --force
    $PHP artisan db:seed --force
else
    log "Running migrations..."
    $PHP artisan migrate --force
fi

# ── 6. Clear and rebuild caches ──────────────────────────────────────────
log "Rebuilding caches..."
$PHP artisan config:cache
$PHP artisan route:cache
$PHP artisan view:cache

# ── 7. Storage link (idempotent) ─────────────────────────────────────────
$PHP artisan storage:link 2>/dev/null || true

# ── 8. Fix permissions ───────────────────────────────────────────────────
log "Fixing permissions..."
sudo chgrp -R www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

# ── 9. Restart services ─────────────────────────────────────────────────
log "Restarting services..."
sudo systemctl restart php8.3-fpm
sudo systemctl restart olpu-queue
sudo systemctl restart olpu-ssr
sudo systemctl restart nginx

# ── 10. Disable maintenance mode ─────────────────────────────────────────
log "Disabling maintenance mode..."
$PHP artisan up

# ── 11. Verify ───────────────────────────────────────────────────────────
sleep 2
STATUS=$(curl -sk -o /dev/null -w '%{http_code}' https://olpu.chacao.gob.ve/)
if [ "$STATUS" = "200" ]; then
    log "Deploy complete! Site responding HTTP $STATUS"
else
    warn "Deploy complete but site returned HTTP $STATUS — check logs!"
fi

echo ""
log "Service status:"
sudo systemctl is-active --quiet olpu-queue && echo "  ✓ Queue worker" || echo "  ✗ Queue worker"
sudo systemctl is-active --quiet olpu-ssr   && echo "  ✓ SSR server"   || echo "  ✗ SSR server"
sudo systemctl is-active --quiet nginx      && echo "  ✓ Nginx"        || echo "  ✗ Nginx"
sudo systemctl is-active --quiet php8.3-fpm && echo "  ✓ PHP-FPM"      || echo "  ✗ PHP-FPM"
