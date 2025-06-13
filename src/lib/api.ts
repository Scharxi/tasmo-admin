// API integration for Tasmota device simulation

export interface TasmotaDevice {
  device_id: string
  device_name: string
  ip_address: string
  mac_address?: string
  firmware_version: string
  status: 'online' | 'offline' | 'error'
  power_state: boolean
  energy_consumption: number
  total_energy: number
  wifi_signal: number
  uptime: number
  voltage?: number
  current?: number
  last_seen: string
}

export interface EnergyData {
  power: number
  apparent_power: number
  reactive_power: number
  factor: number
  voltage: number
  current: number
  total: number
  today: number
  yesterday: number
}

export interface DeviceResponse {
  Status: {
    Power: number
    PowerOnState: number
    LedState: number
    LedMask: string
    SaveData: number
    SaveState: number
    SwitchTopic: string
    SwitchRetain: number
    PowerRetain: number
    SensorRetain: number
    PulseTime: number
  }
  StatusSTS: {
    Time: string
    Uptime: string
    UptimeSec: number
    Heap: number
    SleepMode: string
    Sleep: number
    LoadAvg: number
    MqttCount: number
    Power: string
    Dimmer: number
    Color: string
    HSBColor: string
    White: number
    CT: number
    Channel: number[]
    Scheme: number
    Fade: string
    Speed: number
    LedTable: string
    Wifi: {
      AP: number
      SSId: string
      BSSId: string
      Channel: number
      Mode: string
      RSSI: number
      Signal: number
      LinkCount: number
      Downtime: string
    }
  }
  StatusSNS?: {
    Time: string
    ENERGY: EnergyData
  }
}

export interface CreateDeviceRequest {
  ipAddress: string
}

// Tasmota simulator configuration
const TASMOTA_AUTH = {
  username: 'admin',
  password: 'test1234!'
}

// Known simulator device IPs and ports
const SIMULATOR_DEVICES = [
  { ip: '172.25.0.100', port: 8081, deviceId: 'kitchen_001' },
  { ip: '172.25.0.101', port: 8082, deviceId: 'kitchen_002' },
  { ip: '172.25.0.102', port: 8083, deviceId: 'kitchen_003' }
]

// Helper function to create Basic Auth header
function createAuthHeader(): string {
  const credentials = btoa(`${TASMOTA_AUTH.username}:${TASMOTA_AUTH.password}`)
  return `Basic ${credentials}`
}

// Helper function to determine device access URL
function getDeviceUrl(ipAddress: string): string {
  // Try direct IP first (requires IP aliases to be set up)
  // Fallback to localhost with port mapping
  const simulatorDevice = SIMULATOR_DEVICES.find(d => d.ip === ipAddress)
  if (simulatorDevice) {
    // Use localhost port mapping for development
    return `http://localhost:${simulatorDevice.port}`
  }
  // Direct IP access (requires setup-ip-aliases.sh to be run)
  return `http://${ipAddress}`
}

// API functions
export class TasmotaAPI {
  private baseUrl = '/api'

