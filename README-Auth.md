# LDAP Authentication Setup

Diese Anwendung wurde mit LDAP-Authentifizierung über NextAuth.js erweitert. Alle Routen sind jetzt geschützt und erfordern eine gültige Anmeldung.

## 🔧 Setup

### 1. Dependencies installieren
```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren
Kopieren Sie `.env.example` zu `.env.local` und passen Sie die Werte an:

```bash
cp .env.example .env.local
```

Wichtige Umgebungsvariablen:
- `NEXTAUTH_SECRET`: Ein sicherer, zufälliger String für JWT-Signierung
- `NEXTAUTH_URL`: Die URL Ihrer Anwendung (http://localhost:3000 für Development)
- `LDAP_URL`: LDAP-Server URL (ldap://localhost:389 für lokalen Test-Server)
- `LDAP_BASE_DN`: LDAP Base Distinguished Name (dc=tasmota,dc=local)

### 3. LDAP Test-Server starten
```bash
cd tasmo-admin
docker-compose up -d ldap phpldapadmin
```

Der LDAP-Server wird mit vorkonfigurierten Test-Benutzern gestartet.

### 4. Anwendung starten
```bash
npm run dev
```

## 👥 Test-Benutzer

Die folgenden Test-Benutzer sind im LDAP-Server vorkonfiguriert:

| Benutzername | Passwort | Beschreibung |
|--------------|----------|--------------|
| `admin` | `admin` | Administrator |
| `testuser` | `admin` | Test-Benutzer |
| `jdoe` | `admin` | John Doe |

## 🔐 Funktionen

### Authentifizierung
- **Login-Seite**: `/auth/signin`
- **Error-Seite**: `/auth/error`
- **Automatische Umleitung**: Nicht-authentifizierte Benutzer werden zur Login-Seite weitergeleitet
- **Session-Management**: 24-Stunden Sessions mit automatischer Erneuerung

### Sicherheit
- Alle Routen sind standardmäßig geschützt (außer Auth-Routen)
- JWT-basierte Sessions
- LDAP-Integration für Benutzerauthentifizierung
- Logout-Funktionalität im Dashboard

### LDAP-Konfiguration
- Standard LDAP-Authentifizierung
- Benutzerinformationen werden aus LDAP abgerufen (Name, E-Mail, etc.)
- Anpassbare LDAP-Server-Einstellungen über Umgebungsvariablen

## 🛠 LDAP Administration

### phpLDAPadmin Interface
Zugriff über: http://localhost:8081

Login:
- **Login DN**: `cn=admin,dc=tasmota,dc=local`
- **Passwort**: `admin`

### LDAP-Struktur
```
dc=tasmota,dc=local
├── ou=users
│   ├── uid=admin
│   ├── uid=testuser
│   └── uid=jdoe
└── ou=groups
    ├── cn=admins
    └── cn=users
```

## 🔄 Development

### Middleware
Die Datei `middleware.ts` schützt alle Routen:
- Prüft auf gültige NextAuth-Session
- Leitet nicht-authentifizierte Benutzer zur Login-Seite um
- Verhindert Zugriff auf Auth-Seiten für angemeldete Benutzer

### Session Provider
Der `SessionProvider` ist in das Layout integriert und stellt Session-Informationen für alle Komponenten bereit.

### Logout-Funktionalität
Ein Logout-Button ist im Dashboard-Header integriert und bietet:
- Benutzerinformationen anzeigen
- Sicheres Abmelden
- Umleitung zur Login-Seite

## 🐳 Docker

### Vollständiges Setup starten
```bash
docker-compose up -d
```

Dies startet:
- PostgreSQL-Datenbank
- LDAP-Server mit Test-Daten
- phpLDAPadmin Interface
- Tasmota Admin-Anwendung

### Nur LDAP-Services
```bash
docker-compose up -d ldap phpldapadmin
```

## 📝 Anpassungen

### LDAP-Server ändern
Bearbeiten Sie die Umgebungsvariablen in `.env.local`:
```env
LDAP_URL="ldap://your-ldap-server:389"
LDAP_BASE_DN="dc=yourcompany,dc=com"
```

### Benutzer hinzufügen
1. Verwenden Sie phpLDAPadmin (http://localhost:8081)
2. Oder erstellen Sie LDIF-Dateien im `ldif/` Verzeichnis
3. Die Benutzer müssen in `ou=users,dc=tasmota,dc=local` erstellt werden

### Session-Einstellungen
Bearbeiten Sie `src/lib/auth.ts` für:
- Session-Dauer
- JWT-Einstellungen
- Callback-URLs

## 🔍 Troubleshooting

### LDAP-Verbindungsprobleme
- Prüfen Sie, ob der LDAP-Server läuft: `docker-compose ps`
- Überprüfen Sie die LDAP-URL in den Umgebungsvariablen
- Testen Sie die Verbindung mit phpLDAPadmin

### Anmeldung schlägt fehl
- Überprüfen Sie Benutzername und Passwort
- Stellen Sie sicher, dass der Benutzer in LDAP existiert
- Prüfen Sie die Browser-Konsole auf Fehler

### Session-Probleme
- Löschen Sie Browser-Cookies
- Prüfen Sie `NEXTAUTH_SECRET` in `.env.local`
- Starten Sie die Anwendung neu

## 📱 API-Endpoints

### NextAuth API
- `GET/POST /api/auth/signin` - Login-Seite
- `GET/POST /api/auth/signout` - Logout
- `GET /api/auth/session` - Aktuelle Session
- `GET /api/auth/csrf` - CSRF-Token

### Session-Prüfung in API-Routen
```typescript
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  // ... API-Logic
}
``` 