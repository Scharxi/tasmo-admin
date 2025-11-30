import { EventEmitter } from 'events';
import {
  DeviceConfig,
  SDKOptions,
  DiscoveryDevice,
  PowerState,
  PowerCommand,
} from '../types';
import { TasmotaError } from '../errors';
import { TasmotaDevice, DeviceOperationOptions } from '../device/tasmota-device';
import { TasmotaDeviceDiscovery, DiscoveryOptions, DiscoveryResult } from '../discovery/device-discovery';

/**
 * Device registry entry
 */
export interface DeviceEntry {
  id: string;
  device: TasmotaDevice;
  config: DeviceConfig;
  lastSeen: number;
  isOnline: boolean;
}

/**
 * SDK Events
 */
export interface SDKEvents {
  'device-added': (entry: DeviceEntry) => void;
  'device-removed': (id: string) => void;
  'device-online': (id: string) => void;
  'device-offline': (id: string) => void;
  'discovery-complete': (result: DiscoveryResult) => void;
  'error': (error: TasmotaError) => void;
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult<T = unknown> {
  successful: Array<{ deviceId: string; result: T }>;
  failed: Array<{ deviceId: string; error: TasmotaError }>;
  totalDevices: number;
  successCount: number;
  failureCount: number;
}

/**
 * Main SDK class for managing multiple Tasmota devices
 */
export class TasmotaSDK extends EventEmitter {
  private readonly devices = new Map<string, DeviceEntry>();
  private readonly discovery: TasmotaDeviceDiscovery;
  private readonly options: Required<SDKOptions>;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(options?: SDKOptions) {
    super();
    
    this.options = {
      defaultTimeout: options?.defaultTimeout ?? 5000,
      retryAttempts: options?.retryAttempts ?? 3,
      retryDelay: options?.retryDelay ?? 1000,
      discoveryTimeout: options?.discoveryTimeout ?? 10000,
      validateResponses: options?.validateResponses ?? true,
    };

    this.discovery = new TasmotaDeviceDiscovery(this.options);
    this.setupDiscoveryEvents();
  }

  /**
   * Add a device to the SDK
   */
  addDevice(config: DeviceConfig, id?: string): string {
    try {
      const deviceId = id ?? this.generateDeviceId(config.host);
      
      if (this.devices.has(deviceId)) {
        throw TasmotaError.validationError(`Device with ID '${deviceId}' already exists`);
      }

      const device = new TasmotaDevice(config);
      const entry: DeviceEntry = {
        id: deviceId,
        device,
        config,
        lastSeen: Date.now(),
        isOnline: false,
      };

      this.devices.set(deviceId, entry);
      this.emit('device-added', entry);
      
      return deviceId;
    } catch (error) {
      throw TasmotaError.fromUnknown(error);
    }
  }

  /**
   * Remove a device from the SDK
   */
  removeDevice(deviceId: string): boolean {
    const entry = this.devices.get(deviceId);
    if (!entry) {
      return false;
    }

    entry.device.destroy();
    this.devices.delete(deviceId);
    this.emit('device-removed', deviceId);
    
    return true;
  }

  /**
   * Get a device by ID
   */
  getDevice(deviceId: string): TasmotaDevice | undefined {
    return this.devices.get(deviceId)?.device;
  }

  /**
   * Get all device IDs
   */
  getDeviceIds(): string[] {
    return Array.from(this.devices.keys());
  }

  /**
   * Get all devices
   */
  getDevices(): Map<string, TasmotaDevice> {
    const result = new Map<string, TasmotaDevice>();
    for (const [id, entry] of this.devices) {
      result.set(id, entry.device);
    }
    return result;
  }

  /**
   * Get device entry with metadata
   */
  getDeviceEntry(deviceId: string): DeviceEntry | undefined {
    return this.devices.get(deviceId);
  }

  /**
   * Get all device entries
   */
  getDeviceEntries(): DeviceEntry[] {
    return Array.from(this.devices.values());
  }

