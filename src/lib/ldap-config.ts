import { prisma } from './prisma';

export interface LdapConfigData {
  ldapUrl: string;
  baseDn: string;
  enabled: boolean;
}

const DEFAULT_CONFIG: LdapConfigData = {
  ldapUrl: process.env.LDAP_URL || 'ldap://localhost:389',
  baseDn: process.env.LDAP_BASE_DN || 'dc=tasmota,dc=local',
  enabled: !!(process.env.LDAP_URL && process.env.LDAP_BASE_DN)
};

export async function readLdapConfig(): Promise<LdapConfigData> {
  try {
    // Try to get the first (and only) LDAP config record
    const config = await prisma.ldapConfig.findFirst();
    
    if (config) {
      return {
        ldapUrl: config.ldapUrl,
        baseDn: config.baseDn,
        enabled: config.enabled
      };
    }
  } catch (error) {
    console.error('Error reading LDAP config from database:', error);
  }
  
  // Return default config from environment variables if no config exists
  return DEFAULT_CONFIG;
}

export async function writeLdapConfig(config: LdapConfigData): Promise<void> {
  try {
    // Check if a config record already exists
    const existingConfig = await prisma.ldapConfig.findFirst();
    
    if (existingConfig) {
      // Update existing record
      await prisma.ldapConfig.update({
        where: { id: existingConfig.id },
        data: {
          ldapUrl: config.ldapUrl,
          baseDn: config.baseDn,
          enabled: config.enabled,
        },
      });
    } else {
      // Create new record
      await prisma.ldapConfig.create({
        data: {
          ldapUrl: config.ldapUrl,
          baseDn: config.baseDn,
          enabled: config.enabled,
        },
      });
    }
  } catch (error) {
    console.error('Error writing LDAP config to database:', error);
    throw new Error('Failed to save LDAP configuration');
  }
}

export async function isLdapEnabled(): Promise<boolean> {
  try {
    const config = await readLdapConfig();
    return config.enabled && !!(config.ldapUrl && config.baseDn);
  } catch (error) {
    console.error('Error checking LDAP status:', error);
    return false;
  }
} 