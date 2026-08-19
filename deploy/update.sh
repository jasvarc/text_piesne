#!/bin/bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "Adresar appky: $APP_DIR"

echo "Stahujem najnovsiu verziu z git..."
sudo git pull

if [ ! -f "$APP_DIR/.env" ] && [ -f "$APP_DIR/.env.example" ]; then
  sudo cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo "Vytvoreny $APP_DIR/.env - doplň ANTHROPIC_API_KEY, ak chces slovenske hinty (sudo nano $APP_DIR/.env)."
fi

echo "Obnovujem systemd sluzbu (ak sa zmenila)..."
sudo sed "s|__APP_DIR__|$APP_DIR|g" "$APP_DIR/deploy/text_piesne.service" | sudo tee /etc/systemd/system/text_piesne.service > /dev/null
sudo systemctl daemon-reload

echo "Obnovujem vlastnika suborov (www-data)..."
sudo chown -R www-data:www-data "$APP_DIR"

echo "Restartujem appku..."
sudo systemctl restart text_piesne

sleep 1
echo ""
echo "Stav appky:"
sudo systemctl --no-pager status text_piesne || true
