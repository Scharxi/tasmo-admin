/**
 * Tasmota Configuration and Utilities
 * 
 * This file provides high-level utilities for Tasmota device communication
 * using the tasmota-sdk service.
 */

import {
  getDeviceStatus as getDeviceStatusFromService,
  toggleDevicePower as toggleDevicePowerFromService,
  setDevicePower as setDevicePowerFromService,
  getDeviceEnergyData as getDeviceEnergyDataFromService,
  sendCommand,
  getDevice,
  type DeviceStatus,
  type ToggleResult,
  type DeviceEnergyData,
} from './tasmota-service'

// Re-export authentication config for backwards compatibility
export const TASMOTA_AUTH = {
  username: process.env.TASMOTA_USERNAME || 'admin',
  password: process.env.TASMOTA_PASSWORD || 'test1234!',
}

// Known simulator device IPs and ports (for development)
export const SIMULATOR_DEVICES = [
  { ip: '172.25.0.100', port: 8081, deviceId: 'kitchen_001' },
  { ip: '172.25.0.101', port: 8082, deviceId: 'kitchen_002' },
  { ip: '172.25.0.102', port: 8083, deviceId: 'kitchen_003' },
]

// Helper function to create Basic Auth header (for backwards compatibility)
export const createAuthHeader = (): string => {
  const credentials = Buffer.from(`${TASMOTA_AUTH.username}:${TASMOTA_AUTH.password}`).toString('base64')
  return `Basic ${credentials}`
}

// Helper function to get device URL (for backwards compatibility with simulators)
export const getDeviceUrl = (ipAddress: string): string => {
  const simulatorDevice = SIMULATOR_DEVICES.find((d) => d.ip === ipAddress)
  if (simulatorDevice) {
    return `http://localhost:${simulatorDevice.port}`
  }
  return `http://${ipAddress}`
}

/**
 * Get comprehensive device status using the Tasmota SDK
 */
export const getDeviceStatus = async (
  ipAddress: string,
  timeout = 5000
): Promise<DeviceStatus | null> => {
  return getDeviceStatusFromService(ipAddress, timeout)
}

/**
 * Send Tasmota command using the SDK
 */
export const sendTasmotaCommand = async <T = unknown>(
  ipAddress: string,
  command: string,
  timeout = 5000
): Promise<T | null> => {
  const result = await sendCommand<T>(ipAddress, command, timeout)
  if (!result.success) {
    console.warn(`Command '${command}' failed for ${ipAddress}: ${result.error}`)
    return null
  }
  return result.data ?? null
}

/**
 * Get detailed energy metrics from device
 */
export const getDeviceEnergyData = async (
  ipAddress: string,
  timeout = 5000
): Promise<DeviceEnergyData | null> => {
  return getDeviceEnergyDataFromService(ipAddress, timeout)
}

/**
 * Get firmware and system information
 */
export const getDeviceSystemInfo = async (
  ipAddress: string,
  timeout = 5000
): Promise<{ firmware: unknown; memory: unknown; network: unknown } | null> => {
  try {
    const device = getDevice(ipAddress, { timeout })
    const deviceInfo = await device.getDeviceInfo({ timeout, forceRefresh: true })
    
    return {
      firmware: {
        Version: deviceInfo.version,
        BuildDateTime: deviceInfo.buildDateTime,
        Hardware: deviceInfo.hardware,
      },
      memory: null, // SDK doesn't expose memory info directly
      network: {
        Hostname: deviceInfo.hostname,
        IPAddress: deviceInfo.ipAddress,
        Mac: deviceInfo.macAddress,
      },
    }
  } catch (error) {
    console.warn(`Could not get system info from ${ipAddress}:`, error)
    return null
  }
}

/**
 * Toggle power state using the SDK
 */
export const toggleDevicePower = async (
  ipAddress: string,
  timeout = 5000
): Promise<ToggleResult> => {
  return toggleDevicePowerFromService(ipAddress, 1, timeout)
}

/**
 * Set specific power state using the SDK
 */
export const setDevicePower = async (
  ipAddress: string,
  powerState: boolean,
  timeout = 5000
): Promise<ToggleResult> => {
  return setDevicePowerFromService(ipAddress, powerState, 1, timeout)
}

/**
 * Transform device data to our API format
 */
export const transformDeviceData = (
  deviceData: DeviceStatus | null,
  ipAddress: string
) => {
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
      last_seen: new Date().toISOString(),
    }
  }

  return {
    device_id: deviceData.deviceId,
    device_name: deviceData.deviceName,
    ip_address: ipAddress,
    mac_address: deviceData.macAddress,
    firmware_version: deviceData.firmwareVersion,
    status: deviceData.status,
    power_state: deviceData.powerState,
    energy_consumption: deviceData.energyConsumption,
    total_energy: deviceData.totalEnergy,
    wifi_signal: deviceData.wifiSignal,
    uptime: deviceData.uptime,
    voltage: deviceData.voltage,
    current: deviceData.current,
    last_seen: deviceData.lastSeen,
  }
}

// Re-export types
export type { DeviceStatus, ToggleResult, DeviceEnergyData }
