import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema
const updateCategorySchema = z.object({
  categoryId: z.string().optional(),
  description: z.string().optional()
})

// PUT /api/devices/[deviceId]/category - Update device category
export async function PUT(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  try {
    const body = await request.json()
    const { deviceId } = params
    
    // Validate input
    const validatedData = updateCategorySchema.parse(body)
    
    // Check if device exists
    const existingDevice = await prisma.device.findUnique({
      where: { deviceId },
      include: { category: true }
    })
    
    if (!existingDevice) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }
    
    // Check if category exists (if categoryId is provided)
    if (validatedData.categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: validatedData.categoryId }
      })
      
      if (!categoryExists) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
    }
    
    // Update device category
    const updatedDevice = await prisma.device.update({
      where: { deviceId },
      data: {
        categoryId: validatedData.categoryId || null,
        description: validatedData.description
      },
      include: {
        category: true
      }
    })
    
    // Transform response to match frontend interface
    const transformedDevice = {
      device_id: updatedDevice.deviceId,
      device_name: updatedDevice.deviceName,
      ip_address: updatedDevice.ipAddress,
      mac_address: updatedDevice.macAddress,
      firmware_version: updatedDevice.firmwareVersion,
      status: updatedDevice.status.toLowerCase(),
      power_state: updatedDevice.powerState,
      energy_consumption: updatedDevice.energyConsumption,
      total_energy: updatedDevice.totalEnergy,
      wifi_signal: updatedDevice.wifiSignal,
      uptime: updatedDevice.uptime,
      voltage: updatedDevice.voltage,
      current: updatedDevice.current,
      last_seen: updatedDevice.lastSeen.toISOString(),
      category: updatedDevice.category ? {
        id: updatedDevice.category.id,
        name: updatedDevice.category.name,
        color: updatedDevice.category.color,
        icon: updatedDevice.category.icon,
        description: updatedDevice.category.description,
        isDefault: updatedDevice.category.isDefault,
        createdAt: updatedDevice.category.createdAt.toISOString(),
        updatedAt: updatedDevice.category.updatedAt.toISOString()
      } : undefined,
      description: updatedDevice.description
    }
    
    return NextResponse.json(transformedDevice)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating device category:', error)
    return NextResponse.json(
      { error: 'Failed to update device category' },
      { status: 500 }
    )
  }
} 