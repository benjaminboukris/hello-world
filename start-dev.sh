#!/usr/bin/env bash
# Démarre les 3 services en mode développement (sans Docker)
# Usage : ./start-dev.sh

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PIDS=()

cleanup() {
    echo ""
    echo "Arrêt des services..."
    for pid in "${PIDS[@]}"; do
        kill "$pid" 2>/dev/null
    done
    wait 2>/dev/null
    echo "Tous les services sont arrêtés."
}
trap cleanup EXIT INT TERM

echo "=== Audio Stem Splitter - Mode développement ==="
echo ""

# 1. Spleeter service (Python/Flask)
echo "[1/3] Installation des dépendances Python..."
cd "$ROOT_DIR/spleeter-service"
pip install -r requirements.txt -q
echo "[1/3] Démarrage du service Spleeter sur http://localhost:5001"
python app.py &
PIDS+=($!)
cd "$ROOT_DIR"

# Attendre que le service Spleeter soit prêt
echo "      Attente du démarrage de Spleeter..."
for i in $(seq 1 30); do
    if curl -s http://localhost:5001/health > /dev/null 2>&1; then
        echo "      Spleeter prêt !"
        break
    fi
    sleep 1
done

# 2. Backend (Node.js/Express)
echo "[2/3] Installation des dépendances Node.js..."
cd "$ROOT_DIR/backend"
npm install --silent
echo "[2/3] Démarrage du backend sur http://localhost:3001"
SPLEETER_URL=http://localhost:5001 node src/index.js &
PIDS+=($!)
cd "$ROOT_DIR"

# 3. Frontend (Vite dev server)
echo "[3/3] Installation des dépendances frontend..."
cd "$ROOT_DIR/frontend"
npm install --silent
echo "[3/3] Démarrage du frontend sur http://localhost:5173"
npm run dev &
PIDS+=($!)
cd "$ROOT_DIR"

echo ""
echo "================================================"
echo "  Application disponible sur :"
echo "    http://localhost:5173  (frontend)"
echo "    http://localhost:3001  (backend API)"
echo "    http://localhost:5001  (spleeter service)"
echo ""
echo "  Appuyez sur Ctrl+C pour arrêter tous les services."
echo "================================================"

wait