  async fetchDevices(): Promise<TasmotaDevice[]> {
    try {
      const response = await fetch(`${this.baseUrl}/devices`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch devices:', error)
      throw error
    }
  }

  async createDevice(data: CreateDeviceRequest): Promise<TasmotaDevice> {
    try {
      // First, fetch device information from the Tasmota device
      const deviceInfo = await this.fetchDeviceInfo(data.ipAddress)
      
      // Then create the device in our database with the fetched information
      const response = await fetch(`${this.baseUrl}/devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: deviceInfo.device_id,
          deviceName: deviceInfo.device_name,
          ipAddress: deviceInfo.ip_address,
          macAddress: deviceInfo.mac_address,
          firmwareVersion: deviceInfo.firmware_version
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to create device:', error)
      throw error
    }
  }

  async toggleDevicePower(deviceId: string): Promise<TasmotaDevice> {
    try {
      const response = await fetch(`${this.baseUrl}/devices/${deviceId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to toggle device power:', error)
      throw error
    }
  }

  async deleteDevice(deviceId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/devices/${deviceId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to delete device:', error)
      throw error
    }
  }

  // Utility method to discover Tasmota devices on network
  async discoverDevices(): Promise<TasmotaDevice[]> {
    try {
      const response = await fetch(`${this.baseUrl}/devices/discover`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to discover devices:', error)
      throw error
    }
  }

  // Direct device communication methods (for real-time interaction)
  
  async getDeviceStatusDirect(ipAddress: string): Promise<TasmotaDevice | null> {
    try {
      const deviceUrl = getDeviceUrl(ipAddress)
      
      // Fetch device status directly from the simulator
      const response = await fetch(`${deviceUrl}/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000)
      })
      
      if (!response.ok) {
        console.warn(`Device at ${ipAddress} is not responding`)
        return null
      }
      
      const deviceData = await response.json()
      
      // Transform simulator response to our interface
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
    } catch (error) {
      console.error(`Failed to get device status from ${ipAddress}:`, error)
      return null
    }
  }

  async setDevicePowerDirect(ipAddress: string, powerState: boolean): Promise<boolean> {
    try {
      const deviceUrl = getDeviceUrl(ipAddress)
      const command = powerState ? 'Power%20ON' : 'Power%20OFF'
      
      const response = await fetch(`${deviceUrl}/cm?cmnd=${command}`, {
        method: 'GET',
        headers: {
          'Authorization': createAuthHeader(),
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000)
      })
      
      if (!response.ok) {
        console.error(`Failed to set power for device at ${ipAddress}`)
        return false
      }
      
      const result = await response.json()
      return result.POWER === (powerState ? 'ON' : 'OFF')
    } catch (error) {
      console.error(`Failed to set power for ${ipAddress}:`, error)
      return false
    }
  }

  async toggleDevicePowerDirect(ipAddress: string): Promise<boolean> {
    try {
      const deviceUrl = getDeviceUrl(ipAddress)
      
      const response = await fetch(`${deviceUrl}/cm?cmnd=Power%20TOGGLE`, {
        method: 'GET',
        headers: {
          'Authorization': createAuthHeader(),
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000)
      })
      
      if (!response.ok) {
        console.error(`Failed to toggle power for device at ${ipAddress}`)
        return false
      }
      
      return true
    } catch (error) {
      console.error(`Failed to toggle power for ${ipAddress}:`, error)
      return false
    }
  }

  // Legacy methods for compatibility with existing code
  
  async getDeviceStatus(deviceId: string): Promise<TasmotaDevice | null> {
    // Try to find the device IP from known simulator devices
    const simulatorDevice = SIMULATOR_DEVICES.find(d => d.deviceId === deviceId)
    if (simulatorDevice) {
      return await this.getDeviceStatusDirect(simulatorDevice.ip)
    }
    
    // Fallback to database query through API
    try {
      const devices = await this.fetchDevices()
      return devices.find(d => d.device_id === deviceId) || null
    } catch (error) {
      console.error(`Failed to get device status for ${deviceId}:`, error)
      return null
    }
  }

  async setDevicePower(deviceId: string, powerState: boolean): Promise<boolean> {
    // Try direct device communication first
    const simulatorDevice = SIMULATOR_DEVICES.find(d => d.deviceId === deviceId)
    if (simulatorDevice) {
      return await this.setDevicePowerDirect(simulatorDevice.ip, powerState)
    }
    
    // Fallback to API
    try {
      const device = await this.toggleDevicePower(deviceId)
      return device.power_state === powerState
    } catch (error) {
      console.error(`Failed to set power for ${deviceId}:`, error)
      return false
    }
  }

  async getEnergyData(deviceId: string): Promise<EnergyData | null> {
    try {
      const device = await this.getDeviceStatus(deviceId)
      if (!device) return null

      return {
        power: device.energy_consumption,
        apparent_power: device.energy_consumption * 1.1,
        reactive_power: device.energy_consumption * 0.2,
        factor: 0.9,
        voltage: device.voltage || 230,
        current: device.current || (device.energy_consumption / 230),
        total: device.total_energy,
        today: device.total_energy * 0.1,
        yesterday: device.total_energy * 0.08
      }
    } catch (error) {
      console.error(`Failed to get energy data for ${deviceId}:`, error)
      return null
    }
  }

  // Mock method to simulate real-time data updates
  subscribeToDeviceUpdates(deviceId: string, callback: (device: TasmotaDevice) => void): () => void {
    const interval = setInterval(async () => {
      const device = await this.getDeviceStatus(deviceId)
      if (device) {
        callback(device)
      }
    }, 5000)

    return () => clearInterval(interval)
  }

  // New method to fetch device info from Tasmota device via server-side API
  async fetchDeviceInfo(ipAddress: string): Promise<TasmotaDevice> {
    try {
      const response = await fetch(`${this.baseUrl}/devices/fetch-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ipAddress }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`Failed to fetch device info from ${ipAddress}:`, error)
      throw error
    }
  }

  // Fetch device metrics (Messwerte) for detailed monitoring
  async fetchDeviceMetrics(deviceId: string): Promise<EnergyData & { lastUpdate: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/devices/${deviceId}/metrics`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`Failed to fetch device metrics for ${deviceId}:`, error)
      throw error
    }
  }

  // Add device (alias for createDevice for consistency)
  async addDevice(data: CreateDeviceRequest): Promise<TasmotaDevice> {
    return this.createDevice(data)
  }
}

export const tasmotaAPI = new TasmotaAPI() 