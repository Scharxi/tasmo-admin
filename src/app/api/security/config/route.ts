import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSecurityConfig, updateSecurityConfig } from '@/lib/security-store'

const securityConfigSchema = z.object({
  isEnabled: z.boolean(),
  password: z.string().optional()
})

export async function GET() {
  try {
    const config = await getSecurityConfig()
    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching security config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch security configuration' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { isEnabled, password } = securityConfigSchema.parse(body)

    // Update the security configuration
    const updatedConfig = await updateSecurityConfig({
      isEnabled,
      password
    })

    return NextResponse.json(updatedConfig)
  } catch (error) {
    console.error('Error updating security config:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update security configuration' },
      { status: 500 }
    )
  }
} 