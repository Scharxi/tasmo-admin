import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schemas
const WorkflowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
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
  })),
  enabled: z.boolean().default(true)
})

const UpdateWorkflowSchema = WorkflowSchema.partial()

export async function GET() {
  try {
    const workflows = await prisma.workflow.findMany({
      include: {
        steps: {
          include: {
            conditions: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(workflows)
  } catch (error) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = WorkflowSchema.parse(body)

    const workflow = await prisma.workflow.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        enabled: validatedData.enabled,
        steps: {
          create: validatedData.steps.map((step, index) => ({
            id: step.id,
            deviceId: step.deviceId,
            action: step.action,
            delay: step.delay,
            order: index,
            conditions: {
              create: step.conditions?.map(condition => ({
                deviceId: condition.deviceId,
                state: condition.state
              })) || []
            }
          }))
        }
      },
      include: {
        steps: {
          include: {
            conditions: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return NextResponse.json(workflow, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating workflow:', error)
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    )
  }
} 