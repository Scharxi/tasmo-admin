# Tasmota Admin Dashboard

A modern, professional admin dashboard for managing Tasmota smart plugs and devices. Built with Next.js 15, PostgreSQL, Prisma, and shadcn/ui.

## Features

- 🏠 **Device Management**: Register, monitor, and control Tasmota devices
- ⚡ **Power Control**: Turn devices on/off with prominent power buttons
- 📊 **Energy Monitoring**: Track power consumption and energy usage
- 🔍 **Auto-Discovery**: Automatically discover Tasmota devices on your network
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🎨 **Modern UI**: Clean, professional interface with smooth animations
- 🚀 **High Performance**: Optimized for smooth scrolling and interactions

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **UI**: shadcn/ui, Tailwind CSS
- **State Management**: TanStack Query
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- Git

## Quick Start

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd tasmota/tasmo-admin
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Start Database

\`\`\`bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Wait for database to be ready (about 10-15 seconds)
\`\`\`

### 4. Setup Database

\`\`\`bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed with sample data
npm run db:seed
\`\`\`

### 5. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

The dashboard will be available at [http://localhost:3001](http://localhost:3001)

## Database Management

### Prisma Studio
Access the database GUI:
\`\`\`bash
npm run db:studio
\`\`\`

### Adminer
Alternative database GUI available at [http://localhost:8080](http://localhost:8080)
- **Server**: postgres
- **Username**: tasmota_user  
- **Password**: tasmota_password
- **Database**: tasmota_db

### Database Commands

\`\`\`bash
# Generate Prisma client after schema changes
npm run db:generate

# Push schema changes to database
npm run db:push

# Create and run migrations
npm run db:migrate

# Reset database and reseed
npm run db:push --force-reset
npm run db:seed
\`\`\`

## Adding Tasmota Devices

### Method 1: Auto-Discovery
1. Click "Add Device" in the dashboard
2. Click "Discover" to scan your network
3. Select discovered devices to add them

### Method 2: Manual Entry
1. Click "Add Device" in the dashboard
2. Fill in the device details:
   - **Device ID**: Unique identifier (e.g., kitchen_001)
   - **Device Name**: Human-readable name
   - **IP Address**: Device's network IP
   - **MAC Address**: (Optional) Device MAC address
   - **Firmware Version**: Tasmota firmware version

## API Endpoints

### Devices
- `GET /api/devices` - Get all devices
- `POST /api/devices` - Create new device
- `POST /api/devices/[deviceId]/toggle` - Toggle device power
- `DELETE /api/devices/[deviceId]` - Delete device

### Device Discovery
- `POST /api/devices/discover` - Discover Tasmota devices on network

## Environment Variables

Create a `.env` file with:

\`\`\`env
# Database
DATABASE_URL="postgresql://tasmota_user:tasmota_password@localhost:5432/tasmota_db?schema=public"

# Next.js
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3001"

# App Configuration
NODE_ENV="development"
PORT=3001
\`\`\`

## Database Schema

### Device Model
- Device information (ID, name, IP, MAC, firmware)
- Status (online/offline/error)
- Power state and energy consumption
- WiFi signal strength and uptime
- Timestamps for tracking

### Energy Readings
- Historical power consumption data
- Voltage and current measurements
- Timestamped for analytics

### Device Logs
- System logs and events
- Different log levels (DEBUG, INFO, WARN, ERROR)
- Structured logging with JSON data

## Development

### Project Structure
\`\`\`
tasmo-admin/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── api/            # API routes
│   │   └── globals.css     # Global styles
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── Dashboard.tsx   # Main dashboard
│   │   ├── DeviceCard.tsx  # Device card component
│   │   └── AddDeviceDialog.tsx # Add device dialog
│   └── lib/               # Utilities and services
│       ├── api.ts         # API client
│       ├── db.ts          # Database service
│       ├── prisma.ts      # Prisma client
│       └── utils.ts       # Utility functions
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts           # Database seeding
├── docker-compose.yml     # Docker services
└── package.json
\`\`\`

### Adding New Features

1. **Database Changes**: Update `prisma/schema.prisma`
2. **API Routes**: Add routes in `src/app/api/`
3. **Components**: Create components in `src/components/`
4. **Services**: Add business logic in `src/lib/`

### Performance Optimizations

The dashboard is optimized for performance:
- Minimal animations and effects
- Efficient database queries
- Optimized React rendering
- Smooth scrolling experience

## Troubleshooting

### Database Connection Issues
\`\`\`bash
# Check if PostgreSQL is running
docker-compose ps

# View database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
\`\`\`

### Prisma Issues
\`\`\`bash
# Reset Prisma client
rm -rf node_modules/.prisma
npm run db:generate

# Reset database
npm run db:push --force-reset
npm run db:seed
\`\`\`

### Port Conflicts
If port 3001 is in use, update the PORT in `.env` or use:
\`\`\`bash
PORT=3002 npm run dev
\`\`\`

## Production Deployment

### Environment Setup
1. Set production environment variables
2. Use a managed PostgreSQL service
3. Configure proper security settings
4. Set up SSL/TLS certificates

### Build and Deploy
\`\`\`bash
# Build for production
npm run build

# Start production server
npm start
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review existing GitHub issues
3. Create a new issue with detailed information

---

**Happy Smart Home Management! 🏠⚡**
