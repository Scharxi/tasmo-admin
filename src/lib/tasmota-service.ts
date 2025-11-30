/**
 * Tasmota Service - Singleton wrapper around the tasmota-sdk
 * 
 * This service provides a centralized way to interact with Tasmota devices
 * using the official tasmota-sdk package.
 */

import {
  TasmotaDevice,
  TasmotaDeviceDiscovery,
  createDevice,
  type DeviceConfig,
  type DeviceInfo,
  type EnergyData,
  type PowerState,
  type DiscoveryDevice,
  type DiscoveryOptions,
  type DiscoveryResult,
  type DeviceOperationOptions,
  TasmotaError,
} from './tasmota-sdk'

// Tasmota device authentication (for devices requiring auth)
const TASMOTA_AUTH = {
  username: process.env.TASMOTA_USERNAME || 'admin',
  password: process.env.TASMOTA_PASSWORD || 'test1234!',
}

// Default timeout for device operations
const DEFAULT_TIMEOUT = 5000
const DISCOVERY_TIMEOUT = 3000

// Device cache to avoid creating new instances repeatedly
const deviceCache = new Map<string, TasmotaDevice>()

/**
 * Get or create a TasmotaDevice instance for the given IP address
 */
export const getDevice = (ipAddress: string, options?: Partial<DeviceConfig>): TasmotaDevice => {
  const cacheKey = `${ipAddress}:${options?.port || 80}`
  
  if (!deviceCache.has(cacheKey)) {
    const device = createDevice(ipAddress, {
      port: 80,
      timeout: DEFAULT_TIMEOUT,
      username: TASMOTA_AUTH.username,
      password: TASMOTA_AUTH.password,
      ...options,
    })
    deviceCache.set(cacheKey, device)
  }
  
  return deviceCache.get(cacheKey)!
}

/**
 * Remove a device from the cache (useful when device is deleted)
 */
export const removeDeviceFromCache = (ipAddress: string, port = 80): void => {
  const cacheKey = `${ipAddress}:${port}`
  const device = deviceCache.get(cacheKey)
  if (device) {
    device.destroy()
    deviceCache.delete(cacheKey)
  }
}

/**
 * Clear all cached devices
 */
export const clearDeviceCache = (): void => {
  deviceCache.forEach((device) => device.destroy())
  deviceCache.clear()
}

/**
 * Get device information from Tasmota device
 */
export const getDeviceInfo = async (
  ipAddress: string,
  options?: DeviceOperationOptions
): Promise<DeviceInfo | null> => {
  try {
    const device = getDevice(ipAddress)
    return await device.getDeviceInfo({ ...options, forceRefresh: true })
  } catch (error) {
    console.error(`Failed to get device info from ${ipAddress}:`, error)
    return null
  }
}

/**
 * Get comprehensive device status including power state and system info
 */
export interface DeviceStatus {
  deviceId: string
  deviceName: string
  ipAddress: string
  macAddress: string | null
  firmwareVersion: string
  status: 'online' | 'offline'
  powerState: boolean
  energyConsumption: number
  totalEnergy: number
  voltage: number
  current: number
  wifiSignal: number
  uptime: number
  apparentPower: number
  reactivePower: number
  powerFactor: number
  energyToday: number
  energyYesterday: number
  hostname: string | null
  lastSeen: string
}

export const getDeviceStatus = async (
  ipAddress: string,
  timeout = DEFAULT_TIMEOUT
): Promise<DeviceStatus | null> => {
  try {
    const device = getDevice(ipAddress, { timeout })
    
    // Get device info
    const deviceInfo = await device.getDeviceInfo({ timeout, forceRefresh: true })
    
    // Get power status
    const powerStatus = await device.getPowerStatus({ timeout })
    const isPowerOn = powerStatus.relays['1'] === 'ON'
    
    // Try to get energy data (might not be supported)
    let energyData: EnergyData | null = null
    try {
      energyData = await device.getEnergyData({ timeout })
    } catch {
      // Device doesn't support energy monitoring
    }
    
    return {
      deviceId: deviceInfo.hostname || `device_${ipAddress.replace(/\./g, '_')}`,
      deviceName: deviceInfo.friendlyName[0] || 'Tasmota Device',
      ipAddress,
      macAddress: deviceInfo.macAddress || null,
      firmwareVersion: deviceInfo.version,
      status: 'online',
      powerState: isPowerOn,
      energyConsumption: energyData?.power || 0,
      totalEnergy: energyData?.total || 0,
      voltage: energyData?.voltage || 230,
      current: energyData?.current || 0,
      wifiSignal: -50, // Default, as SDK doesn't expose this directly
      uptime: deviceInfo.uptimeSeconds,
      apparentPower: energyData?.apparentPower || 0,
      reactivePower: energyData?.reactivePower || 0,
      powerFactor: energyData?.factor || 0.95,
      energyToday: energyData?.today || 0,
      energyYesterday: energyData?.yesterday || 0,
      hostname: deviceInfo.hostname,
      lastSeen: new Date().toISOString(),
    }
  } catch (error) {
    console.error(`Failed to get device status from ${ipAddress}:`, error)
    return null
  }
}

