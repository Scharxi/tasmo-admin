import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { isCritical } = await request.json()
    const { deviceId } = await params

    if (typeof isCritical !== 'boolean') {
      return NextResponse.json(
        { error: 'isCritical must be a boolean' },
        { status: 400 }
      )
    }

    // Update device critical status
    const device = await prisma.device.update({
      where: { deviceId },
      data: { isCritical },
      include: {
        category: true,
      },
    })

    // Transform to match API interface
    const deviceResponse = {
      device_id: device.deviceId,
      device_name: device.deviceName,
      ip_address: device.ipAddress,
      mac_address: device.macAddress,
      firmware_version: device.firmwareVersion,
      status: device.status.toLowerCase() as 'online' | 'offline' | 'error',
      power_state: device.powerState,
      energy_consumption: device.energyConsumption,
      total_energy: device.totalEnergy,
      wifi_signal: device.wifiSignal,
      uptime: device.uptime,
      voltage: device.voltage,
      current: device.current,
      last_seen: device.lastSeen.toISOString(),
      is_critical: device.isCritical,
      category: device.category,
      description: device.description,
    }

    return NextResponse.json(deviceResponse)
  } catch (error: unknown) {
    console.error('Error updating device critical status:', error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
