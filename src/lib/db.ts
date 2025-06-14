import { prisma } from './prisma'
import { Device, DeviceStatus } from '@prisma/client'

export interface CreateDeviceData {
  deviceId: string
  deviceName: string
  ipAddress: string
  macAddress?: string
  firmwareVersion: string
  status?: DeviceStatus
}

export interface UpdateDeviceData {
  deviceName?: string
  ipAddress?: string
  firmwareVersion?: string
  status?: DeviceStatus
  powerState?: boolean
  energyConsumption?: number
  totalEnergy?: number
  wifiSignal?: number
  uptime?: number
  voltage?: number
  current?: number
  enableDataLogging?: boolean
  dataRetentionDays?: number
  minLogInterval?: number
  lastSeen?: Date
}

export interface DeviceLoggingConfig {
  enableDataLogging: boolean
  dataRetentionDays: number
  minLogInterval: number
}

export class DeviceService {
  // Get all devices
  static async getAllDevices(): Promise<Device[]> {
    return await prisma.device.findMany({
      orderBy: { createdAt: 'desc' }
    })
  }

  // Get device by ID
  static async getDeviceById(id: string): Promise<Device | null> {
    return await prisma.device.findUnique({
      where: { id }
    })
  }

  // Get device by device ID (Tasmota device ID)
  static async getDeviceByDeviceId(deviceId: string): Promise<Device | null> {
    return await prisma.device.findUnique({
      where: { deviceId }
    })
  }

  // Create new device
  static async createDevice(data: CreateDeviceData): Promise<Device> {
    return await prisma.device.create({
      data: {
        deviceId: data.deviceId,
        deviceName: data.deviceName,
        ipAddress: data.ipAddress,
        macAddress: data.macAddress,
        firmwareVersion: data.firmwareVersion,
        status: data.status || DeviceStatus.OFFLINE,
        lastSeen: new Date()
      }
    })
  }

  // Update device
  static async updateDevice(id: string, data: UpdateDeviceData): Promise<Device> {
    return await prisma.device.update({
      where: { id },
      data
    })
  }

  // Update device by device ID
  static async updateDeviceByDeviceId(deviceId: string, data: UpdateDeviceData): Promise<Device> {
    return await prisma.device.update({
      where: { deviceId },
      data
    })
  }

  // Delete device
  static async deleteDevice(id: string): Promise<Device> {
    return await prisma.device.delete({
      where: { id }
    })
  }

  // Toggle device power
  static async toggleDevicePower(deviceId: string): Promise<Device> {
    const device = await this.getDeviceByDeviceId(deviceId)
    if (!device) {
      throw new Error('Device not found')
    }

    return await this.updateDeviceByDeviceId(deviceId, {
      powerState: !device.powerState
    })
  }

  // Update device status (online/offline)
  static async updateDeviceStatus(deviceId: string, status: DeviceStatus): Promise<Device> {
    return await this.updateDeviceByDeviceId(deviceId, {
      status
    })
  }

  // Add energy reading with intelligent storage and user configuration
  static async addEnergyReading(deviceId: string, data: {
    power: number
    energy: number
    voltage?: number
    current?: number
  }) {
    const device = await this.getDeviceByDeviceId(deviceId)
    if (!device) {
      throw new Error('Device not found')
    }

    // Check if data logging is enabled for this device
    if (!device.enableDataLogging) {
      console.log(`Data logging disabled for device ${deviceId}, skipping historical storage`)
      
      // Still update current device state
      await this.updateDevice(device.id, {
        energyConsumption: data.power,
        totalEnergy: data.energy,
        voltage: data.voltage,
        current: data.current,
        lastSeen: new Date()
      })
      
      return null
    }

    // Get the last reading to avoid duplicate storage
    const lastReading = await prisma.energyReading.findFirst({
      where: { deviceId: device.id },
      orderBy: { timestamp: 'desc' }
    })

    // Use device-specific interval setting
    const shouldStore = !lastReading || 
      this.shouldStoreReading(lastReading, data) ||
      this.isTimeThresholdPassed(lastReading.timestamp, device.minLogInterval)

    let reading = null
    if (shouldStore) {
      // Create energy reading
      reading = await prisma.energyReading.create({
        data: {
          deviceId: device.id,
          power: data.power,
          energy: data.energy,
          voltage: data.voltage,
          current: data.current
        }
      })
    }

    // Always update device with latest values
    await this.updateDevice(device.id, {
      energyConsumption: data.power,
      totalEnergy: data.energy,
      voltage: data.voltage,
      current: data.current,
      lastSeen: new Date()
    })

    return reading
  }

