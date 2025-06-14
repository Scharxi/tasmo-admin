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

// Enhanced function to get comprehensive device status using new Tasmota APIs
export async function getDeviceStatus(ipAddress: string, timeout = 5000): Promise<any | null> {
  try {
    const deviceUrl = getDeviceUrl(ipAddress)
    
    // Get comprehensive status using Status 0 (all status information)
    const statusResponse = await sendTasmotaCommand(ipAddress, 'Status 0', timeout)
    
    if (!statusResponse) {
      console.warn(`No status response from device at ${ipAddress}`)
      return null
    }
    
    // Try to get energy sensor data (Status 10)
    let energyData = null
    try {
      const energyResponse = await sendTasmotaCommand(ipAddress, 'Status 10', timeout)
      if (energyResponse?.StatusSNS?.ENERGY) {
        energyData = energyResponse.StatusSNS.ENERGY
      }
    } catch (energyError) {
      console.warn(`No energy data available from ${ipAddress}:`, energyError)
      // Continue without energy data - device might not support it
    }
    
    // Extract data from comprehensive status
    const status = statusResponse.Status || {}
    const statusSTS = statusResponse.StatusSTS || {}
    const statusNET = statusResponse.StatusNET || {}
    const statusFWR = statusResponse.StatusFWR || {}
    
    // Build device info with robust fallbacks
    const deviceInfo = {
      device_id: statusNET.Hostname || `device_${ipAddress.replace(/\./g, '_')}`,
      device_name: status.DeviceName || status.FriendlyName?.[0] || 'Tasmota Device',
      ip_address: ipAddress,
      mac_address: statusNET.Mac || null,
      firmware_version: statusFWR.Version || '12.5.0',
      status: 'online',
      power_state: status.Power === 1 || statusSTS.POWER === 'ON',
      
      // Energy data with safe fallbacks
      energy_consumption: energyData?.Power || 0,
      total_energy: energyData?.Total || 0,
      voltage: energyData?.Voltage || 230,
      current: energyData?.Current || 0,
      
      // Network and system info
      wifi_signal: statusSTS.Wifi?.Signal || statusSTS.Wifi?.RSSI || -50,
      uptime: statusSTS.UptimeSec || 0,
      
      // Additional energy metrics (if available)
      apparent_power: energyData?.ApparentPower || (energyData?.Power || 0) * 1.05,
      reactive_power: energyData?.ReactivePower || (energyData?.Power || 0) * 0.1,
      power_factor: energyData?.Factor || 0.95,
      energy_today: energyData?.Today || 0,
      energy_yesterday: energyData?.Yesterday || 0,
      
      // System information
      heap: statusSTS.Heap || 0,
      sleep_mode: statusSTS.SleepMode || 'Dynamic',
      mqtt_count: statusSTS.MqttCount || 0,
      
      // Network details
      hostname: statusNET.Hostname || null,
      gateway: statusNET.Gateway || null,
      dns: statusNET.DNSServer1 || null,
      wifi_channel: statusSTS.Wifi?.Channel || 0,
      wifi_mode: statusSTS.Wifi?.Mode || 'Unknown',
      
      last_seen: new Date().toISOString()
    }
    
    return deviceInfo
  } catch (error) {
    console.error(`Failed to get comprehensive status from device at ${ipAddress}:`, error)
    return null
  }
}

// Enhanced function to send Tasmota commands with better error handling
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
      console.error(`Failed to send command '${command}' to device at ${ipAddress} - Status: ${response.status}`)
      return null
    }
    
    const result = await response.json()
    
    // Check if the command was successful
    if (result.detail && result.detail.includes('Unknown command')) {
      console.warn(`Unknown command '${command}' for device at ${ipAddress}`)
      return null
    }
    
    return result
  } catch (error) {
    console.error(`Failed to send command '${command}' to device at ${ipAddress}:`, error)
    return null
  }
}

