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
  lastSeen?: Date
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

  // Add energy reading
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

    // Create energy reading
    const reading = await prisma.energyReading.create({
      data: {
        deviceId: device.id,
        power: data.power,
        energy: data.energy,
        voltage: data.voltage,
        current: data.current
      }
    })

    // Update device with latest values
    await this.updateDevice(device.id, {
      energyConsumption: data.power,
      totalEnergy: data.energy,
      voltage: data.voltage,
      current: data.current
    })

    return reading
  }

  // Get energy readings for device
  static async getEnergyReadings(deviceId: string, limit = 100) {
    const device = await this.getDeviceByDeviceId(deviceId)
    if (!device) {
      throw new Error('Device not found')
    }

    return await prisma.energyReading.findMany({
      where: { deviceId: device.id },
      orderBy: { timestamp: 'desc' },
      take: limit
    })
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
} 