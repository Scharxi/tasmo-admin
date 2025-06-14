import { NextRequest, NextResponse } from 'next/server'
import { DeviceService } from '@/lib/db'
import { DeviceStatus } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

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

    // Transform the data to match the expected API format
    const transformedDevices = devices.map(device => ({
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
    }))

    return NextResponse.json(transformedDevices)
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