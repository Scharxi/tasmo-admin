import { NextRequest, NextResponse } from 'next/server'
import { DeviceService } from '@/lib/db'
import { sendTasmotaCommand, getDeviceStatus } from '@/lib/tasmota-config'

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
    
    // Try to communicate with the actual Tasmota device
    const toggleResult = await sendTasmotaCommand(device.ipAddress, 'Power TOGGLE')
    
    if (!toggleResult || (!toggleResult.POWER || (toggleResult.POWER !== 'ON' && toggleResult.POWER !== 'OFF'))) {
      // If direct communication fails, update device status to offline
      await DeviceService.updateDeviceByDeviceId(deviceId, {
        status: 'OFFLINE',
        lastSeen: new Date()
      })
      
      return NextResponse.json(
        { error: 'Device is not responding. It may be offline.' },
        { status: 503 }
      )
    }
    
    // Extract power state directly from toggle command response
    const newPowerState = toggleResult.POWER === 'ON'
    
    // Get additional device status (but use toggle result for power state)
    const deviceStatus = await getDeviceStatus(device.ipAddress)
    
    let updatedDevice
    if (deviceStatus) {
      // Update database with real device status, but use toggle result for power state
      updatedDevice = await DeviceService.updateDeviceByDeviceId(deviceId, {
        powerState: newPowerState, // Use the toggle command result for power state
        energyConsumption: deviceStatus.energy_consumption || 0,
        totalEnergy: deviceStatus.total_energy || device.totalEnergy,
        wifiSignal: deviceStatus.wifi_signal || device.wifiSignal,
        uptime: deviceStatus.uptime || 0,
        voltage: deviceStatus.voltage || device.voltage,
        current: deviceStatus.current || device.current,
        status: 'ONLINE',
        lastSeen: new Date()
      })
    } else {
      // Fallback: use toggle result for power state
      updatedDevice = await DeviceService.updateDeviceByDeviceId(deviceId, {
        powerState: newPowerState,
        status: 'ONLINE',
        lastSeen: new Date()
      })
    }
    
    // Transform response
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
      { error: 'Failed to toggle device power' },
      { status: 500 }
    )
  }
} 