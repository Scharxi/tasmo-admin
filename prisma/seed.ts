import { PrismaClient, DeviceStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.energyReading.deleteMany()
  await prisma.deviceLog.deleteMany()
  await prisma.device.deleteMany()

  // Create sample devices
  const devices = [
    {
      deviceId: 'kitchen_001',
      deviceName: 'Kitchen Coffee Maker',
      ipAddress: '192.168.1.101',
      macAddress: 'AA:BB:CC:DD:EE:01',
      firmwareVersion: '13.2.0',
      status: DeviceStatus.ONLINE,
      powerState: true,
      energyConsumption: 45.2,
      totalEnergy: 125.8,
      wifiSignal: -45,
      uptime: 86400,
      voltage: 230.5,
      current: 0.196
    },
    {
      deviceId: 'kitchen_002',
      deviceName: 'Kitchen Microwave',
      ipAddress: '192.168.1.102',
      macAddress: 'AA:BB:CC:DD:EE:02',
      firmwareVersion: '13.2.0',
      status: DeviceStatus.ONLINE,
      powerState: false,
      energyConsumption: 0,
      totalEnergy: 89.3,
      wifiSignal: -52,
      uptime: 172800,
      voltage: 230.2,
      current: 0
    },
    {
      deviceId: 'living_001',
      deviceName: 'Living Room Lamp',
      ipAddress: '192.168.1.103',
      macAddress: 'AA:BB:CC:DD:EE:03',
      firmwareVersion: '13.1.0',
      status: DeviceStatus.OFFLINE,
      powerState: false,
      energyConsumption: 0,
      totalEnergy: 45.7,
      wifiSignal: -75,
      uptime: 0,
      voltage: null,
      current: null
    }
  ]

  for (const deviceData of devices) {
    const device = await prisma.device.create({
      data: deviceData
    })

    console.log(`✅ Created device: ${device.deviceName} (${device.deviceId})`)

    // Add some sample energy readings for online devices
    if (device.status === DeviceStatus.ONLINE) {
      const readings = []
      for (let i = 0; i < 24; i++) {
        const timestamp = new Date()
        timestamp.setHours(timestamp.getHours() - i)
        
        readings.push({
          deviceId: device.id,
          power: device.powerState ? Math.random() * 50 + 20 : 0,
          energy: device.totalEnergy - (i * 0.5),
          voltage: device.voltage,
          current: device.current,
          timestamp
        })
      }

      await prisma.energyReading.createMany({
        data: readings
      })

      console.log(`📊 Added ${readings.length} energy readings for ${device.deviceName}`)
    }

    // Add some sample logs
    const logs = [
      {
        deviceId: device.id,
        level: 'INFO' as const,
        message: 'Device started',
        timestamp: new Date(Date.now() - 86400000) // 1 day ago
      },
      {
        deviceId: device.id,
        level: 'INFO' as const,
        message: 'WiFi connected',
        timestamp: new Date(Date.now() - 86300000)
      }
    ]

    if (device.status === DeviceStatus.OFFLINE) {
      logs.push({
        deviceId: device.id,
        level: 'INFO' as const,
        message: 'Device went offline',
        timestamp: new Date(Date.now() - 3600000) // 1 hour ago
      })
    }

    await prisma.deviceLog.createMany({
      data: logs
    })

    console.log(`📝 Added ${logs.length} log entries for ${device.deviceName}`)
  }

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 