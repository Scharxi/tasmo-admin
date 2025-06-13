// API integration for Tasmota device simulation

export interface TasmotaDevice {
  device_id: string
  device_name: string
  ip_address: string
  power_state: boolean
  energy_consumption: number
  total_energy: number
  firmware_version: string
  uptime: number
  wifi_signal: number
  voltage?: number
  current?: number
  last_seen?: string
  status: 'online' | 'offline'
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

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://localhost:8081' 
  : 'http://localhost:8081'

// Mock devices configuration - matches the tasmota-sim setup
const MOCK_DEVICES: TasmotaDevice[] = [
  {
    device_id: 'kitchen_001',
    device_name: 'Kitchen Smart Plug',
    ip_address: '172.25.0.100',
    power_state: false,
    energy_consumption: 0,
    total_energy: 0,
    firmware_version: '12.5.0',
    uptime: 3600,
    wifi_signal: -45,
    voltage: 230,
    current: 0,
    status: 'online'
  },
  {
    device_id: 'kitchen_002',
    device_name: 'Living Room Lamp',
    ip_address: '172.25.0.101',
    power_state: true,
    energy_consumption: 42.5,
    total_energy: 1.25,
    firmware_version: '12.5.0',
    uptime: 7200,
    wifi_signal: -52,
    voltage: 230,
    current: 0.18,
    status: 'online'
  },
  {
    device_id: 'kitchen_003',
    device_name: 'Bedroom Outlet',
    ip_address: '172.25.0.102',
    power_state: false,
    energy_consumption: 0,
    total_energy: 0.75,
    firmware_version: '12.5.0',
    uptime: 1800,
    wifi_signal: -38,
    voltage: 230,
    current: 0,
    status: 'offline'
  }
]

// API functions
export class TasmotaAPI {
  private baseUrl: string

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl
  }

  async fetchDevices(): Promise<TasmotaDevice[]> {
    try {
      // For demo purposes, return mock data with some random variations
      return MOCK_DEVICES.map(device => ({
        ...device,
        uptime: device.uptime + Math.floor(Math.random() * 60),
        energy_consumption: device.power_state 
          ? Math.max(0, device.energy_consumption + (Math.random() - 0.5) * 10)
          : 0,
        wifi_signal: device.wifi_signal + Math.floor((Math.random() - 0.5) * 10)
      }))
    } catch (error) {
      console.error('Failed to fetch devices:', error)
      return MOCK_DEVICES
    }
  }

  async getDeviceStatus(deviceId: string): Promise<TasmotaDevice | null> {
    try {
      const device = MOCK_DEVICES.find(d => d.device_id === deviceId)
      if (!device) return null

      return {
        ...device,
        uptime: device.uptime + Math.floor(Math.random() * 60),
        energy_consumption: device.power_state 
          ? Math.max(0, device.energy_consumption + (Math.random() - 0.5) * 5)
          : 0
      }
    } catch (error) {
      console.error(`Failed to get device status for ${deviceId}:`, error)
      return null
    }
  }

  async toggleDevicePower(deviceId: string): Promise<boolean> {
    try {
      const deviceIndex = MOCK_DEVICES.findIndex(d => d.device_id === deviceId)
      if (deviceIndex === -1) return false

      MOCK_DEVICES[deviceIndex].power_state = !MOCK_DEVICES[deviceIndex].power_state
      MOCK_DEVICES[deviceIndex].energy_consumption = MOCK_DEVICES[deviceIndex].power_state 
        ? Math.random() * 100 + 20 
        : 0

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      return true
    } catch (error) {
      console.error(`Failed to toggle power for ${deviceId}:`, error)
      return false
    }
  }

  async setDevicePower(deviceId: string, powerState: boolean): Promise<boolean> {
    try {
      const deviceIndex = MOCK_DEVICES.findIndex(d => d.device_id === deviceId)
      if (deviceIndex === -1) return false

      MOCK_DEVICES[deviceIndex].power_state = powerState
      MOCK_DEVICES[deviceIndex].energy_consumption = powerState 
        ? Math.random() * 100 + 20 
        : 0

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      return true
    } catch (error) {
      console.error(`Failed to set power for ${deviceId}:`, error)
      return false
    }
  }

  async getEnergyData(deviceId: string): Promise<EnergyData | null> {
    try {
      const device = MOCK_DEVICES.find(d => d.device_id === deviceId)
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
}

export const tasmotaAPI = new TasmotaAPI() 