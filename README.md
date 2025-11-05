# 🎮 CraftHost Pro - Minecraft Hosting Platform

Eine vollständige Web-basierte Lösung für Minecraft Server Management.

## ⚡ 1-Click Installation

```bash
./install.sh
```

**Das war's!** 🎉

Nach der Installation:
1. Öffne http://localhost in deinem Browser
2. Erstelle deinen Admin-Account (der erste Benutzer wird automatisch Admin)
3. Fertig!

## 📋 Voraussetzungen

- Docker
- Docker Compose

## 🏗️ Projekt-Struktur

```
minecraft-portal/
├── backend/          # Node.js/TypeScript API
├── frontend/         # React/TypeScript UI
└── docker-compose.yml
```

## 🔧 Technologie-Stack

- **Backend**: Node.js, Express, TypeORM, PostgreSQL
- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Datenbank**: PostgreSQL
- **Container**: Docker & Docker Compose

## 📝 Manuelle Verwaltung

```bash
cd minecraft-portal

# Services starten
docker-compose up -d

# Logs anzeigen
docker-compose logs -f

# Services stoppen
docker-compose down

# Neustart
docker-compose restart
```

## 🎯 Features

- ✅ Erstmaliges Setup mit Admin-Registrierung (Pterodactyl-Style)
- ✅ Benutzer- und Rollen-Management
- ✅ Server-Verwaltung
- ✅ Automatische Datenbank-Migration
- ✅ Moderne React UI mit TailwindCSS
- ✅ JWT Authentication
- ✅ Docker-basierte Bereitstellung

## 📊 Standard-Ports

- Frontend: `http://localhost:80`
- Backend: `http://localhost:3001`
- PostgreSQL: `localhost:5432`

## 🔐 Sicherheit

- Passwörter werden mit bcrypt gehasht
- JWT für sichere Authentication
- First-User wird automatisch Admin
- Weitere Registrierungen sind nach dem ersten Setup deaktiviert