import { NextRequest, NextResponse } from 'next/server'
import { DeviceService } from '@/lib/db'
import { getDeviceEnergyData, getDeviceStatus } from '@/lib/tasmota-config'

// GET /api/devices/[deviceId]/metrics - Get live device metrics
export async function GET(
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
    
    // Get device from database
    const device = await DeviceService.getDeviceByDeviceId(deviceId)
    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }
    
    // Try to get live energy data from device
    const energyData = await getDeviceEnergyData(device.ipAddress, 8000)
    
    if (!energyData) {
      // Device might be offline, return database values
      return NextResponse.json({
        power: device.energyConsumption || 0,
        apparent_power: (device.energyConsumption || 0) * 1.05,
        reactive_power: (device.energyConsumption || 0) * 0.1,
        factor: 0.95,
        voltage: device.voltage || 230,
        current: device.current || 0,
        total: device.totalEnergy || 0,
        today: (device.totalEnergy || 0) * 0.1,
        yesterday: (device.totalEnergy || 0) * 0.08,
        has_energy_monitoring: false,
        device_online: false,
        last_update: device.lastSeen.toISOString(),
        message: 'Using cached data - device may be offline'
      })
    }
    
    // Update database with fresh data (but don't wait for it to complete)
    const updatePromises = [
      // Update current device state
      DeviceService.updateDeviceByDeviceId(deviceId, {
        energyConsumption: energyData.Power || 0,
        totalEnergy: energyData.Total || device.totalEnergy,
        voltage: energyData.Voltage || device.voltage || 230,
        current: energyData.Current || device.current || 0,
        status: 'ONLINE',
        lastSeen: new Date()
      }),
      
      // Store historical reading (with intelligent filtering)
      DeviceService.addEnergyReading(deviceId, {
        power: energyData.Power || 0,
        energy: energyData.Total || device.totalEnergy || 0,
        voltage: energyData.Voltage || device.voltage || 230,
        current: energyData.Current || device.current || 0
      })
    ]
    
    // Execute updates in background
    Promise.all(updatePromises).catch(error => {
      console.warn(`Failed to update device ${deviceId} with fresh metrics:`, error)
    })
    
    // Return live metrics
    return NextResponse.json({
      power: energyData.Power || 0,
      apparent_power: energyData.ApparentPower || (energyData.Power || 0) * 1.05,
      reactive_power: energyData.ReactivePower || (energyData.Power || 0) * 0.1,
      factor: energyData.Factor || 0.95,
      voltage: energyData.Voltage || 230,
      current: energyData.Current || 0,
      total: energyData.Total || 0,
      today: energyData.Today || 0,
      yesterday: energyData.Yesterday || 0,
      has_energy_monitoring: energyData.has_energy_monitoring ?? true,
      device_online: true,
      last_update: energyData.last_update || new Date().toISOString(),
      message: energyData.has_energy_monitoring ? 'Live energy monitoring data' : 'Basic device data - no energy monitoring'
    })
    
  } catch (error) {
    const { deviceId } = await params
    console.error(`Error fetching metrics for device ${deviceId}:`, error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch device metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
        has_energy_monitoring: false,
        device_online: false
      },
      { status: 500 }
    )
  }
}

// POST /api/devices/[deviceId]/metrics - Force refresh device metrics
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
    
    // Get device from database
    const device = await DeviceService.getDeviceByDeviceId(deviceId)
    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }
    
    // Force comprehensive status update
    const deviceStatus = await getDeviceStatus(device.ipAddress, 10000)
    
    if (!deviceStatus) {
      // Mark device as offline
      await DeviceService.updateDeviceByDeviceId(deviceId, {
        status: 'OFFLINE',
        lastSeen: new Date()
      })
      
      return NextResponse.json(
        { 
          error: 'Device is not responding and has been marked offline',
          device_online: false
        },
        { status: 503 }
      )
    }
    
    // Update database with comprehensive status
    const updatedDevice = await DeviceService.updateDeviceByDeviceId(deviceId, {
      powerState: deviceStatus.power_state,
      energyConsumption: deviceStatus.energy_consumption || 0,
      totalEnergy: deviceStatus.total_energy || device.totalEnergy,
      wifiSignal: deviceStatus.wifi_signal || device.wifiSignal,
      uptime: deviceStatus.uptime || 0,
      voltage: deviceStatus.voltage || 230,
      current: deviceStatus.current || 0,
      status: 'ONLINE',
      lastSeen: new Date()
    })
    
    // Return updated device data
    return NextResponse.json({
      device_id: updatedDevice.deviceId,
      device_name: updatedDevice.deviceName,
      power_state: updatedDevice.powerState,
      energy_consumption: updatedDevice.energyConsumption,
      total_energy: updatedDevice.totalEnergy,
      voltage: updatedDevice.voltage,
      current: updatedDevice.current,
      wifi_signal: updatedDevice.wifiSignal,
      uptime: updatedDevice.uptime,
      status: updatedDevice.status.toLowerCase(),
      last_seen: updatedDevice.lastSeen.toISOString(),
      device_online: true,
      message: 'Device status refreshed successfully'
    })
    
  } catch (error) {
    const { deviceId } = await params
    console.error(`Error refreshing metrics for device ${deviceId}:`, error)
    
    return NextResponse.json(
      { 
        error: 'Failed to refresh device metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 