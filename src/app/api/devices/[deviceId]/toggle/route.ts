import { NextRequest, NextResponse } from 'next/server'
import { DeviceService } from '@/lib/db'
import { toggleDevicePower, getDeviceStatus } from '@/lib/tasmota-config'

// POST /api/devices/[deviceId]/toggle - Toggle device power
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params
    
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      )
    }
    
    // Get device from database first
    const device = await DeviceService.getDeviceByDeviceId(deviceId)
    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }
    
    // Try to toggle power using the enhanced Tasmota command
    const toggleResult = await toggleDevicePower(device.ipAddress, 10000)
    
    if (!toggleResult.success) {
      // If direct communication fails, update device status to offline
      await DeviceService.updateDeviceByDeviceId(deviceId, {
        status: 'OFFLINE',
        lastSeen: new Date()
      })
      
      return NextResponse.json(
        { 
          error: `Device is not responding: ${toggleResult.error || 'Unknown error'}. It may be offline.`,
          offline: true
        },
        { status: 503 }
      )
    }
    
    // Get comprehensive device status after toggle
    const deviceStatus = await getDeviceStatus(device.ipAddress, 10000)
    
    let updatedDevice
    if (deviceStatus) {
      // Update database with comprehensive device status
      updatedDevice = await DeviceService.updateDeviceByDeviceId(deviceId, {
        powerState: toggleResult.power_state ?? deviceStatus.power_state,
        energyConsumption: deviceStatus.energy_consumption || 0,
        totalEnergy: deviceStatus.total_energy || device.totalEnergy,
        wifiSignal: deviceStatus.wifi_signal || device.wifiSignal,
        uptime: deviceStatus.uptime || 0,
        voltage: deviceStatus.voltage || device.voltage || 230,
        current: deviceStatus.current || device.current || 0,
        status: 'ONLINE',
        lastSeen: new Date()
      })
    } else {
      // Fallback: use toggle result for power state only
      console.warn(`Could not get comprehensive status for ${deviceId}, using toggle result only`)
      updatedDevice = await DeviceService.updateDeviceByDeviceId(deviceId, {
        powerState: toggleResult.power_state ?? false,
        status: 'ONLINE',
        lastSeen: new Date()
      })
    }
    
    // Transform response with safe data handling
    const transformedDevice = {
      device_id: updatedDevice.deviceId,
      device_name: updatedDevice.deviceName,
      ip_address: updatedDevice.ipAddress,
      mac_address: updatedDevice.macAddress,
      firmware_version: updatedDevice.firmwareVersion,
      status: updatedDevice.status.toLowerCase(),
      power_state: updatedDevice.powerState,
      energy_consumption: updatedDevice.energyConsumption || 0,
      total_energy: updatedDevice.totalEnergy || 0,
      wifi_signal: updatedDevice.wifiSignal || -50,
      uptime: updatedDevice.uptime || 0,
      voltage: updatedDevice.voltage || 230,
      current: updatedDevice.current || 0,
      last_seen: updatedDevice.lastSeen.toISOString()
    }
    
    return NextResponse.json(transformedDevice)
  } catch (error) {
    const { deviceId } = await params
    console.error(`Error toggling device power for ${deviceId}:`, error)
    
    if (error instanceof Error && error.message === 'Device not found') {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to toggle device power', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 