import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getDeviceStatus, sendTasmotaCommand, transformDeviceData } from '@/lib/tasmota-config'

const fetchInfoSchema = z.object({
  ipAddress: z.string().ip('Invalid IP address')
})

// POST /api/devices/fetch-info - Fetch device info from Tasmota device
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ipAddress } = fetchInfoSchema.parse(body)
    
    // Get basic device status from simulator
    const deviceData = await getDeviceStatus(ipAddress, 10000)
    
    if (!deviceData) {
      throw new Error(`Failed to connect to device at ${ipAddress}`)
    }
    
    // Try to get additional status using Tasmota commands if needed
    try {
      const commandData = await sendTasmotaCommand(ipAddress, 'Status 0', 5000)
      if (commandData) {
        console.log('Additional Tasmota status:', commandData)
        // Could parse additional data here if needed
      }
    } catch (commandError) {
      console.warn(`Could not fetch additional Tasmota status from ${ipAddress}:`, commandError)
      // Continue with basic device data
    }
    
    // Transform and return device info
    const deviceInfo = transformDeviceData(deviceData, ipAddress)
    
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