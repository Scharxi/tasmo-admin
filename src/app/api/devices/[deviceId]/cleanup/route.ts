import { NextRequest, NextResponse } from 'next/server'
import { DeviceService } from '@/lib/db'

// POST /api/devices/[deviceId]/cleanup - Cleanup old data for specific device
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ deviceId: string }> }
): Promise<NextResponse> {
  try {
    const { deviceId } = await context.params

    // Verify device exists
    const device = await DeviceService.getDeviceByDeviceId(deviceId)
    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    // Cleanup old readings for this device
    const deletedCount = await DeviceService.cleanupOldReadings(deviceId)

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} old energy readings`,
      deletedCount,
      deviceId,
      deviceName: device.deviceName
    })
  } catch (error) {
    console.error('Error cleaning up device data:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to cleanup device data' },
      { status: 500 }
    )
  }
} 