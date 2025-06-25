import { NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyPassword, isSecurityEnabled } from '@/lib/security-store'

const verifyPasswordSchema = z.object({
  password: z.string().min(1, 'Password is required')
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { password } = verifyPasswordSchema.parse(body)

    // Check if security is properly enabled
    const securityEnabled = await isSecurityEnabled()
    if (!securityEnabled) {
      return NextResponse.json(
        { error: 'Security password protection is not enabled' },
        { status: 400 }
      )
    }

    // Verify the password using bcrypt
    const isValid = await verifyPassword(password)

    if (isValid) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Error verifying password:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to verify password' },
      { status: 500 }
    )
  }
} 