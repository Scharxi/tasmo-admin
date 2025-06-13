// Tasmota simulator configuration and utilities

// Tasmota simulator authentication
export const TASMOTA_AUTH = {
  username: 'admin',
  password: 'test1234!'
}

// Known simulator device IPs and ports
export const SIMULATOR_DEVICES = [
  { ip: '172.25.0.100', port: 8081, deviceId: 'kitchen_001' },
  { ip: '172.25.0.101', port: 8082, deviceId: 'kitchen_002' },
  { ip: '172.25.0.102', port: 8083, deviceId: 'kitchen_003' }
]

// Helper function to create Basic Auth header
export function createAuthHeader(): string {
  const credentials = Buffer.from(`${TASMOTA_AUTH.username}:${TASMOTA_AUTH.password}`).toString('base64')
  return `Basic ${credentials}`
}

// Helper function to get device URL (with port mapping for local development)
export function getDeviceUrl(ipAddress: string): string {
  const simulatorDevice = SIMULATOR_DEVICES.find(d => d.ip === ipAddress)
  if (simulatorDevice) {
    // Use localhost port mapping for development
    return `http://localhost:${simulatorDevice.port}`
  }
  // Direct IP access (requires setup-ip-aliases.sh to be run)
  return `http://${ipAddress}`
}

// Function to check if a device is online and get its basic info
export async function getDeviceStatus(ipAddress: string, timeout = 5000): Promise<any | null> {
  try {
    const deviceUrl = getDeviceUrl(ipAddress)
    
    // First get basic device info
    const basicResponse = await fetch(`${deviceUrl}/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(timeout)
    })
    
    if (!basicResponse.ok) {
      return null
    }
    
    const basicInfo = await basicResponse.json()
    
    // Then get power status using Tasmota command
    const powerStatus = await sendTasmotaCommand(ipAddress, 'Power', timeout)
    
    // Combine both responses
    return {
      ...basicInfo,
      power_state: powerStatus?.POWER === 'ON',
      power_info: powerStatus
    }
  } catch (error) {
    console.error(`Failed to get status from device at ${ipAddress}:`, error)
    return null
  }
}

// Function to send Tasmota commands (requires authentication)
export async function sendTasmotaCommand(ipAddress: string, command: string, timeout = 5000): Promise<any | null> {
  try {
    const deviceUrl = getDeviceUrl(ipAddress)
    
    const response = await fetch(`${deviceUrl}/cm?cmnd=${encodeURIComponent(command)}`, {
      method: 'GET',
      headers: {
        'Authorization': createAuthHeader(),
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(timeout)
    })
    
    if (!response.ok) {
      console.error(`Failed to send command '${command}' to device at ${ipAddress}`)
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error(`Failed to send command '${command}' to device at ${ipAddress}:`, error)
    return null
  }
}

// Transform device data from simulator format to our interface
export function transformDeviceData(deviceData: any, ipAddress: string) {
  return {
    device_id: deviceData.device_id || `device_${ipAddress.replace(/\./g, '_')}`,
    device_name: deviceData.device_name || 'Tasmota Device',
    ip_address: ipAddress,
    mac_address: deviceData.mac_address,
    firmware_version: deviceData.firmware_version || '12.5.0',
    status: deviceData.status || 'online',
    power_state: deviceData.power_state || false,
    energy_consumption: deviceData.energy_consumption || 0,
    total_energy: deviceData.total_energy || 0,
    wifi_signal: deviceData.wifi_signal || -50,
    uptime: deviceData.uptime || 0,
    voltage: deviceData.voltage || 230,
    current: deviceData.current || 0,
    last_seen: new Date().toISOString()
  }
} 