  // Helper: Determine if reading should be stored (avoid noise)
  private static shouldStoreReading(lastReading: any, newData: any): boolean {
    const powerChange = Math.abs(lastReading.power - newData.power)
    const voltageChange = lastReading.voltage && newData.voltage ? 
      Math.abs(lastReading.voltage - newData.voltage) : 0
    
    // Store if power changes by >5W or voltage by >2V
    return powerChange > 5 || voltageChange > 2
  }

  // Helper: Check if minimum time has passed (uses device-specific interval)
  private static isTimeThresholdPassed(lastTimestamp: Date, minInterval = 60): boolean {
    const minIntervalMs = minInterval * 1000
    return Date.now() - lastTimestamp.getTime() > minIntervalMs
  }

  // Get energy readings with optional aggregation
  static async getEnergyReadings(
    deviceId: string, 
    options: {
      limit?: number
      startDate?: Date
      endDate?: Date
      interval?: 'raw' | 'hourly' | 'daily'
    } = {}
  ) {
    const device = await this.getDeviceByDeviceId(deviceId)
    if (!device) {
      throw new Error('Device not found')
    }

    const { limit = 100, startDate, endDate, interval = 'raw' } = options

    if (interval === 'raw') {
      return await prisma.energyReading.findMany({
        where: { 
          deviceId: device.id,
          ...(startDate && { timestamp: { gte: startDate } }),
          ...(endDate && { timestamp: { lte: endDate } })
        },
        orderBy: { timestamp: 'desc' },
        take: limit
      })
    }

    // For aggregated data, use raw SQL for better performance
    const intervalSql = interval === 'hourly' ? 
      "date_trunc('hour', timestamp)" : 
      "date_trunc('day', timestamp)"

    return await prisma.$queryRaw`
      SELECT 
        ${intervalSql} as period,
        AVG(power) as avg_power,
        MIN(power) as min_power,
        MAX(power) as max_power,
        AVG(voltage) as avg_voltage,
        AVG(current) as avg_current,
        COUNT(*) as reading_count
      FROM energy_readings 
      WHERE device_id = ${device.id}
        ${startDate ? `AND timestamp >= ${startDate}` : ''}
        ${endDate ? `AND timestamp <= ${endDate}` : ''}
      GROUP BY period
      ORDER BY period DESC
      LIMIT ${limit}
    `
  }

  // Cleanup old readings (device-specific retention)
  static async cleanupOldReadings(deviceId?: string) {
    if (deviceId) {
      // Cleanup for specific device using its retention settings
      const device = await this.getDeviceByDeviceId(deviceId)
      if (!device) {
        throw new Error('Device not found')
      }

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - device.dataRetentionDays)

      const result = await prisma.energyReading.deleteMany({
        where: {
          deviceId: device.id,
          timestamp: { lt: cutoffDate }
        }
      })

      console.log(`Cleaned up ${result.count} old energy readings for device ${deviceId}`)
      return result.count
    } else {
      // Global cleanup for all devices using their individual retention settings
      const devices = await this.getAllDevices()
      let totalDeleted = 0

      for (const device of devices) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - device.dataRetentionDays)

        const result = await prisma.energyReading.deleteMany({
          where: {
            deviceId: device.id,
            timestamp: { lt: cutoffDate }
          }
        })

        totalDeleted += result.count
      }

      console.log(`Global cleanup: removed ${totalDeleted} old energy readings`)
      return totalDeleted
    }
  }

  // Add device log
  static async addDeviceLog(deviceId: string, data: {
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
    message: string
    data?: any
  }) {
    const device = await this.getDeviceByDeviceId(deviceId)
    if (!device) {
      throw new Error('Device not found')
    }

    return await prisma.deviceLog.create({
      data: {
        deviceId: device.id,
        level: data.level,
        message: data.message,
        data: data.data
      }
    })
  }

  // Update device logging configuration
  static async updateDeviceLoggingConfig(deviceId: string, config: Partial<DeviceLoggingConfig>): Promise<Device> {
    const device = await this.getDeviceByDeviceId(deviceId)
    if (!device) {
      throw new Error('Device not found')
    }

    // Validate configuration
    if (config.dataRetentionDays !== undefined && (config.dataRetentionDays < 1 || config.dataRetentionDays > 365)) {
      throw new Error('Data retention days must be between 1 and 365')
    }

    if (config.minLogInterval !== undefined && (config.minLogInterval < 10 || config.minLogInterval > 3600)) {
      throw new Error('Minimum log interval must be between 10 seconds and 1 hour')
    }

    return await this.updateDeviceByDeviceId(deviceId, config)
  }

  // Get device logging configuration
  static async getDeviceLoggingConfig(deviceId: string): Promise<DeviceLoggingConfig | null> {
    const device = await this.getDeviceByDeviceId(deviceId)
    if (!device) {
      return null
    }

    return {
      enableDataLogging: device.enableDataLogging,
      dataRetentionDays: device.dataRetentionDays,
      minLogInterval: device.minLogInterval
    }
  }
} 