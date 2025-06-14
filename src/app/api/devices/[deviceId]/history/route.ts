import { NextRequest, NextResponse } from 'next/server'
import { DeviceService } from '@/lib/db'

// GET /api/devices/[deviceId]/history - Get historical energy data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params
    const { searchParams } = new URL(request.url)
    
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      )
    }
    
    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '100')
    const interval = searchParams.get('interval') as 'raw' | 'hourly' | 'daily' || 'raw'
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    
    // Validate parameters
    if (limit > 1000) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 1000' },
        { status: 400 }
      )
    }
    
    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      )
    }
    
    // Get device to verify it exists
    const device = await DeviceService.getDeviceByDeviceId(deviceId)
    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }
    
    // Fetch historical data
    const readings = await DeviceService.getEnergyReadings(deviceId, {
      limit,
      startDate,
      endDate,
      interval
    })
    
    // Calculate summary statistics
    const stats = interval === 'raw' ? {
      total_readings: (readings as any[]).length,
      avg_power: (readings as any[]).length > 0 ? (readings as any[]).reduce((sum: number, r: any) => sum + r.power, 0) / (readings as any[]).length : 0,
      max_power: (readings as any[]).length > 0 ? Math.max(...(readings as any[]).map((r: any) => r.power)) : 0,
      min_power: (readings as any[]).length > 0 ? Math.min(...(readings as any[]).map((r: any) => r.power)) : 0,
      time_range: {
        start: (readings as any[])[((readings as any[]).length - 1)]?.timestamp,
        end: (readings as any[])[0]?.timestamp
      }
    } : null
    
    return NextResponse.json({
      device_id: deviceId,
      device_name: device.deviceName,
      interval,
      limit,
      readings,
      stats,
      query: {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        interval,
        limit
      }
    })
    
  } catch (error) {
    const { deviceId } = await params
    console.error(`Error fetching history for device ${deviceId}:`, error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch device history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/devices/[deviceId]/history - Cleanup old historical data
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params
    const { searchParams } = new URL(request.url)
    
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      )
    }
    
    // Parse retention days (default 30)
    const retentionDays = parseInt(searchParams.get('retentionDays') || '30')
    
    if (retentionDays < 1 || retentionDays > 365) {
      return NextResponse.json(
        { error: 'Retention days must be between 1 and 365' },
        { status: 400 }
      )
    }
    
    // Verify device exists
    const device = await DeviceService.getDeviceByDeviceId(deviceId)
    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }
    
    // Cleanup old readings
    const deletedCount = await DeviceService.cleanupOldReadings(retentionDays)
    
    return NextResponse.json({
      message: `Successfully cleaned up old readings`,
      deleted_count: deletedCount,
      retention_days: retentionDays,
      cutoff_date: new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString()
    })
    
  } catch (error) {
    const { deviceId } = await params
    console.error(`Error cleaning up history for device ${deviceId}:`, error)
    
    return NextResponse.json(
      { 
        error: 'Failed to cleanup device history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 