import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { setDevicePower, getDevicePowerState } from '@/lib/tasmota-service'

// Simple delay function
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Function to check device state using SDK
const checkDeviceState = async (deviceId: string): Promise<boolean> => {
  try {
    const device = await prisma.device.findUnique({
      where: { deviceId },
    })
    
    if (!device) {
      return false
    }
    
    // Try to get real-time state from device
    const powerState = await getDevicePowerState(device.ipAddress, 1, 5000)
    
    // If we can't reach the device, fall back to database value
    if (powerState === null) {
      console.warn(`Could not reach device ${deviceId}, using cached state`)
      return device.powerState
    }
    
    // Update database with real state
    await prisma.device.update({
      where: { deviceId },
      data: { powerState, lastSeen: new Date() },
    })
    
    return powerState
  } catch (error) {
    console.error(`Error checking device state for ${deviceId}:`, error)
    return false
  }
}

// Function to set device power using SDK
const setDevicePowerState = async (deviceId: string, powerOn: boolean): Promise<boolean> => {
  try {
    const device = await prisma.device.findUnique({
      where: { deviceId },
    })
    
    if (!device) {
      console.error(`Device ${deviceId} not found`)
      return false
    }
    
    // Use SDK to set power state on real device
    const result = await setDevicePower(device.ipAddress, powerOn, 1, 10000)
    
    if (!result.success) {
      console.error(`Failed to set power for device ${deviceId}: ${result.error}`)
      return false
    }
    
    // Update database with new state
    await prisma.device.update({
      where: { deviceId },
      data: {
        powerState: result.powerState ?? powerOn,
        status: 'ONLINE',
        lastSeen: new Date(),
      },
    })
    
    return true
  } catch (error) {
    console.error(`Error setting device power for ${deviceId}:`, error)
    return false
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workflowId } = await params
  
  try {
    // Check if workflow exists and is enabled
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        steps: {
          include: {
            conditions: true,
            device: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    if (!workflow.enabled) {
      return NextResponse.json(
        { error: 'Workflow is disabled' },
        { status: 400 }
      )
    }

    // Create execution record
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId,
        status: 'RUNNING',
      },
    })

    try {
      // Execute workflow steps
      for (const step of workflow.steps) {
        console.log(`Executing step ${step.order + 1}: ${step.action} for device ${step.device.deviceName}`)

        // Check conditions before executing step
        if (step.conditions && step.conditions.length > 0) {
          console.log(`Checking ${step.conditions.length} conditions...`)
          
          for (const condition of step.conditions) {
            const deviceState = await checkDeviceState(condition.deviceId)
            const expectedState = condition.state === 'ON'
            
            if (deviceState !== expectedState) {
              throw new Error(
                `Condition failed: Device ${condition.deviceId} is ${deviceState ? 'ON' : 'OFF'}, expected ${condition.state}`
              )
            }
          }
        }

        // Execute the step action
        switch (step.action) {
          case 'TURN_ON': {
            const turnOnSuccess = await setDevicePowerState(step.deviceId, true)
            if (!turnOnSuccess) {
              throw new Error(`Failed to turn on device ${step.device.deviceName}`)
            }
            console.log(`✓ Turned ON device: ${step.device.deviceName}`)
            break
          }

          case 'TURN_OFF': {
            const turnOffSuccess = await setDevicePowerState(step.deviceId, false)
            if (!turnOffSuccess) {
              throw new Error(`Failed to turn off device ${step.device.deviceName}`)
            }
            console.log(`✓ Turned OFF device: ${step.device.deviceName}`)
            break
          }

          case 'DELAY':
            if (step.delay && step.delay > 0) {
              console.log(`⏱️  Waiting ${step.delay} seconds...`)
              await delay(step.delay * 1000)
            }
            break

          default:
            throw new Error(`Unknown action: ${step.action}`)
        }

        // Add a small delay between steps for stability
        await delay(500)
      }

      // Mark execution as completed
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })

      console.log(`✅ Workflow "${workflow.name}" completed successfully`)

      return NextResponse.json({
        success: true,
        message: `Workflow "${workflow.name}" executed successfully`,
        executionId: execution.id,
      })

    } catch (stepError) {
      // Mark execution as failed
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: stepError instanceof Error ? stepError.message : 'Unknown error',
        },
      })

      console.error(`❌ Workflow "${workflow.name}" failed:`, stepError)

      return NextResponse.json(
        {
          error: 'Workflow execution failed',
          message: stepError instanceof Error ? stepError.message : 'Unknown error',
          executionId: execution.id,
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error executing workflow:', error)
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    )
  }
}
