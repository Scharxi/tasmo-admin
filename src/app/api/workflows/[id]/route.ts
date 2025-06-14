import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const UpdateWorkflowSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  steps: z.array(z.object({
    id: z.string(),
    deviceId: z.string(),
    action: z.enum(['TURN_ON', 'TURN_OFF', 'DELAY']),
    delay: z.number().optional(),
    conditions: z.array(z.object({
      deviceId: z.string(),
      state: z.enum(['ON', 'OFF'])
    })).optional()
  })).optional(),
  enabled: z.boolean().optional()
}).partial()

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
    const validatedData = UpdateWorkflowSchema.parse(body)

    // If steps are provided, update them
    if (validatedData.steps) {
      // Delete existing steps
      await prisma.workflowStep.deleteMany({
        where: { workflowId: id }
      })

      // Create new steps
      await prisma.workflowStep.createMany({
        data: validatedData.steps.map((step, index) => ({
          id: step.id,
          workflowId: id,
          deviceId: step.deviceId,
          action: step.action,
          delay: step.delay,
          order: index
        }))
      })

      // Create conditions for each step
      for (const step of validatedData.steps) {
        if (step.conditions && step.conditions.length > 0) {
          await prisma.workflowCondition.createMany({
            data: step.conditions.map(condition => ({
              stepId: step.id,
              deviceId: condition.deviceId,
              state: condition.state
            }))
          })
        }
      }
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
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating workflow:', error)
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