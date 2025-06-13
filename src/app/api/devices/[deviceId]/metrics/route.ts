import { NextRequest, NextResponse } from 'next/server'
import { DeviceService } from '@/lib/db'

// GET /api/devices/[deviceId]/metrics - Get device metrics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params
    
    // Get device from database
    const device = await DeviceService.getDeviceByDeviceId(deviceId)
    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    // Calculate additional metrics
    const metrics = {
      power: device.energyConsumption,
      apparent_power: device.energyConsumption * 1.1, // Scheinleistung
      reactive_power: device.energyConsumption * 0.2, // Blindleistung
      factor: 0.9, // Leistungsfaktor (cos φ)
      voltage: device.voltage || 230,
      current: device.current || (device.energyConsumption / (device.voltage || 230)),
      total: device.totalEnergy,
      today: device.totalEnergy * 0.1, // Geschätzt: 10% der Gesamtenergie heute
      yesterday: device.totalEnergy * 0.08, // Geschätzt: 8% der Gesamtenergie gestern
      lastUpdate: new Date().toISOString()
    }

    return NextResponse.json(metrics)
  } catch (error) {
    const { deviceId } = await params
    console.error(`Error fetching metrics for device ${deviceId}:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch device metrics' },
      { status: 500 }
    )
  }
} 