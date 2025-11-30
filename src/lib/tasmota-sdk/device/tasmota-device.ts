import {
  DeviceConfig,
  DeviceInfo,
  PowerStatus,
  PowerCommand,
  PowerState,
  EnergyData,
  CommandResponse,
} from '../types';
import { TasmotaError } from '../errors';
import { TasmotaHttpClient } from '../utils/http-client';
import {
  transformToDeviceInfo,
  transformToPowerStatus,
  transformToEnergyData,
  parseCommandResponse,
  retryOperation,
} from '../utils/transformers';

/**
 * Options for device operations
 */
export interface DeviceOperationOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Main class for controlling a Tasmota device
 */
export class TasmotaDevice {
  private readonly httpClient: TasmotaHttpClient;
  private readonly config: DeviceConfig;
  private cachedDeviceInfo?: DeviceInfo;
  private lastInfoUpdate = 0;
  private readonly INFO_CACHE_DURATION = 30000; // 30 seconds

  constructor(config: DeviceConfig) {
    try {
      // Validate configuration using Zod
      this.config = DeviceConfig.parse(config);
      this.httpClient = new TasmotaHttpClient(this.config);
    } catch (error) {
      throw TasmotaError.validationError(
        'Invalid device configuration',
        error
      );
    }
  }

  /**
   * Test connection to the device
   */
  async ping(options?: DeviceOperationOptions): Promise<boolean> {
    try {
      await this.executeWithRetry(
        () => this.httpClient.ping(),
        options
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get device information
   */
  async getDeviceInfo(options?: DeviceOperationOptions & { forceRefresh?: boolean }): Promise<DeviceInfo> {
    const now = Date.now();
    const forceRefresh = options?.forceRefresh ?? false;
    
    // Return cached info if available and not expired
    if (
      !forceRefresh &&
      this.cachedDeviceInfo &&
      now - this.lastInfoUpdate < this.INFO_CACHE_DURATION
    ) {
      return this.cachedDeviceInfo;
    }

    try {
      const statusData = await this.executeWithRetry(
        () => this.httpClient.getStatus(0),
        options
      );

      const deviceInfo = transformToDeviceInfo(statusData);
      
      // Cache the result
      this.cachedDeviceInfo = deviceInfo;
      this.lastInfoUpdate = now;
      
      return deviceInfo;
    } catch (error) {
      throw TasmotaError.fromUnknown(error, this.config.host, 'Status 0');
    }
  }

  /**
   * Get current power status for all relays
   */
  async getPowerStatus(options?: DeviceOperationOptions): Promise<PowerStatus> {
    try {
      const response = await this.executeWithRetry(
        () => this.httpClient.sendCommand('Power'),
        options
      );

      return transformToPowerStatus(response);
    } catch (error) {
      throw TasmotaError.fromUnknown(error, this.config.host, 'Power');
    }
  }

  /**
   * Get power state for a specific relay
   */
  async getPowerState(relay = 1, options?: DeviceOperationOptions): Promise<PowerState> {
    try {
      const command = relay === 1 ? 'Power' : `Power${relay}`;
      const response = await this.executeWithRetry(
        () => this.httpClient.sendCommand(command),
        options
      );

      const powerStatus = transformToPowerStatus(response);
      const relayState = powerStatus.relays[relay.toString()];
      
      if (!relayState) {
        throw TasmotaError.commandFailed(
          command,
          this.config.host,
          undefined,
          new Error(`Relay ${relay} not found`)
        );
      }

      return relayState;
    } catch (error) {
      throw TasmotaError.fromUnknown(error, this.config.host, `Power${relay === 1 ? '' : relay}`);
    }
  }

  /**
   * Set power state for a specific relay
   */
  async setPowerState(
    state: PowerCommand,
    relay = 1,
    options?: DeviceOperationOptions
  ): Promise<PowerState> {
    try {
      const command = relay === 1 
        ? `Power ${state}` 
        : `Power${relay} ${state}`;
      
      const response = await this.executeWithRetry(
        () => this.httpClient.sendCommand(command),
        options
      );

      const powerStatus = transformToPowerStatus(response);
      const newState = powerStatus.relays[relay.toString()];
      
      if (!newState) {
        throw TasmotaError.commandFailed(
          command,
          this.config.host,
          undefined,
          new Error(`Failed to set relay ${relay} state`)
        );
      }

      return newState;
    } catch (error) {
      throw TasmotaError.fromUnknown(error, this.config.host, `Power${relay === 1 ? '' : relay} ${state}`);
    }
  }

  /**
   * Turn on a specific relay
   */
  async turnOn(relay = 1, options?: DeviceOperationOptions): Promise<PowerState> {
    return this.setPowerState('ON', relay, options);
  }

  /**
   * Turn off a specific relay
   */
  async turnOff(relay = 1, options?: DeviceOperationOptions): Promise<PowerState> {
    return this.setPowerState('OFF', relay, options);
  }

  /**
   * Toggle a specific relay
   */
  async toggle(relay = 1, options?: DeviceOperationOptions): Promise<PowerState> {
    return this.setPowerState('TOGGLE', relay, options);
  }

  /**
   * Start blinking a specific relay
   * @see https://tasmota.github.io/docs/Commands/#control
   */
  async blink(relay = 1, options?: DeviceOperationOptions): Promise<PowerState> {
    return this.setPowerState('3', relay, options);
  }

  /**
   * Stop blinking a specific relay
   */
  async blinkOff(relay = 1, options?: DeviceOperationOptions): Promise<PowerState> {
    return this.setPowerState('4', relay, options);
  }

  /**
   * Turn on all relays
   */
  async turnOnAll(options?: DeviceOperationOptions): Promise<PowerStatus> {
    try {
      const response = await this.executeWithRetry(
        () => this.httpClient.sendCommand('Power0 1'),
        options
      );

      return transformToPowerStatus(response);
    } catch (error) {
      throw TasmotaError.fromUnknown(error, this.config.host, 'Power0 1');
    }
  }

  /**
   * Turn off all relays
   */
  async turnOffAll(options?: DeviceOperationOptions): Promise<PowerStatus> {
    try {
      const response = await this.executeWithRetry(
        () => this.httpClient.sendCommand('Power0 0'),
        options
      );

      return transformToPowerStatus(response);
    } catch (error) {
      throw TasmotaError.fromUnknown(error, this.config.host, 'Power0 0');
    }
  }

  /**
   * Get energy monitoring data (if supported)
   */
  async getEnergyData(options?: DeviceOperationOptions): Promise<EnergyData | null> {
    try {
      const statusData = await this.executeWithRetry(
        () => this.httpClient.getStatus(8),
        options
      );

      return transformToEnergyData(statusData);
    } catch (error) {
      if (TasmotaError.isTasmotaError(error) && error.type === 'VALIDATION_ERROR') {
        // Device doesn't support energy monitoring
        return null;
      }
      throw TasmotaError.fromUnknown(error, this.config.host, 'Status 8');
    }
  }

  /**
   * Send a custom command to the device
   */
  async sendCommand<T = unknown>(
    command: string,
    options?: DeviceOperationOptions
  ): Promise<CommandResponse<T>> {
    try {
      const response = await this.executeWithRetry(
        () => this.httpClient.sendCommand<T>(command),
        options
      );

      const parsed = parseCommandResponse<T>(response);
      
      if (!parsed.success && parsed.error) {
        throw TasmotaError.commandFailed(command, this.config.host, undefined, new Error(parsed.error));
      }

      return {
        success: true,
        data: parsed.data,
      };
    } catch (error) {
      if (TasmotaError.isTasmotaError(error)) {
        return {
          success: false,
          error: {
            type: error.type,
            message: error.message,
            deviceHost: error.deviceHost,
            command: error.command,
            statusCode: error.statusCode,
          },
        };
      }

      const tasmotaError = TasmotaError.fromUnknown(error, this.config.host, command);
      return {
        success: false,
        error: {
          type: tasmotaError.type,
          message: tasmotaError.message,
          deviceHost: tasmotaError.deviceHost,
          command: tasmotaError.command,
          statusCode: tasmotaError.statusCode,
        },
      };
    }
  }

  /**
   * Restart the device
   */
  async restart(options?: DeviceOperationOptions): Promise<CommandResponse> {
    return this.sendCommand('Restart 1', options);
  }

  /**
   * Execute multiple commands using Backlog
   * Tasmota's Backlog allows executing up to 30 consecutive commands with a single request.
   * Commands are separated by semicolons.
   * @see https://tasmota.github.io/docs/Commands/#the-power-of-backlog
   * @example
   * // Set up WiFi and MQTT in one request
   * await device.backlog(['SSID1 MyNetwork', 'Password1 secret', 'MqttHost broker.local']);
   */
  async backlog(
    commands: string[],
    options?: DeviceOperationOptions
  ): Promise<CommandResponse> {
    if (commands.length === 0) {
      return { success: true, data: {} };
    }

    if (commands.length > 30) {
      throw TasmotaError.validationError(
        'Backlog supports a maximum of 30 commands',
        undefined,
        this.config.host
      );
    }

    // Join commands with semicolons as per Tasmota documentation
    const backlogCommand = `Backlog ${commands.join('; ')}`;
    return this.sendCommand(backlogCommand, options);
  }

  /**
   * Clear any pending Backlog commands
   * Sending Backlog without arguments clears the queue
   */
  async clearBacklog(options?: DeviceOperationOptions): Promise<CommandResponse> {
    return this.sendCommand('Backlog', options);
  }

  /**
   * Get device uptime in seconds
   */
  async getUptime(options?: DeviceOperationOptions): Promise<number> {
    const deviceInfo = await this.getDeviceInfo(options);
    return deviceInfo.uptimeSeconds;
  }

  /**
   * Check if device supports energy monitoring
   */
  async supportsEnergyMonitoring(options?: DeviceOperationOptions): Promise<boolean> {
    const energyData = await this.getEnergyData(options);
    return energyData !== null;
  }

  /**
   * Get the number of relays on the device
   */
  async getRelayCount(options?: DeviceOperationOptions): Promise<number> {
    const powerStatus = await this.getPowerStatus(options);
    return powerStatus.relayCount;
  }

  /**
   * Get device configuration
   */
  getConfig(): DeviceConfig {
    return { ...this.config };
  }

  /**
   * Get device host/IP
   */
  getHost(): string {
    return this.config.host;
  }

  /**
   * Update device timeout
   */
  setTimeout(timeout: number): void {
    this.httpClient.setTimeout(timeout);
  }

  /**
   * Clear cached device information
   */
  clearCache(): void {
    this.cachedDeviceInfo = undefined;
    this.lastInfoUpdate = 0;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.httpClient.destroy();
    this.clearCache();
  }

  /**
   * Execute operation with retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    options?: DeviceOperationOptions
  ): Promise<T> {
    const maxRetries = options?.retries ?? 3;
    const retryDelay = options?.retryDelay ?? 1000;

    if (options?.timeout) {
      this.httpClient.setTimeout(options.timeout);
    }

    return retryOperation(operation, maxRetries, retryDelay);
  }

  /**
   * Create a device instance from IP address
   */
  static fromIp(ipAddress: string, options?: Partial<DeviceConfig>): TasmotaDevice {
    return new TasmotaDevice({
      host: ipAddress,
      port: 80,
      timeout: 5000,
      ...options,
    });
  }

  /**
   * Create a device instance from hostname
   */
  static fromHostname(hostname: string, options?: Partial<DeviceConfig>): TasmotaDevice {
    return new TasmotaDevice({
      host: hostname,
      port: 80,
      timeout: 5000,
      ...options,
    });
  }
}
