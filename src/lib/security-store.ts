import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export interface SecurityConfig {
  isEnabled: boolean
  hasPassword: boolean
}

/**
 * Get the current security configuration from the database
 */
export async function getSecurityConfig(): Promise<SecurityConfig> {
  try {
    // Get the first (and should be only) security config record
    let config = await prisma.securityConfig.findFirst()
    
    // If no config exists, create a default one
    if (!config) {
      config = await prisma.securityConfig.create({
        data: {
          isEnabled: false,
          hasPassword: false,
          passwordHash: null,
          passwordSalt: null
        }
      })
    }

    return {
      isEnabled: config.isEnabled,
      hasPassword: config.hasPassword
    }
  } catch (error) {
    console.error('Error fetching security config:', error)
    // Return safe defaults if database fails
    return {
      isEnabled: false,
      hasPassword: false
    }
  }
}

/**
 * Update the security configuration in the database
 */
export async function updateSecurityConfig(
  updates: Partial<{ isEnabled: boolean; password?: string }>
): Promise<SecurityConfig> {
  try {
    // Get the current config or create one if it doesn't exist
    let config = await prisma.securityConfig.findFirst()
    
    if (!config) {
      config = await prisma.securityConfig.create({
        data: {
          isEnabled: false,
          hasPassword: false,
          passwordHash: null,
          passwordSalt: null
        }
      })
    }

    // Prepare update data
    const updateData: any = {}
    
    if (updates.isEnabled !== undefined) {
      updateData.isEnabled = updates.isEnabled
    }

    // If a new password is provided, hash it securely
    if (updates.password) {
      const saltRounds = 12 // High security salt rounds
      const salt = await bcrypt.genSalt(saltRounds)
      const passwordHash = await bcrypt.hash(updates.password, salt)
      
      updateData.passwordHash = passwordHash
      updateData.passwordSalt = salt
      updateData.hasPassword = true
    }

    // Update the configuration
    const updatedConfig = await prisma.securityConfig.update({
      where: { id: config.id },
      data: updateData
    })

    return {
      isEnabled: updatedConfig.isEnabled,
      hasPassword: updatedConfig.hasPassword
    }
  } catch (error) {
    console.error('Error updating security config:', error)
    throw new Error('Failed to update security configuration')
  }
}

/**
 * Verify a password against the stored hash
 */
export async function verifyPassword(password: string): Promise<boolean> {
  try {
    const config = await prisma.securityConfig.findFirst()
    
    if (!config || !config.passwordHash || !config.isEnabled || !config.hasPassword) {
      return false
    }

    // Use bcrypt to securely compare the password
    return await bcrypt.compare(password, config.passwordHash)
  } catch (error) {
    console.error('Error verifying password:', error)
    return false
  }
}

/**
 * Check if security is properly configured and enabled
 */
export async function isSecurityEnabled(): Promise<boolean> {
  try {
    const config = await getSecurityConfig()
    return config.isEnabled && config.hasPassword
  } catch (error) {
    console.error('Error checking security status:', error)
    return false
  }
}

/**
 * Reset security configuration (remove password, disable security)
 */
export async function resetSecurityConfig(): Promise<SecurityConfig> {
  try {
    const config = await prisma.securityConfig.findFirst()
    
    if (!config) {
      // Create a default disabled config
      const newConfig = await prisma.securityConfig.create({
        data: {
          isEnabled: false,
          hasPassword: false,
          passwordHash: null,
          passwordSalt: null
        }
      })
      
      return {
        isEnabled: newConfig.isEnabled,
        hasPassword: newConfig.hasPassword
      }
    }

    // Reset existing config
    const updatedConfig = await prisma.securityConfig.update({
      where: { id: config.id },
      data: {
        isEnabled: false,
        hasPassword: false,
        passwordHash: null,
        passwordSalt: null
      }
    })

    return {
      isEnabled: updatedConfig.isEnabled,
      hasPassword: updatedConfig.hasPassword
    }
  } catch (error) {
    console.error('Error resetting security config:', error)
    throw new Error('Failed to reset security configuration')
  }
} 