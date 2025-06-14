import { NextRequest, NextResponse } from "next/server"
import { DeviceService } from "@/lib/db"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get all devices
    const devices = await DeviceService.getAllDevices()
    
    // Calculate storage for each device
    const deviceStoragePromises = devices.map(async (device) => {
      const config = await DeviceService.getDeviceLoggingConfig(device.deviceId)
      if (!config || !config.enableDataLogging) {
        return {
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          actualStorage: { bytes: 0, formatted: '0 B', recordCount: 0 },
          estimatedStorage: { bytes: 0, formatted: '0 B' },
          enabled: false
        }
      }

      const recordCount = await prisma.energyReading.count({
        where: { deviceId: device.id }
      })

      const actualBytes = calculateActualStorage(recordCount)
      const estimatedBytes = calculateEstimatedStorage(
        config.dataRetentionDays,
        config.minLogInterval
      )

      return {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        actualStorage: {
          bytes: actualBytes,
          formatted: formatBytes(actualBytes),
          recordCount
        },
        estimatedStorage: {
          bytes: estimatedBytes,
          formatted: formatBytes(estimatedBytes)
        },
        enabled: true,
        config
      }
    })

    const deviceStorages = await Promise.all(deviceStoragePromises)

    // Calculate totals
    const totalActualBytes = deviceStorages.reduce((sum, device) => sum + device.actualStorage.bytes, 0)
    const totalEstimatedBytes = deviceStorages.reduce((sum, device) => sum + device.estimatedStorage.bytes, 0)
    const totalRecords = deviceStorages.reduce((sum, device) => sum + device.actualStorage.recordCount, 0)

    // Get summary statistics
    const enabledDevices = deviceStorages.filter(d => d.enabled)
    const avgRetention = enabledDevices.length > 0 
      ? Math.round(enabledDevices.reduce((sum, d) => sum + (d.config?.dataRetentionDays || 0), 0) / enabledDevices.length)
      : 0
    const avgInterval = enabledDevices.length > 0
      ? Math.round(enabledDevices.reduce((sum, d) => sum + (d.config?.minLogInterval || 0), 0) / enabledDevices.length)
      : 0

    return NextResponse.json({
      summary: {
        totalActualStorage: {
          bytes: totalActualBytes,
          formatted: formatBytes(totalActualBytes)
        },
        totalEstimatedStorage: {
          bytes: totalEstimatedBytes,
          formatted: formatBytes(totalEstimatedBytes)
        },
        totalRecords,
        activeDevices: enabledDevices.length,
        totalDevices: devices.length,
        averageRetentionDays: avgRetention,
        averageIntervalSeconds: avgInterval,
        storageEfficiency: totalEstimatedBytes > 0 ? (totalActualBytes / totalEstimatedBytes) : 1
      },
      devices: deviceStorages
    })
  } catch (error) {
    console.error("Global storage calculation error:", error)
    return NextResponse.json(
      { error: "Failed to calculate storage" },
      { status: 500 }
    )
  }
}

function calculateActualStorage(recordCount: number): number {
  // Each record contains:
  // - id (8 bytes - bigint)
  // - deviceId (8 bytes - bigint)
  // - timestamp (8 bytes - timestamp)
  // - power (8 bytes - double precision)
  // - energy (8 bytes - double precision)
  // - voltage (8 bytes - double precision, nullable)
  // - current (8 bytes - double precision, nullable)
  // - createdAt (8 bytes - timestamp)
  // Total: ~64 bytes per record + PostgreSQL overhead (~30%)
  const bytesPerRecord = 64 * 1.3
  return Math.round(recordCount * bytesPerRecord)
}

function calculateEstimatedStorage(retentionDays: number, intervalSeconds: number): number {
  const readingsPerDay = (24 * 60 * 60) / intervalSeconds
  const totalReadings = readingsPerDay * retentionDays
  const bytesPerRecord = 64 * 1.3 // Same calculation as actual
  return Math.round(totalReadings * bytesPerRecord)
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, i)
  
  return `${size.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`
} 