  /**
   * Check if a device exists
   */
  hasDevice(deviceId: string): boolean {
    return this.devices.has(deviceId);
  }

  /**
   * Get the number of registered devices
   */
  getDeviceCount(): number {
    return this.devices.size;
  }

  /**
   * Get online devices
   */
  getOnlineDevices(): string[] {
    return Array.from(this.devices.entries())
      .filter(([, entry]) => entry.isOnline)
      .map(([id]) => id);
  }

  /**
   * Get offline devices
   */
  getOfflineDevices(): string[] {
    return Array.from(this.devices.entries())
      .filter(([, entry]) => !entry.isOnline)
      .map(([id]) => id);
  }

  /**
   * Discover and add devices automatically
   */
  async discoverAndAddDevices(options: DiscoveryOptions = {}): Promise<DiscoveryResult> {
    try {
      const result = await this.discovery.discover(options);
      
      // Add discovered devices
      for (const discoveredDevice of result.devices) {
        const deviceId = this.generateDeviceId(discoveredDevice.ipAddress);
        
        if (!this.devices.has(deviceId)) {
          this.addDevice({
            host: discoveredDevice.ipAddress,
            port: 80,
            timeout: this.options.defaultTimeout,
          }, deviceId);
        }
      }
      
      this.emit('discovery-complete', result);
      return result;
    } catch (error) {
      const tasmotaError = TasmotaError.fromUnknown(error);
      this.emit('error', tasmotaError);
      throw tasmotaError;
    }
  }

  /**
   * Ping all devices to check their status
   */
  async pingAllDevices(options?: DeviceOperationOptions): Promise<BulkOperationResult<boolean>> {
    return this.executeBulkOperation(
      async (device) => device.ping(options),
      'ping'
    );
  }

  /**
   * Turn on all devices
   */
  async turnOnAll(relay = 1, options?: DeviceOperationOptions): Promise<BulkOperationResult<PowerState>> {
    return this.executeBulkOperation(
      async (device) => device.turnOn(relay, options),
      `turnOn(${relay})`
    );
  }

  /**
   * Turn off all devices
   */
  async turnOffAll(relay = 1, options?: DeviceOperationOptions): Promise<BulkOperationResult<PowerState>> {
    return this.executeBulkOperation(
      async (device) => device.turnOff(relay, options),
      `turnOff(${relay})`
    );
  }

  /**
   * Toggle all devices
   */
  async toggleAll(relay = 1, options?: DeviceOperationOptions): Promise<BulkOperationResult<PowerState>> {
    return this.executeBulkOperation(
      async (device) => device.toggle(relay, options),
      `toggle(${relay})`
    );
  }

  /**
   * Start blinking all devices
   */
  async blinkAll(relay = 1, options?: DeviceOperationOptions): Promise<BulkOperationResult<PowerState>> {
    return this.executeBulkOperation(
      async (device) => device.blink(relay, options),
      `blink(${relay})`
    );
  }

  /**
   * Stop blinking all devices
   */
  async blinkOffAll(relay = 1, options?: DeviceOperationOptions): Promise<BulkOperationResult<PowerState>> {
    return this.executeBulkOperation(
      async (device) => device.blinkOff(relay, options),
      `blinkOff(${relay})`
    );
  }

  /**
   * Set power state for all devices
   */
  async setPowerStateAll(
    state: PowerCommand,
    relay = 1,
    options?: DeviceOperationOptions
  ): Promise<BulkOperationResult<PowerState>> {
    return this.executeBulkOperation(
      async (device) => device.setPowerState(state, relay, options),
      `setPowerState(${state}, ${relay})`
    );
  }

  /**
   * Send a command to all devices
   */
  async sendCommandToAll<T = unknown>(
    command: string,
    options?: DeviceOperationOptions
  ): Promise<BulkOperationResult<T | undefined>> {
    return this.executeBulkOperation(
      async (device) => {
        const result = await device.sendCommand<T>(command, options);
        return result.data;
      },
      `sendCommand(${command})`
    );
  }

