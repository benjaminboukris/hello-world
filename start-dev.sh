#!/usr/bin/env bash
# Démarre les 3 services en mode développement (sans Docker)
# Usage : ./start-dev.sh

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV="$ROOT_DIR/.venv"
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

# Créer le venv si nécessaire
if [ ! -d "$VENV" ]; then
    echo "[0/3] Création de l'environnement Python..."
    python3 -m venv "$VENV"
    "$VENV/bin/pip" install --upgrade pip setuptools wheel -q
fi

# 1. Service Demucs (Python/Flask)
echo "[1/3] Installation des dépendances Python (peut prendre quelques minutes)..."
"$VENV/bin/pip" install -r "$ROOT_DIR/spleeter-service/requirements.txt" -q
echo "[1/3] Démarrage du service Demucs sur http://localhost:5001"
"$VENV/bin/python" "$ROOT_DIR/spleeter-service/app.py" &
PIDS+=($!)

# Attendre que le service soit prêt
echo "      Attente du démarrage..."
for i in $(seq 1 30); do
    if curl -s http://localhost:5001/health > /dev/null 2>&1; then
        echo "      Service Demucs prêt !"
        break
    fi
    sleep 1
done

# 2. Backend (Node.js/Express)
echo "[2/3] Installation des dépendances Node.js..."
cd "$ROOT_DIR/backend" && npm install --silent && cd "$ROOT_DIR"
echo "[2/3] Démarrage du backend sur http://localhost:3001"
SPLEETER_URL=http://localhost:5001 node "$ROOT_DIR/backend/src/index.js" &
PIDS+=($!)

# 3. Frontend (Vite dev server)
echo "[3/3] Installation des dépendances frontend..."
cd "$ROOT_DIR/frontend" && npm install --silent && cd "$ROOT_DIR"
echo "[3/3] Démarrage du frontend sur http://localhost:5173"
cd "$ROOT_DIR/frontend" && npm run dev &
PIDS+=($!)

echo ""
echo "================================================"
echo "  Application disponible sur :"
echo "    http://localhost:5173  (frontend)"
echo "================================================"
echo "  Appuyez sur Ctrl+C pour arrêter."
echo ""

wait
