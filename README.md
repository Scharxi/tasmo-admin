# Tasmota Admin Dashboard

Ein modernes, professionelles Admin Dashboard für die Verwaltung von Tasmota Smart Devices. Entwickelt mit Next.js 15, TypeScript, Tailwind CSS und shadcn/ui.

![Dashboard Preview](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Tasmota+Admin+Dashboard)

## 🚀 Features

- **Modern UI**: Elegantes, responsives Design mit glassmorphen Effekten
- **Real-time Updates**: Live-Aktualisierung der Gerätestatus alle 10 Sekunden
- **Device Management**: Ein-/Ausschalten von Geräten mit visueller Rückmeldung
- **Energy Monitoring**: Überwachung von Stromverbrauch und Energiedaten
- **Animations**: Flüssige CSS-Animationen und Übergänge
- **Professional Theme**: Dunkle und helle Modi mit modernen Farbschemata
- **Mobile First**: Vollständig responsive für alle Bildschirmgrößen

## 🏗️ Tech Stack

- **Framework**: Next.js 15 mit App Router
- **Styling**: Tailwind CSS 4 mit benutzerdefinierten Animationen
- **UI Components**: shadcn/ui (Custom Implementation)
- **TypeScript**: Vollständige Typisierung
- **Icons**: Handcrafted SVG Icons
- **Backend Integration**: Mock API für Tasmota-Simulator

## 📦 Installation

### Voraussetzungen

- Node.js 18+ 
- npm, yarn oder pnpm

### Setup

1. **Dependencies installieren**:
```bash
npm install
# oder
yarn install
# oder
pnpm install
```

2. **Development Server starten**:
```bash
npm run dev
# oder
yarn dev
# oder
pnpm dev
```

3. **Dashboard öffnen**:
   - Öffne [http://localhost:3000](http://localhost:3000) in deinem Browser

## 🔧 Konfiguration

### Tasmota-Simulator Integration

Das Dashboard ist für die Integration mit dem `tasmota-sim` Projekt konfiguriert:

1. **Simulator starten** (im `tasmota-sim` Verzeichnis):
```bash
# IP-Aliase für direkte Device-Zugriffe erstellen
./setup-ip-aliases.sh

# Container starten
docker-compose up -d

# Devices erstellen
tasmota-sim create-devices --count 3 --setup-ip-aliases
```

2. **API-Endpunkte** (konfiguriert in `src/lib/api.ts`):
   - Device 1: `http://172.25.0.100` (kitchen_001)
   - Device 2: `http://172.25.0.101` (kitchen_002)
   - Device 3: `http://172.25.0.102` (kitchen_003)

### Umgebungsvariablen

Erstelle eine `.env.local` Datei für erweiterte Konfiguration:

```env
# API Base URL (optional)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081

# Tasmota Auth (falls erforderlich)
NEXT_PUBLIC_TASMOTA_USER=admin
NEXT_PUBLIC_TASMOTA_PASS=test1234!

# Refresh-Intervall (Millisekunden)
NEXT_PUBLIC_REFRESH_INTERVAL=10000
```

## 🎨 UI Components

### Verfügbare Komponenten

- **Card**: Basis-Container für Inhalte
- **Badge**: Status-Indikatoren (Online/Offline/Active)
- **Switch**: Toggle-Schalter für Geräte-Power
- **Button**: Aktions-Buttons mit Varianten
- **DeviceCard**: Spezialisierte Karte für Tasmota-Geräte
- **Dashboard**: Haupt-Layout mit Stats und Device-Grid

### Styling-System

- **CSS Variables**: Konsistente Farb- und Größen-Tokens
- **Custom Animations**: 
  - `fade-in`: Sanftes Einblenden
  - `fade-in-up`: Einblenden mit Bewegung
  - `pulse-glow`: Leuchtender Puls-Effekt
  - `shimmer`: Loading-Animation
- **Glass Effects**: Backdrop-blur für moderne Glasoptik

## 📊 Dashboard Features

### Statistik-Karten

- **Total Devices**: Anzahl aller konfigurierten Geräte
- **Online**: Anzahl der online verfügbaren Geräte
- **Active**: Anzahl der eingeschalteten Geräte
- **Total Power**: Gesamt-Stromverbrauch aller aktiven Geräte

### Device Management

- **Status-Übersicht**: Online/Offline/Power-Status mit visuellen Indikatoren
- **Power Control**: Ein-/Ausschalten mit animiertem Toggle-Switch
- **Energy Monitoring**: Aktueller Verbrauch und Gesamt-Energie
- **Technical Details**: WiFi-Signal, Uptime, Firmware-Version

### Real-time Features

- **Auto-Refresh**: Automatische Aktualisierung alle 10 Sekunden
- **Manual Refresh**: Button mit Spin-Animation
- **Loading States**: Shimmer-Effekte während Ladezuständen
- **Error Handling**: Graceful Fallbacks bei API-Fehlern

## 🔄 API Integration

### Mock-Implementation

Das Dashboard verwendet einen Mock-API-Layer (`src/lib/api.ts`) für die Demo:

```typescript
// Device-Liste abrufen
const devices = await tasmotaAPI.fetchDevices()

// Gerät ein-/ausschalten
await tasmotaAPI.toggleDevicePower(deviceId)

// Gerätestatus abfragen
const device = await tasmotaAPI.getDeviceStatus(deviceId)

// Energiedaten abrufen
const energy = await tasmotaAPI.getEnergyData(deviceId)
```

### Echter Tasmota-Integration

Für die Integration mit echten Tasmota-Geräten, passe die API-Klasse an:

```typescript
// In src/lib/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'

// Beispiel für echte HTTP-Requests
async fetchDevices(): Promise<TasmotaDevice[]> {
  const response = await fetch(`${BASE_URL}/devices`)
  return response.json()
}
```

## 🎯 Geplante Features

- [ ] **TanStack Query**: Erweiterte State-Management und Caching
- [ ] **WebSocket Integration**: Real-time Updates ohne Polling
- [ ] **Device Grouping**: Räume und Gruppen für bessere Organisation
- [ ] **Energy Charts**: Historische Verbrauchsdiagramme mit Recharts
- [ ] **Settings Panel**: Benutzer-Konfiguration und Präferenzen
- [ ] **Export Functions**: CSV/Excel-Export von Energiedaten
- [ ] **Push Notifications**: Browser-Benachrichtigungen für Status-Änderungen

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Vercel Deployment

Das Projekt ist optimiert für Vercel-Deployment:

```bash
vercel --prod
```

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/amazing-feature`)
3. Committe deine Änderungen (`git commit -m 'Add amazing feature'`)
4. Push den Branch (`git push origin feature/amazing-feature`)
5. Öffne eine Pull Request

## 📝 License

Dieses Projekt steht unter der MIT License. Siehe [LICENSE](LICENSE) für Details.

## 🔗 Links

- [Tasmota Documentation](https://tasmota.github.io/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

---

**Entwickelt mit ❤️ für das Tasmota-Ökosystem**