// Function to get detailed energy metrics (robust fallback)
export async function getDeviceEnergyData(ipAddress: string, timeout = 5000): Promise<any | null> {
  try {
    // Try Status 10 (sensor data) first
    const sensorData = await sendTasmotaCommand(ipAddress, 'Status 10', timeout)
    
    if (sensorData?.StatusSNS?.ENERGY) {
      return {
        ...sensorData.StatusSNS.ENERGY,
        has_energy_monitoring: true,
        last_update: sensorData.StatusSNS.Time || new Date().toISOString()
      }
    }
    
    // Fallback: Try basic device info
    const basicStatus = await sendTasmotaCommand(ipAddress, 'Status 11', timeout)
    
    if (basicStatus?.StatusSTS) {
      // Create minimal energy data from available info
      return {
        Power: 0,
        ApparentPower: 0,
        ReactivePower: 0,
        Factor: 1.0,
        Voltage: 230,
        Current: 0,
        Total: 0,
        Today: 0,
        Yesterday: 0,
        has_energy_monitoring: false,
        last_update: basicStatus.StatusSTS.Time || new Date().toISOString()
      }
    }
    
    return null
  } catch (error) {
    console.error(`Failed to get energy data from device at ${ipAddress}:`, error)
    return null
  }
}

// Function to get firmware and system information
export async function getDeviceSystemInfo(ipAddress: string, timeout = 5000): Promise<any | null> {
  try {
    const fwInfo = await sendTasmotaCommand(ipAddress, 'Status 2', timeout)
    const memInfo = await sendTasmotaCommand(ipAddress, 'Status 4', timeout)
    const netInfo = await sendTasmotaCommand(ipAddress, 'Status 5', timeout)
    
    return {
      firmware: fwInfo?.StatusFWR || null,
      memory: memInfo?.StatusMEM || null,
      network: netInfo?.StatusNET || null
    }
  } catch (error) {
    console.warn(`Could not get system info from ${ipAddress}:`, error)
    return null
  }
}

// Enhanced function to toggle power state with better feedback
export async function toggleDevicePower(ipAddress: string, timeout = 5000): Promise<{ success: boolean, power_state?: boolean, error?: string }> {
  try {
    const result = await sendTasmotaCommand(ipAddress, 'Power TOGGLE', timeout)
    
    if (!result || typeof result.POWER !== 'string') {
      return {
        success: false,
        error: 'Invalid response from device'
      }
    }
    
    return {
      success: true,
      power_state: result.POWER === 'ON'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Function to set specific power state
export async function setDevicePower(ipAddress: string, powerState: boolean, timeout = 5000): Promise<{ success: boolean, power_state?: boolean, error?: string }> {
  try {
    const command = powerState ? 'Power ON' : 'Power OFF'
    const result = await sendTasmotaCommand(ipAddress, command, timeout)
    
    if (!result || typeof result.POWER !== 'string') {
      return {
        success: false,
        error: 'Invalid response from device'
      }
    }
    
    return {
      success: true,
      power_state: result.POWER === 'ON'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Transform device data from simulator format to our interface (with safe fallbacks)
export function transformDeviceData(deviceData: any, ipAddress: string) {
  // Handle null or undefined deviceData gracefully
  if (!deviceData) {
    return {
      device_id: `device_${ipAddress.replace(/\./g, '_')}`,
      device_name: 'Offline Device',
      ip_address: ipAddress,
      mac_address: null,
      firmware_version: 'Unknown',
      status: 'offline',
      power_state: false,
      energy_consumption: 0,
      total_energy: 0,
      wifi_signal: -100,
      uptime: 0,
      voltage: 0,
      current: 0,
      last_seen: new Date().toISOString()
    }
  }

  return {
    device_id: deviceData.device_id || `device_${ipAddress.replace(/\./g, '_')}`,
    device_name: deviceData.device_name || 'Tasmota Device',
    ip_address: ipAddress,
    mac_address: deviceData.mac_address || null,
    firmware_version: deviceData.firmware_version || '12.5.0',
    status: deviceData.status || 'online',
    power_state: Boolean(deviceData.power_state),
    energy_consumption: Number(deviceData.energy_consumption) || 0,
    total_energy: Number(deviceData.total_energy) || 0,
    wifi_signal: Number(deviceData.wifi_signal) || -50,
    uptime: Number(deviceData.uptime) || 0,
    voltage: Number(deviceData.voltage) || 230,
    current: Number(deviceData.current) || 0,
    last_seen: deviceData.last_seen || new Date().toISOString()
  }
} 