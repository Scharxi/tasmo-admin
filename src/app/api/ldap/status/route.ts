import { NextResponse } from 'next/server'
import { readLdapConfig, isLdapEnabled } from '@/lib/ldap-config'

export async function GET() {
  try {
    // Check LDAP configuration from database
    const ldapConfig = await readLdapConfig()
    const enabled = await isLdapEnabled()

    return NextResponse.json({ 
      enabled: enabled,
      configured: !!(ldapConfig.ldapUrl && ldapConfig.baseDn)
    })
  } catch (error) {
    console.error('Error checking LDAP status:', error)
    return NextResponse.json(
      { enabled: false, configured: false },
      { status: 500 }
    )
  }
} 