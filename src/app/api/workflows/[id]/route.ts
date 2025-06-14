import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const UpdateWorkflowSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().nullable().optional(),
  steps: z.array(z.object({
    id: z.string(),
    deviceId: z.string(),
    action: z.enum(['TURN_ON', 'TURN_OFF', 'DELAY']),
    delay: z.number().optional().nullable(),
    conditions: z.array(z.object({
      deviceId: z.string(),
      state: z.enum(['ON', 'OFF'])
    })).optional().default([])
  })).optional(),
  enabled: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        steps: {
          include: {
            conditions: true,
            device: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Error fetching workflow:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const body = await request.json()
    console.log('PUT /api/workflows/[id] - Received body:', JSON.stringify(body, null, 2))
    
    const validatedData = UpdateWorkflowSchema.parse(body)
    console.log('PUT /api/workflows/[id] - Validated data:', JSON.stringify(validatedData, null, 2))

    // If steps are provided, update them
    if (validatedData.steps) {
      // Delete existing steps and their conditions (cascade will handle conditions)
      await prisma.workflowStep.deleteMany({
        where: { workflowId: id }
      })

              // Create new steps with conditions in a transaction
        await prisma.$transaction(async (tx) => {
          // First, verify all devices exist
          const deviceIds = [...new Set([
            ...validatedData.steps!.map(step => step.deviceId),
            ...validatedData.steps!.flatMap(step => step.conditions?.map(c => c.deviceId) || [])
          ])]
          
          const devices = await tx.device.findMany({
            where: { deviceId: { in: deviceIds } },
            select: { deviceId: true }
          })
          
          const existingDeviceIds = new Set(devices.map(d => d.deviceId))
          const missingDevices = deviceIds.filter(id => !existingDeviceIds.has(id))
          
          if (missingDevices.length > 0) {
            throw new Error(`Devices not found: ${missingDevices.join(', ')}`)
          }
          
          // Create new steps
          await tx.workflowStep.createMany({
            data: validatedData.steps!.map((step, index) => ({
              id: step.id,
              workflowId: id,
              deviceId: step.deviceId,
              action: step.action,
              delay: step.delay,
              order: index
            }))
          })

          // Create conditions for each step
          for (const step of validatedData.steps!) {
            if (step.conditions && step.conditions.length > 0) {
              await tx.workflowCondition.createMany({
                data: step.conditions.map(condition => ({
                  stepId: step.id,
                  deviceId: condition.deviceId,
                  state: condition.state
                }))
              })
            }
          }
        })
    }

    // Update workflow metadata
    const workflow = await prisma.workflow.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        enabled: validatedData.enabled
      },
      include: {
        steps: {
          include: {
            conditions: true,
            device: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return NextResponse.json(workflow)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('PUT /api/workflows/[id] - Validation Error:', error.errors)
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('PUT /api/workflows/[id] - Error updating workflow:', error)
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    await prisma.workflow.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workflow:', error)
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    )
  }
} 