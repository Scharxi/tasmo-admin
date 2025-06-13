import { NextResponse } from 'next/server'
import { SIMULATOR_DEVICES, getDeviceStatus, transformDeviceData } from '@/lib/tasmota-config'

// Function to discover a device and transform its data
async function discoverDevice(ipAddress: string): Promise<any | null> {
  const deviceData = await getDeviceStatus(ipAddress, 3000) // Short timeout for discovery
  if (!deviceData) return null
  
  return transformDeviceData(deviceData, ipAddress)
}

// POST /api/devices/discover - Discover available Tasmota devices
export async function POST() {
  try {
    console.log('Starting device discovery...')
    
    // Check all known simulator IPs
    const discoveryPromises = SIMULATOR_DEVICES.map(sim => 
      discoverDevice(sim.ip)
    )
    
    // Wait for all discovery attempts to complete
    const results = await Promise.all(discoveryPromises)
    
    // Filter out null results (offline devices)
    const discoveredDevices = results.filter(device => device !== null)
    
    console.log(`Discovery complete. Found ${discoveredDevices.length} devices.`)
    
    return NextResponse.json(discoveredDevices)
  } catch (error) {
    console.error('Error during device discovery:', error)
    return NextResponse.json(
      { error: 'Failed to discover devices' },
      { status: 500 }
    )
  }
} 