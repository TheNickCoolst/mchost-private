# Minecraft Server Management Portal

Ein vollständig anpassbares, in-house entwickeltes Webportal zur Verwaltung von Minecraft-Servern mit Wings-Daemon-Integration.

## 🚀 Features

- **Benutzerauthentifizierung**: JWT-basierte Authentifizierung mit Refresh-Tokens
- **Server-Verwaltung**: Erstellen, starten, stoppen und überwachen von Minecraft-Servern
- **Live-Konsole**: Echtzeit-Konsolenausgabe über WebSocket-Verbindung
- **Ressourcen-Monitoring**: CPU, RAM, Disk und Netzwerk-Überwachung
- **Benutzerrollen**: Admin, Moderator und User-Rollen mit granulären Berechtigungen
- **Wings-Integration**: Vollständige Integration mit Pterodactyl Wings Daemon
- **Responsive Design**: Mobile-first Design mit Tailwind CSS
- **Sichere API**: Rate-Limiting, CORS, Helmet und weitere Sicherheitsfeatures

## 🛠 Technologie-Stack

### Backend
- **Runtime**: Node.js 18.x LTS
- **Framework**: Express.js mit TypeScript
- **Datenbank**: PostgreSQL mit TypeORM
- **Authentifizierung**: JWT + Refresh Tokens
- **Real-time**: Socket.io für Live-Updates
- **Sicherheit**: Helmet, CORS, Rate-Limiting, bcrypt

### Frontend
- **Framework**: React 18 mit TypeScript
- **Build-Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **Forms**: React Hook Form mit Yup-Validierung

### DevOps
- **Containerisierung**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus & Grafana (optional)
- **Logging**: Strukturiertes Logging mit Winston

## 📋 Voraussetzungen

- Node.js 18.x oder höher
- PostgreSQL 14+
- Docker & Docker Compose (für Container-Deployment)
- Wings Daemon (Pterodactyl)

## 🚀 Installation & Setup

### 1. Repository klonen

```bash
git clone <repository-url>
cd minecraft-portal
```

### 2. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
# Bearbeite .env mit deinen Konfigurationen
```

### 3. Mit Docker Compose starten (empfohlen)

```bash
docker-compose up -d
```

### 4. Manuelle Installation

#### Backend Setup
```bash
cd backend
npm install
npm run build
npm start
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run build
npm run preview
```

## 🔧 Konfiguration

### Wings Daemon Integration

1. **Wings API-Key konfigurieren**:
   ```env
   WINGS_URL=https://your-wings-node:8080
   WINGS_API_KEY=your-api-key
   ```

2. **TLS-Zertifikate**: Stelle sicher, dass Wings über HTTPS erreichbar ist

3. **Firewall**: Öffne die erforderlichen Ports für die Kommunikation

### Datenbank-Migration

```bash
cd backend
npm run migration:run
```

### Erster Admin-User

```bash
cd backend
npm run seed:admin
```

## 📖 API-Dokumentation

Die API-Dokumentation ist über Swagger verfügbar:
```
http://localhost:4000/api-docs
```

### Wichtige Endpunkte

- `POST /api/auth/login` - Benutzeranmeldung
- `POST /api/auth/register` - Benutzerregistrierung
- `GET /api/servers` - Server auflisten
- `POST /api/servers` - Server erstellen
- `POST /api/servers/:id/action` - Server-Aktionen (start/stop/restart)
- `GET /api/servers/:id/console` - Konsolen-Logs abrufen

## 🔒 Sicherheit

### Implementierte Sicherheitsmaßnahmen

- **Password Hashing**: bcrypt mit Salt-Rounds
- **JWT Security**: Asymmetrische Schlüssel, kurze Laufzeiten
- **Rate Limiting**: IP-basierte Anfragenbegrenzung
- **CORS Protection**: Nur autorisierte Domains
- **Input Validation**: Joi/Yup-Schema-Validierung
- **SQL Injection Protection**: TypeORM Parametrisierung

### Produktions-Checklist

- [ ] Starke JWT-Secrets gesetzt
- [ ] Database-Credentials gesichert
- [ ] HTTPS aktiviert
- [ ] Firewall konfiguriert
- [ ] Backup-Strategie implementiert
- [ ] Monitoring aktiviert

## 📊 Monitoring & Logging

### Prometheus Metriken
```bash
# Backend-Metriken aktivieren
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
```

### Log-Level konfigurieren
```env
LOG_LEVEL=info  # debug, info, warn, error
```

## 🔄 Deployment

### Docker Production
```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes
```bash
# Helm Charts verwenden
helm install minecraft-portal ./helm-charts/
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:coverage
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

### E2E Tests
```bash
npm run test:e2e
```

## 📈 Performance-Optimierung

### Empfohlene Einstellungen

- **Memory**: Minimum 2GB RAM für Backend
- **CPU**: 2+ Cores empfohlen
- **Storage**: SSD für Datenbank
- **Network**: Gigabit-Verbindung

### Caching-Strategien

- Redis für Session-Speicherung
- CDN für statische Assets
- Database Query-Optimierung

## 🛠 Troubleshooting

### Häufige Probleme

1. **Wings-Verbindungsfehler**:
   ```bash
   # TLS-Zertifikat prüfen
   openssl s_client -connect your-wings-node:8080
   ```

2. **Database-Verbindungsfehler**:
   ```bash
   # PostgreSQL-Status prüfen
   sudo systemctl status postgresql
   ```

3. **Frontend Build-Fehler**:
   ```bash
   # Node-Module neu installieren
   rm -rf node_modules package-lock.json
   npm install
   ```

## 🤝 Contributing

1. Fork das Repository
2. Feature-Branch erstellen (`git checkout -b feature/amazing-feature`)
3. Änderungen committen (`git commit -m 'Add amazing feature'`)
4. Branch pushen (`git push origin feature/amazing-feature`)
5. Pull Request erstellen

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe [LICENSE](LICENSE) für Details.

## 🆘 Support

Bei Fragen oder Problemen:

1. [GitHub Issues](../../issues) für Bug-Reports
2. [Discussions](../../discussions) für Fragen
3. [Wiki](../../wiki) für erweiterte Dokumentation

## 🗺 Roadmap

- [ ] Multi-Node Wings Support
- [ ] Plugin-System für Erweiterungen
- [ ] Automatisierte Backups
- [ ] Mobile App
- [ ] Advanced Monitoring Dashboard
- [ ] User-spezifische Themes

---

**Entwickelt mit ❤️ für die Minecraft-Community**