/**
 * Toggle device power state
 */
export interface ToggleResult {
  success: boolean
  powerState?: boolean
  error?: string
}

export const toggleDevicePower = async (
  ipAddress: string,
  relay = 1,
  timeout = DEFAULT_TIMEOUT
): Promise<ToggleResult> => {
  try {
    const device = getDevice(ipAddress, { timeout })
    const newState = await device.toggle(relay, { timeout })
    
    return {
      success: true,
      powerState: newState === 'ON',
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Failed to toggle device power at ${ipAddress}:`, errorMessage)
    
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Set specific power state
 */
export const setDevicePower = async (
  ipAddress: string,
  powerOn: boolean,
  relay = 1,
  timeout = DEFAULT_TIMEOUT
): Promise<ToggleResult> => {
  try {
    const device = getDevice(ipAddress, { timeout })
    const newState = powerOn 
      ? await device.turnOn(relay, { timeout })
      : await device.turnOff(relay, { timeout })
    
    return {
      success: true,
      powerState: newState === 'ON',
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Failed to set device power at ${ipAddress}:`, errorMessage)
    
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Get device power state
 */
export const getDevicePowerState = async (
  ipAddress: string,
  relay = 1,
  timeout = DEFAULT_TIMEOUT
): Promise<boolean | null> => {
  try {
    const device = getDevice(ipAddress, { timeout })
    const state = await device.getPowerState(relay, { timeout })
    return state === 'ON'
  } catch (error) {
    console.error(`Failed to get power state from ${ipAddress}:`, error)
    return null
  }
}

/**
 * Get energy data from device
 */
export interface DeviceEnergyData {
  power: number
  apparentPower: number
  reactivePower: number
  factor: number
  voltage: number
  current: number
  total: number
  today: number
  yesterday: number
  hasEnergyMonitoring: boolean
  lastUpdate: string
}

export const getDeviceEnergyData = async (
  ipAddress: string,
  timeout = DEFAULT_TIMEOUT
): Promise<DeviceEnergyData | null> => {
  try {
    const device = getDevice(ipAddress, { timeout })
    const energyData = await device.getEnergyData({ timeout })
    
    if (!energyData) {
      return {
        power: 0,
        apparentPower: 0,
        reactivePower: 0,
        factor: 1.0,
        voltage: 230,
        current: 0,
        total: 0,
        today: 0,
        yesterday: 0,
        hasEnergyMonitoring: false,
        lastUpdate: new Date().toISOString(),
      }
    }
    
    return {
      power: energyData.power,
      apparentPower: energyData.apparentPower,
      reactivePower: energyData.reactivePower,
      factor: energyData.factor,
      voltage: energyData.voltage,
      current: energyData.current,
      total: energyData.total,
      today: energyData.today,
      yesterday: energyData.yesterday,
      hasEnergyMonitoring: true,
      lastUpdate: new Date().toISOString(),
    }
  } catch (error) {
    console.error(`Failed to get energy data from ${ipAddress}:`, error)
    return null
  }
}

/**
 * Check if device is online (ping)
 */
export const pingDevice = async (
  ipAddress: string,
  timeout = DISCOVERY_TIMEOUT
): Promise<boolean> => {
  try {
    const device = getDevice(ipAddress, { timeout })
    return await device.ping({ timeout })
  } catch {
    return false
  }
}

/**
 * Send custom command to device
 */
export const sendCommand = async <T = unknown>(
  ipAddress: string,
  command: string,
  timeout = DEFAULT_TIMEOUT
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const device = getDevice(ipAddress, { timeout })
    const response = await device.sendCommand<T>(command, { timeout })
    
    if (!response.success) {
      return {
        success: false,
        error: response.error?.message || 'Command failed',
      }
    }
    
    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Discover Tasmota devices on the network
 */
export interface DiscoverResult {
  discoveredDevices: Array<{
    device_id: string
    device_name: string
    ip_address: string
    mac_address: string | null
    firmware_version: string
    status: string
    power_state: boolean
    energy_consumption: number
    total_energy: number
    wifi_signal: number
    uptime: number
    voltage: number
    current: number
    last_seen: string
  }>
  totalScanned: number
  totalFound: number
}

export const discoverDevices = async (
  options: DiscoveryOptions = {}
): Promise<DiscoverResult> => {
  const discovery = new TasmotaDeviceDiscovery()
  
  try {
    const result = await discovery.discover(options)
    
    // Transform discovered devices to our format
    const discoveredDevices = result.devices.map((device) => ({
      device_id: device.hostname || `device_${device.ipAddress.replace(/\./g, '_')}`,
      device_name: device.friendlyName || 'Tasmota Device',
      ip_address: device.ipAddress,
      mac_address: device.macAddress || null,
      firmware_version: device.version || '12.5.0',
      status: 'online',
      power_state: false, // Would need additional query to get this
      energy_consumption: 0,
      total_energy: 0,
      wifi_signal: -50,
      uptime: 0,
      voltage: 230,
      current: 0,
      last_seen: new Date().toISOString(),
    }))
    
    return {
      discoveredDevices,
      totalScanned: result.totalScanned,
      totalFound: result.totalFound,
    }
  } catch (error) {
    console.error('Device discovery failed:', error)
    return {
      discoveredDevices: [],
      totalScanned: 0,
      totalFound: 0,
    }
  }
}

/**
 * Scan a single device to check if it's a Tasmota device
 */
export const scanSingleDevice = async (
  ipAddress: string,
  timeout = DISCOVERY_TIMEOUT
): Promise<DiscoveryDevice | null> => {
  return TasmotaDeviceDiscovery.scanDevice(ipAddress, timeout)
}

/**
 * Check if a device at the given IP is a Tasmota device
 */
export const isTasmotaDevice = async (
  ipAddress: string,
  timeout = DISCOVERY_TIMEOUT
): Promise<boolean> => {
  return TasmotaDeviceDiscovery.isTasmotaDevice(ipAddress, timeout)
}

/**
 * Set device friendly name on the actual Tasmota device
 * Uses the FriendlyName command to update the device name
 * @see https://tasmota.github.io/docs/Commands/#management
 */
export interface SetDeviceNameResult {
  success: boolean
  newName?: string
  error?: string
}

export const setDeviceName = async (
  ipAddress: string,
  name: string,
  timeout = DEFAULT_TIMEOUT
): Promise<SetDeviceNameResult> => {
  try {
    const device = getDevice(ipAddress, { timeout })
    
    // Use FriendlyName1 command to set the device name
    // FriendlyName1 sets the name for the first relay/device
    const response = await device.sendCommand<{ FriendlyName1?: string }>(`FriendlyName1 ${name}`, { timeout })
    
    if (!response.success) {
      return {
        success: false,
        error: response.error?.message || 'Failed to set device name',
      }
    }
    
    // Also set DeviceName for the web interface
    await device.sendCommand(`DeviceName ${name}`, { timeout })
    
    return {
      success: true,
      newName: response.data?.FriendlyName1 || name,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Failed to set device name at ${ipAddress}:`, errorMessage)
    
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Transform SDK device data to our API format
 */
export const transformToApiFormat = (
  deviceInfo: DeviceInfo,
  ipAddress: string,
  powerState = false,
  energyData?: EnergyData | null
) => ({
  device_id: deviceInfo.hostname || `device_${ipAddress.replace(/\./g, '_')}`,
  device_name: deviceInfo.friendlyName[0] || 'Tasmota Device',
  ip_address: ipAddress,
  mac_address: deviceInfo.macAddress || null,
  firmware_version: deviceInfo.version,
  status: 'online',
  power_state: powerState,
  energy_consumption: energyData?.power || 0,
  total_energy: energyData?.total || 0,
  wifi_signal: -50,
  uptime: deviceInfo.uptimeSeconds,
  voltage: energyData?.voltage || 230,
  current: energyData?.current || 0,
  last_seen: new Date().toISOString(),
})

// Export types for use in other files
export type { DeviceInfo, EnergyData, PowerState, DiscoveryDevice, DeviceConfig }
export { TasmotaError }