  /**
   * Send a command to specific devices
   */
  async sendCommandToDevices<T = unknown>(
    deviceIds: string[],
    command: string,
    options?: DeviceOperationOptions
  ): Promise<BulkOperationResult<T | undefined>> {
    return this.executeBulkOperation(
      async (device) => {
        const result = await device.sendCommand<T>(command, options);
        return result.data;
      },
      `sendCommand(${command})`,
      deviceIds
    );
  }

  /**
   * Start health check monitoring
   */
  startHealthCheck(intervalMs = 60000): void {
    this.stopHealthCheck();
    
    this.healthCheckInterval = setInterval(async () => {
      for (const [deviceId, entry] of this.devices) {
        try {
          const isOnline = await entry.device.ping({ timeout: 3000, retries: 1 });
          const wasOnline = entry.isOnline;
          
          entry.isOnline = isOnline;
          entry.lastSeen = Date.now();
          
          if (isOnline && !wasOnline) {
            this.emit('device-online', deviceId);
          } else if (!isOnline && wasOnline) {
            this.emit('device-offline', deviceId);
          }
        } catch {
          if (entry.isOnline) {
            entry.isOnline = false;
            this.emit('device-offline', deviceId);
          }
        }
      }
    }, intervalMs);
  }

  /**
   * Stop health check monitoring
   */
  stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Clear all devices
   */
  clearDevices(): void {
    for (const entry of this.devices.values()) {
      entry.device.destroy();
    }
    this.devices.clear();
  }

  /**
   * Cleanup and destroy the SDK
   */
  destroy(): void {
    this.stopHealthCheck();
    this.clearDevices();
    this.removeAllListeners();
  }

  /**
   * Execute a bulk operation on devices
   */
  private async executeBulkOperation<T>(
    operation: (device: TasmotaDevice) => Promise<T>,
    operationName: string,
    deviceIds?: string[]
  ): Promise<BulkOperationResult<T>> {
    const targetDevices = deviceIds 
      ? deviceIds.map(id => ({ id, entry: this.devices.get(id) })).filter(({ entry }) => entry)
      : Array.from(this.devices.entries()).map(([id, entry]) => ({ id, entry }));

    const successful: Array<{ deviceId: string; result: T }> = [];
    const failed: Array<{ deviceId: string; error: TasmotaError }> = [];

    await Promise.allSettled(
      targetDevices.map(async ({ id, entry }) => {
        if (!entry) return;
        
        try {
          const result = await operation(entry.device);
          successful.push({ deviceId: id, result });
        } catch (error) {
          const tasmotaError = TasmotaError.fromUnknown(error, entry.config.host, operationName);
          failed.push({ deviceId: id, error: tasmotaError });
        }
      })
    );

    return {
      successful,
      failed,
      totalDevices: targetDevices.length,
      successCount: successful.length,
      failureCount: failed.length,
    };
  }

  /**
   * Generate a device ID from host
   */
  private generateDeviceId(host: string): string {
    return host.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
  }

  /**
   * Setup discovery event handlers
   */
  private setupDiscoveryEvents(): void {
    this.discovery.on('device-found', (device: DiscoveryDevice) => {
      // Optionally auto-add discovered devices
    });

    this.discovery.on('error', (error: TasmotaError) => {
      this.emit('error', error);
    });
  }

  /**
   * Typed event emitter methods
   */
  on<K extends keyof SDKEvents>(event: K, listener: SDKEvents[K]): this {
    return super.on(event, listener);
  }

  emit<K extends keyof SDKEvents>(event: K, ...args: Parameters<SDKEvents[K]>): boolean {
    return super.emit(event, ...args);
  }

  /**
   * Create SDK instance with default options
   */
  static create(options?: SDKOptions): TasmotaSDK {
    return new TasmotaSDK(options);
  }
}
