# Audio Stem Splitter

Application web pour séparer les stems d'un fichier audio grâce à [Spleeter](https://github.com/deezer/spleeter) de Deezer.

## Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Frontend  │────▶│     Backend     │────▶│ Spleeter Service │
│  (React)    │     │ (Node/Express)  │     │  (Python/Flask)  │
│  Port 8080  │     │   Port 3001     │     │   Port 5001      │
└─────────────┘     └─────────────────┘     └──────────────────┘
```

## Fonctionnalités

- Upload de fichiers audio (MP3, WAV, OGG, FLAC, M4A, max 50 MB)
- Choix du mode de séparation :
  - **2 stems** : Voix + Accompagnement
  - **4 stems** : Voix + Batterie + Basse + Autre
  - **5 stems** : Voix + Batterie + Basse + Piano + Autre
- Téléchargement des stems en fichier ZIP

## Lancement

### Prérequis

- [Docker](https://www.docker.com/) et [Docker Compose](https://docs.docker.com/compose/)

### Démarrage

```bash
docker compose up --build
```

L'application sera disponible sur **http://localhost:8080**

> **Note** : Le build du service Spleeter télécharge les modèles (~500 MB), ce qui peut prendre plusieurs minutes à la première exécution.

## Développement local

### Spleeter service
```bash
cd spleeter-service
pip install -r requirements.txt
python app.py
```

### Backend
```bash
cd backend
npm install
SPLEETER_URL=http://localhost:5001 npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
