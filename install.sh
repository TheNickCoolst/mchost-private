#!/bin/bash

#############################################
# CraftHost Pro - 1-Click Installation
# Einfaches Setup für Minecraft Hosting Platform
#############################################

set -e

echo "========================================="
echo "  🚀 CraftHost Pro Installation"
echo "========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker ist nicht installiert!"
    echo "Bitte installiere Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose ist nicht installiert!"
    echo "Bitte installiere Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker gefunden"
echo "✅ Docker Compose gefunden"
echo ""

# Navigate to project directory
cd "$(dirname "$0")/minecraft-portal"

echo "🔧 Starte CraftHost Pro..."
echo ""

# Use docker compose (newer) or docker-compose (older)
if docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Stop existing containers
echo "🛑 Stoppe existierende Container..."
$DOCKER_COMPOSE down 2>/dev/null || true

# Start services
echo "🚀 Starte Services..."
$DOCKER_COMPOSE up -d

echo ""
echo "========================================="
echo "  ✅ Installation abgeschlossen!"
echo "========================================="
echo ""
echo "📍 Zugriff:"
echo "   Frontend: http://localhost"
echo "   Backend:  http://localhost:3001"
echo ""
echo "🔐 Nächster Schritt:"
echo "   1. Öffne http://localhost in deinem Browser"
echo "   2. Erstelle deinen Admin-Account"
echo "   3. Fertig! 🎉"
echo ""
echo "📝 Logs anzeigen:"
echo "   $DOCKER_COMPOSE logs -f"
echo ""
echo "🛑 Services stoppen:"
echo "   $DOCKER_COMPOSE down"
echo ""
echo "========================================="
