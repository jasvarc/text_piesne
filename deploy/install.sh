#!/bin/bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Tento skript spusti s sudo: sudo bash deploy/install.sh"
  exit 1
fi

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "Adresar appky: $APP_DIR"

git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js nie je najdeny v PATH. Najprv ho nainstaluj (pozri README-DEPLOY.md) a skript spusti znova."
  exit 1
fi
echo "Node.js verzia: $(node -v)"

echo "Nastavujem vlastnika suborov na www-data..."
chown -R www-data:www-data "$APP_DIR"

echo "Instalujem systemd sluzbu..."
sed "s|__APP_DIR__|$APP_DIR|g" "$APP_DIR/deploy/text_piesne.service" > /etc/systemd/system/text_piesne.service
systemctl daemon-reload
systemctl enable --now text_piesne

sleep 1
systemctl --no-pager status text_piesne || true

echo ""
echo "Hotovo. Dalsie kroky:"
echo "1. Pridaj do svojho Apache vhostu riadky z $APP_DIR/deploy/apache-text_piesne.conf a restartuj apache: sudo systemctl restart apache2"
echo "2. Otvor http://tvoj-server/text_piesne/ v prehliadaci."
