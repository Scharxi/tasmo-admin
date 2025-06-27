import { NextRequest, NextResponse } from 'next/server'
import { DeviceService } from '@/lib/db'
import { prisma } from '@/lib/prisma'

// PUT /api/devices/[deviceId] - Update device settings
export async function PUT(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  try {
    const { deviceId } = await params
    const body = await request.json()
    
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      )
    }

    // Check if device exists
    const device = await DeviceService.getDeviceByDeviceId(deviceId)
    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    // Update device settings
    const updateData: any = {}
    if (body.deviceName !== undefined) {
      updateData.deviceName = body.deviceName
    }
    if (body.description !== undefined) {
      updateData.description = body.description
    }

    const updatedDevice = await DeviceService.updateDevice(device.id, updateData)

    // Include category information in response by fetching the complete device
    const deviceWithCategory = await prisma.device.findUnique({
      where: { id: updatedDevice.id },
      include: {
        category: true
      }
    })

    if (!deviceWithCategory) {
      return NextResponse.json(
        { error: 'Device not found after update' },
        { status: 404 }
      )
    }

    // Transform to match API format
    const transformedDevice = {
      device_id: deviceWithCategory.deviceId,
      device_name: deviceWithCategory.deviceName,
      ip_address: deviceWithCategory.ipAddress,
      mac_address: deviceWithCategory.macAddress,
      firmware_version: deviceWithCategory.firmwareVersion,
      status: deviceWithCategory.status.toLowerCase(),
      power_state: deviceWithCategory.powerState,
      energy_consumption: deviceWithCategory.energyConsumption,
      total_energy: deviceWithCategory.totalEnergy,
      wifi_signal: deviceWithCategory.wifiSignal,
      uptime: deviceWithCategory.uptime,
      voltage: deviceWithCategory.voltage,
      current: deviceWithCategory.current,
      last_seen: deviceWithCategory.lastSeen.toISOString(),
      is_critical: deviceWithCategory.isCritical,
      category: deviceWithCategory.category ? {
        id: deviceWithCategory.category.id,
        name: deviceWithCategory.category.name,
        color: deviceWithCategory.category.color,
        icon: deviceWithCategory.category.icon,
        description: deviceWithCategory.category.description,
        isDefault: deviceWithCategory.category.isDefault,
        createdAt: deviceWithCategory.category.createdAt.toISOString(),
        updatedAt: deviceWithCategory.category.updatedAt.toISOString()
      } : undefined,
      description: deviceWithCategory.description
    }

    return NextResponse.json(transformedDevice)
  } catch (error) {
    console.error('Error updating device:', error)
    return NextResponse.json(
      { error: 'Failed to update device' },
      { status: 500 }
    )
  }
}

// DELETE /api/devices/[deviceId] - Delete device
export async function DELETE(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  try {
    const { deviceId } = await params
    
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      )
    }
    
    // Check if device exists
    const device = await DeviceService.getDeviceByDeviceId(deviceId)
    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }
    
    // Delete device from database
    await DeviceService.deleteDevice(device.id)
    
    return NextResponse.json({ message: 'Device deleted successfully' })
  } catch (error) {
    console.error('Error deleting device:', error)
    return NextResponse.json(
      { error: 'Failed to delete device' },
      { status: 500 }
    )
  }
} 