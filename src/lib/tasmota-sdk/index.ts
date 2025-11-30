// Main SDK exports
export { TasmotaSDK } from './sdk/tasmota-sdk';
export { TasmotaDevice } from './device/tasmota-device';
export { TasmotaDeviceDiscovery } from './discovery/device-discovery';

// Import classes for use in functions
import { TasmotaSDK } from './sdk/tasmota-sdk';
import { TasmotaDevice } from './device/tasmota-device';
import { TasmotaDeviceDiscovery } from './discovery/device-discovery';
import { TasmotaError } from './errors';
import type { SDKOptions, DeviceConfig, DiscoveryDevice } from './types';
import type { DiscoveryOptions, DiscoveryResult } from './discovery/device-discovery';

// Types
export type {
  DeviceConfig,
  DeviceInfo,
  PowerStatus,
  PowerState,
  PowerCommand,
  EnergyData,
  CommandResponse,
  DiscoveryDevice,
  SDKOptions,
  TasmotaErrorType,
  TasmotaErrorDetails,
} from './types';

export type {
  DeviceOperationOptions,
} from './device/tasmota-device';

export type {
  DiscoveryOptions,
  DiscoveryResult,
} from './discovery/device-discovery';

export type {
  DeviceEntry,
  BulkOperationResult,
} from './sdk/tasmota-sdk';

// Errors
export { TasmotaError } from './errors';

// Utilities (for advanced users)
export {
  transformToDeviceInfo,
  transformToPowerStatus,
  transformToEnergyData,
  transformToDiscoveryDevice,
  normalizeIpAddress,
  isValidIpAddress,
  generateIpRange,
  parseCommandResponse,
  retryOperation,
} from './utils/transformers';

// Zod schemas for validation (for advanced users)
export {
  DeviceConfig as DeviceConfigSchema,
  PowerState as PowerStateSchema,
  PowerCommand as PowerCommandSchema,
  StatusResponse as StatusResponseSchema,
  DiscoveryDevice as DiscoveryDeviceSchema,
  SDKOptions as SDKOptionsSchema,
} from './types';

/**
 * Create a new SDK instance
 */
export function createSDK(options?: SDKOptions): TasmotaSDK {
  return new TasmotaSDK(options);
}

/**
 * Create a new device instance from IP address
 */
export function createDevice(ipAddress: string, options?: Partial<DeviceConfig>): TasmotaDevice {
  return TasmotaDevice.fromIp(ipAddress, options);
}

/**
 * Create a new device discovery instance
 */
export function createDiscovery(options?: SDKOptions): TasmotaDeviceDiscovery {
  return new TasmotaDeviceDiscovery(options);
}

/**
 * Quick discovery function
 */
export async function discoverDevices(options?: DiscoveryOptions): Promise<DiscoveryResult> {
  return TasmotaDeviceDiscovery.discover(options);
}

/**
 * Quick device scan function
 */
export async function scanDevice(ip: string, timeout?: number): Promise<DiscoveryDevice | null> {
  return TasmotaDeviceDiscovery.scanDevice(ip, timeout);
}

/**
 * Check if a device is a Tasmota device
 */
export async function isTasmotaDevice(ip: string, timeout?: number): Promise<boolean> {
  return TasmotaDeviceDiscovery.isTasmotaDevice(ip, timeout);
}

// Re-export types from dependencies for convenience
export type { AxiosRequestConfig } from 'axios';
export type { z } from 'zod';

// Version information
export const VERSION = '1.0.0';

// Default export for convenience
export default {
  TasmotaSDK,
  TasmotaDevice,
  TasmotaDeviceDiscovery,
  TasmotaError,
  createSDK,
  createDevice,
  createDiscovery,
  discoverDevices,
  scanDevice,
  isTasmotaDevice,
  VERSION,
};
