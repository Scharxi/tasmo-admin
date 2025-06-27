import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readLdapConfig, writeLdapConfig, LdapConfigData } from '@/lib/ldap-config'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const currentConfig = await readLdapConfig()

    return NextResponse.json({ config: currentConfig })
  } catch (error) {
    console.error('Error getting LDAP config:', error)
    return NextResponse.json(
      { error: 'Failed to get LDAP configuration' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const { ldapUrl, baseDn, enabled }: Partial<LdapConfigData> = await request.json()

    if (typeof ldapUrl !== 'string' || typeof baseDn !== 'string' || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid configuration data' },
        { status: 400 }
      )
    }

    const newConfig: LdapConfigData = {
      ldapUrl,
      baseDn,
      enabled
    }

    // Save configuration to database
    await writeLdapConfig(newConfig)

    return NextResponse.json({ 
      success: true,
      message: 'LDAP configuration updated successfully. Changes will be applied immediately.',
      config: newConfig,
      requiresReload: true
    })
  } catch (error) {
    console.error('Error updating LDAP config:', error)
    return NextResponse.json(
      { error: 'Failed to update LDAP configuration' },
      { status: 500 }
    )
  }
} 