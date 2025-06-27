import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

interface LdapConfig {
  ldapUrl: string
  baseDn: string
  enabled: boolean
}

const ENV_FILE_PATH = path.join(process.cwd(), '.env')

function readEnvFile(): Record<string, string> {
  try {
    const envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8')
    const envVars: Record<string, string> = {}
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '') // Remove quotes
          envVars[key] = value
        }
      }
    })
    
    return envVars
  } catch (error) {
    console.error('Error reading .env file:', error)
    return {}
  }
}

function writeEnvFile(envVars: Record<string, string>): void {
  try {
    const envContent = Object.entries(envVars)
      .map(([key, value]) => `${key}="${value}"`)
      .join('\n')
    
    fs.writeFileSync(ENV_FILE_PATH, envContent, 'utf8')
  } catch (error) {
    console.error('Error writing .env file:', error)
    throw new Error('Failed to update configuration')
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const currentConfig: LdapConfig = {
      ldapUrl: process.env.LDAP_URL || 'ldap://localhost:389',
      baseDn: process.env.LDAP_BASE_DN || 'dc=tasmota,dc=local',
      enabled: !!(process.env.LDAP_URL && process.env.LDAP_BASE_DN)
    }

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

    const { ldapUrl, baseDn, enabled }: Partial<LdapConfig> = await request.json()

    if (typeof ldapUrl !== 'string' || typeof baseDn !== 'string' || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid configuration data' },
        { status: 400 }
      )
    }

    // Read current env vars
    const envVars = readEnvFile()

    // Update LDAP configuration
    if (enabled) {
      envVars['LDAP_URL'] = ldapUrl
      envVars['LDAP_BASE_DN'] = baseDn
    } else {
      // Comment out or remove LDAP config when disabled
      delete envVars['LDAP_URL']
      delete envVars['LDAP_BASE_DN']
    }

    // Write updated env file
    writeEnvFile(envVars)

    // Update process.env for current session
    if (enabled) {
      process.env.LDAP_URL = ldapUrl
      process.env.LDAP_BASE_DN = baseDn
    } else {
      delete process.env.LDAP_URL
      delete process.env.LDAP_BASE_DN
    }

    return NextResponse.json({ 
      success: true,
      message: 'LDAP configuration updated successfully. Restart the application to apply changes.',
      config: {
        ldapUrl: enabled ? ldapUrl : '',
        baseDn: enabled ? baseDn : '',
        enabled
      }
    })
  } catch (error) {
    console.error('Error updating LDAP config:', error)
    return NextResponse.json(
      { error: 'Failed to update LDAP configuration' },
      { status: 500 }
    )
  }
} 