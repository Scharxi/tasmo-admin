import { NextRequest, NextResponse } from 'next/server'
import { DeviceService, DeviceLoggingConfig } from '@/lib/db'

interface RequestBody {
  enableDataLogging?: boolean
  dataRetentionDays?: number
  minLogInterval?: number
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ deviceId: string }> }
): Promise<NextResponse> {
  try {
    const { deviceId } = await context.params

    const config = await DeviceService.getDeviceLoggingConfig(deviceId)
    if (!config) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      config
    })
  } catch (error) {
    console.error('Error fetching device logging config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch logging configuration' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ deviceId: string }> }
): Promise<NextResponse> {
  try {
    const { deviceId } = await context.params
    const body: RequestBody = await request.json()

    // Validate input
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const config: Partial<DeviceLoggingConfig> = {}

    if (body.enableDataLogging !== undefined) {
      if (typeof body.enableDataLogging !== 'boolean') {
        return NextResponse.json(
          { error: 'enableDataLogging must be a boolean' },
          { status: 400 }
        )
      }
      config.enableDataLogging = body.enableDataLogging
    }

    if (body.dataRetentionDays !== undefined) {
      if (typeof body.dataRetentionDays !== 'number' || 
          body.dataRetentionDays < 1 || 
          body.dataRetentionDays > 365) {
        return NextResponse.json(
          { error: 'dataRetentionDays must be a number between 1 and 365' },
          { status: 400 }
        )
      }
      config.dataRetentionDays = body.dataRetentionDays
    }

    if (body.minLogInterval !== undefined) {
      if (typeof body.minLogInterval !== 'number' || 
          body.minLogInterval < 10 || 
          body.minLogInterval > 3600) {
        return NextResponse.json(
          { error: 'minLogInterval must be a number between 10 and 3600 seconds' },
          { status: 400 }
        )
      }
      config.minLogInterval = body.minLogInterval
    }

    // Update configuration
    const updatedDevice = await DeviceService.updateDeviceLoggingConfig(deviceId, config)

    return NextResponse.json({
      success: true,
      message: 'Logging configuration updated successfully',
      config: {
        enableDataLogging: updatedDevice.enableDataLogging,
        dataRetentionDays: updatedDevice.dataRetentionDays,
        minLogInterval: updatedDevice.minLogInterval
      }
    })
  } catch (error) {
    console.error('Error updating device logging config:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update logging configuration' },
      { status: 500 }
    )
  }
} 