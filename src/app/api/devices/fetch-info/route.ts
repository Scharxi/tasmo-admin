import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getDeviceStatus, transformToApiFormat, getDevice } from '@/lib/tasmota-service'

const fetchInfoSchema = z.object({
  ipAddress: z.string().ip('Invalid IP address'),
})

// POST /api/devices/fetch-info - Fetch device info from Tasmota device
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ipAddress } = fetchInfoSchema.parse(body)
    
    // Get device status using the SDK
    const deviceStatus = await getDeviceStatus(ipAddress, 10000)
    
    if (!deviceStatus) {
      throw new Error(`Failed to connect to device at ${ipAddress}`)
    }
    
    // Try to get additional status info
    try {
      const device = getDevice(ipAddress)
      const deviceInfo = await device.getDeviceInfo({ timeout: 5000, forceRefresh: true })
      console.log('Additional Tasmota device info:', deviceInfo)
    } catch (infoError) {
      console.warn(`Could not fetch additional Tasmota status from ${ipAddress}:`, infoError)
      // Continue with basic device data
    }
    
    // Transform and return device info in API format
    const deviceInfo = {
      device_id: deviceStatus.deviceId,
      device_name: deviceStatus.deviceName,
      ip_address: ipAddress,
      mac_address: deviceStatus.macAddress,
      firmware_version: deviceStatus.firmwareVersion,
      status: deviceStatus.status,
      power_state: deviceStatus.powerState,
      energy_consumption: deviceStatus.energyConsumption,
      total_energy: deviceStatus.totalEnergy,
      wifi_signal: deviceStatus.wifiSignal,
      uptime: deviceStatus.uptime,
      voltage: deviceStatus.voltage,
      current: deviceStatus.current,
      last_seen: deviceStatus.lastSeen,
    }
    
    return NextResponse.json(deviceInfo)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid IP address' },
        { status: 400 }
      )
    }
    
    console.error(`Failed to fetch device info:`, error)
    return NextResponse.json(
      { error: `Could not connect to Tasmota device at the specified IP address. Please check the IP address and ensure the device is online.` },
      { status: 500 }
    )
  }
}
