import { NextRequest, NextResponse } from "next/server"
import { DeviceService } from "@/lib/db"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ deviceId: string }> }
): Promise<NextResponse> {
  try {
    const { deviceId } = await context.params

    // Get current logging configuration
    const config = await DeviceService.getDeviceLoggingConfig(deviceId)
    if (!config) {
      return NextResponse.json(
        { error: "Device logging configuration not found" },
        { status: 404 }
      )
    }

    // Get actual stored data count
    const actualDataCount = await getStoredDataCount(deviceId)
    
    // Calculate actual storage used
    const actualStorageBytes = calculateActualStorage(actualDataCount)
    
    // Calculate estimated storage based on current settings
    const estimatedStorageBytes = calculateEstimatedStorage(
      config.dataRetentionDays,
      config.minLogInterval
    )

    // Get storage breakdown
    const storageBreakdown = await getStorageBreakdown(deviceId)

    return NextResponse.json({
      deviceId,
      actualStorage: {
        bytes: actualStorageBytes,
        formatted: formatBytes(actualStorageBytes),
        recordCount: actualDataCount
      },
      estimatedStorage: {
        bytes: estimatedStorageBytes,
        formatted: formatBytes(estimatedStorageBytes)
      },
      breakdown: storageBreakdown,
      efficiency: calculateStorageEfficiency(actualStorageBytes, estimatedStorageBytes)
    })
  } catch (error) {
    console.error("Storage calculation error:", error)
    return NextResponse.json(
      { error: "Failed to calculate storage" },
      { status: 500 }
    )
  }
}

async function getStoredDataCount(deviceId: string): Promise<number> {
  const device = await DeviceService.getDeviceByDeviceId(deviceId)
  if (!device) return 0

  const count = await prisma.energyReading.count({
    where: { deviceId: device.id }
  })
  
  return count
}

async function getStorageBreakdown(deviceId: string) {
  const device = await DeviceService.getDeviceByDeviceId(deviceId)
  if (!device) return null

  const now = new Date()
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    last24HoursCount,
    last7DaysCount,
    last30DaysCount,
    totalCount,
    oldestRecord,
    newestRecord
  ] = await Promise.all([
    prisma.energyReading.count({
      where: { deviceId: device.id, timestamp: { gte: last24Hours } }
    }),
    prisma.energyReading.count({
      where: { deviceId: device.id, timestamp: { gte: last7Days } }
    }),
    prisma.energyReading.count({
      where: { deviceId: device.id, timestamp: { gte: last30Days } }
    }),
    prisma.energyReading.count({
      where: { deviceId: device.id }
    }),
    prisma.energyReading.findFirst({
      where: { deviceId: device.id },
      orderBy: { timestamp: 'asc' }
    }),
    prisma.energyReading.findFirst({
      where: { deviceId: device.id },
      orderBy: { timestamp: 'desc' }
    })
  ])

  return {
    last24Hours: last24HoursCount,
    last7Days: last7DaysCount,
    last30Days: last30DaysCount,
    total: totalCount,
    dateRange: {
      oldest: oldestRecord?.timestamp,
      newest: newestRecord?.timestamp
    }
  }
}

function calculateActualStorage(recordCount: number): number {
  // Each record contains:
  // - timestamp (8 bytes)
  // - device_id varchar (avg 20 bytes)
  // - sensor_data JSON (avg 100 bytes for typical sensor readings)
  // - metadata (avg 50 bytes)
  // Total: ~178 bytes per record + database overhead (~20%)
  const bytesPerRecord = 178 * 1.2
  return Math.round(recordCount * bytesPerRecord)
}

function calculateEstimatedStorage(retentionDays: number, intervalSeconds: number): number {
  const readingsPerDay = (24 * 60 * 60) / intervalSeconds
  const totalReadings = readingsPerDay * retentionDays
  const bytesPerRecord = 178 * 1.2 // Same calculation as actual
  return Math.round(totalReadings * bytesPerRecord)
}

function calculateStorageEfficiency(actual: number, estimated: number): number {
  if (estimated === 0) return 1
  return Math.min(actual / estimated, 1)
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, i)
  
  return `${size.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`
} 