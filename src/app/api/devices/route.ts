import { NextRequest, NextResponse } from 'next/server'
import { DeviceService } from '@/lib/db'
import { DeviceStatus } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getDeviceEnergyData, getDevicePowerState } from '@/lib/tasmota-service'

// Validation schemas
const createDeviceSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
  deviceName: z.string().min(1, 'Device name is required'),
  ipAddress: z.string().ip('Invalid IP address'),
  macAddress: z.string().optional(),
  firmwareVersion: z.string().min(1, 'Firmware version is required')
})

// Tasmota simulator configuration
const TASMOTA_AUTH = {
  username: 'admin',
  password: 'test1234!'
}

// Helper function to get device URL
function getDeviceUrl(ipAddress: string): string {
  return `http://${ipAddress}`
}

// Function to check if a device is online and get its info
async function checkDeviceOnline(ipAddress: string): Promise<any | null> {
  try {
    const deviceUrl = getDeviceUrl(ipAddress)
    
    const response = await fetch(`${deviceUrl}/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(3000) // Short timeout for discovery
    })
    
    if (!response.ok) {
      return null
    }
    
    return await response.json()
  } catch (error) {
    return null
  }
}

// GET /api/devices - Get all devices (with optional category filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    // Build the where clause based on category filter
    const whereClause = categoryId ? { categoryId } : {}

    const devices = await prisma.device.findMany({
      where: whereClause,
      include: {
        category: true, // Include the category relationship
      },
      orderBy: {
        deviceName: 'asc'
      }
    })

    // Fetch live data from online devices in parallel (with timeout)
    const devicesWithLiveData = await Promise.all(
      devices.map(async (device) => {
        let liveEnergyData = null
        let livePowerState = device.powerState
        let isOnline = device.status === DeviceStatus.ONLINE

        // Try to get live data from the device (short timeout to not slow down the response)
        try {
          const [energyData, powerState] = await Promise.all([
            getDeviceEnergyData(device.ipAddress, 2000).catch(() => null),
            getDevicePowerState(device.ipAddress, 1, 2000).catch(() => null),
          ])
          
          if (energyData) {
            liveEnergyData = energyData
            isOnline = true
            
            // Update database in background (don't await)
            DeviceService.updateDeviceByDeviceId(device.deviceId, {
              energyConsumption: energyData.power || 0,
              totalEnergy: energyData.total || device.totalEnergy,
              voltage: energyData.voltage || device.voltage || 230,
              current: energyData.current || device.current || 0,
              status: 'ONLINE',
              lastSeen: new Date(),
            }).catch((err) => console.warn(`Failed to update device ${device.deviceId}:`, err))
          }
          
          if (powerState !== null) {
            livePowerState = powerState
            isOnline = true
          }
        } catch {
          // Device might be offline, use cached data
        }

        return {
          device_id: device.deviceId,
          device_name: device.deviceName,
          ip_address: device.ipAddress,
          mac_address: device.macAddress,
          firmware_version: device.firmwareVersion,
          status: isOnline ? 'online' : device.status.toLowerCase(),
          power_state: livePowerState,
          energy_consumption: liveEnergyData?.power ?? device.energyConsumption,
          total_energy: liveEnergyData?.total ?? device.totalEnergy,
          wifi_signal: device.wifiSignal,
          uptime: device.uptime,
          voltage: liveEnergyData?.voltage ?? device.voltage,
          current: liveEnergyData?.current ?? device.current,
          last_seen: isOnline ? new Date().toISOString() : device.lastSeen.toISOString(),
          is_critical: device.isCritical,
          category: device.category ? {
            id: device.category.id,
            name: device.category.name,
            color: device.category.color,
            icon: device.category.icon,
            description: device.category.description,
            isDefault: device.category.isDefault,
            createdAt: device.category.createdAt.toISOString(),
            updatedAt: device.category.updatedAt.toISOString()
          } : undefined,
          description: device.description
        }
      })
    )

    return NextResponse.json(devicesWithLiveData)
  } catch (error) {
    console.error('Error fetching devices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch devices' },
      { status: 500 }
    )
  }
}

// POST /api/devices - Create new device
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = createDeviceSchema.parse(body)
    
    // Check if device already exists
    const existingDevice = await prisma.device.findUnique({
      where: { deviceId: validatedData.deviceId }
    })
    
    if (existingDevice) {
      return NextResponse.json(
        { error: 'Device with this ID already exists' },
        { status: 409 }
      )
    }
    
    // Create device
    const device = await prisma.device.create({
      data: {
        ...validatedData,
        status: DeviceStatus.ONLINE // Device is online since we successfully fetched its info
      },
      include: {
        category: true
      }
    })
    
    // Transform response
    const transformedDevice = {
      device_id: device.deviceId,
      device_name: device.deviceName,
      ip_address: device.ipAddress,
      mac_address: device.macAddress,
      firmware_version: device.firmwareVersion,
      status: device.status.toLowerCase(),
      power_state: device.powerState,
      energy_consumption: device.energyConsumption,
      total_energy: device.totalEnergy,
      wifi_signal: device.wifiSignal,
      uptime: device.uptime,
      voltage: device.voltage,
      current: device.current,
      last_seen: device.lastSeen.toISOString(),
      is_critical: device.isCritical,
      category: device.category ? {
        id: device.category.id,
        name: device.category.name,
        color: device.category.color,
        icon: device.category.icon,
        description: device.category.description,
        isDefault: device.category.isDefault,
        createdAt: device.category.createdAt.toISOString(),
        updatedAt: device.category.updatedAt.toISOString()
      } : undefined,
      description: device.description
    }
    
    return NextResponse.json(transformedDevice, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error creating device:', error)
    return NextResponse.json(
      { error: 'Failed to create device' },
      { status: 500 }
    )
  }
} 