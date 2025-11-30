import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { DeviceConfig } from '../types';
import { TasmotaError } from '../errors';

/**
 * HTTP Client for Tasmota device communication
 * 
 * Tasmota uses query parameter authentication, not HTTP Basic Auth.
 * Format: http://<ip>/cm?user=<user>&password=<password>&cmnd=<command>
 * @see https://tasmota.github.io/docs/Commands/#with-web-requests
 */
export class TasmotaHttpClient {
  private readonly client: AxiosInstance;
  private readonly config: Required<Pick<DeviceConfig, 'host' | 'port' | 'timeout'>> & Pick<DeviceConfig, 'username' | 'password'>;

  constructor(config: DeviceConfig) {
    // Validate and set defaults for config
    this.config = {
      host: config.host,
      port: config.port ?? 80,
      timeout: config.timeout ?? 5000,
      username: config.username ?? undefined,
      password: config.password ?? undefined,
    };

    // Create axios instance with base configuration
    // Note: Tasmota does NOT use HTTP Basic Auth - credentials go in query params
    this.client = axios.create({
      timeout: this.config.timeout,
      headers: {
        'User-Agent': 'tasmota-sdk',
      },
    });

    // Add request interceptor for logging (in development)
    this.client.interceptors.request.use(
      (config) => {
        // Add timestamp for request tracking
        config.metadata = { startTime: Date.now() };
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        // Log response time in development
        const duration = Date.now() - (response.config.metadata?.startTime || 0);
        if (process.env.NODE_ENV === 'development') {
          console.debug(`Tasmota request completed in ${duration}ms`);
        }
        return response;
      },
      (error: AxiosError) => {
        return Promise.reject(this.handleAxiosError(error));
      }
    );
  }

  /**
   * Get the base URL for the device
   */
  private getBaseUrl(): string {
    const protocol = 'http'; // Tasmota typically uses HTTP
    const host = this.config.host.startsWith('http') 
      ? this.config.host 
      : `${protocol}://${this.config.host}`;
    
    // Only add port if it's not the default HTTP port and not already in the URL
    if (this.config.port !== 80 && !host.includes(':')) {
      return `${host}:${this.config.port}`;
    }
    
    return host;
  }

  /**
   * Build authentication query parameters for Tasmota web requests
   * Tasmota uses query param auth: ?user=<user>&password=<password>&cmnd=<command>
   * @see https://tasmota.github.io/docs/Commands/#with-web-requests
   */
  private buildAuthParams(): Record<string, string> {
    if (this.config.username && this.config.password) {
      return {
        user: this.config.username,
        password: this.config.password,
      };
    }
    return {};
  }

  /**
   * Send a command to the Tasmota device
   * Commands are sent via: http://<ip>/cm?cmnd=<command>
   * With auth: http://<ip>/cm?user=<user>&password=<password>&cmnd=<command>
   */
  async sendCommand<T = unknown>(command: string, options?: AxiosRequestConfig): Promise<T> {
    const url = `${this.getBaseUrl()}/cm`;
    const params = {
      ...this.buildAuthParams(),
      cmnd: command,
    };

    try {
      const response: AxiosResponse<T> = await this.client.get(url, {
        params,
        ...options,
      });

      return response.data;
    } catch (error) {
      throw this.handleAxiosError(error as AxiosError, command);
    }
  }

  /**
   * Send a JSON command to the Tasmota device
   * Uses /jc endpoint for JSON-formatted responses
   */
  async sendJsonCommand<T = unknown>(command: string, options?: AxiosRequestConfig): Promise<T> {
    const url = `${this.getBaseUrl()}/jc`;
    const params = {
      ...this.buildAuthParams(),
      cmnd: command,
    };

    try {
      const response: AxiosResponse<T> = await this.client.get(url, {
        params,
        ...options,
      });

      return response.data;
    } catch (error) {
      throw this.handleAxiosError(error as AxiosError, command);
    }
  }

  /**
   * Get device status
   */
  async getStatus<T = unknown>(statusType?: number): Promise<T> {
    const command = statusType !== undefined ? `Status ${statusType}` : 'Status';
    return this.sendCommand<T>(command);
  }

  /**
   * Check if the device is reachable
   */
  async ping(): Promise<boolean> {
    try {
      await this.sendCommand('Status');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get device information for discovery
   */
  async getDeviceInfo(): Promise<Record<string, unknown>> {
    try {
      const [status, statusNet, statusFwr] = await Promise.all([
        this.sendCommand('Status 0'),
        this.sendCommand('Status 5'),
        this.sendCommand('Status 2'),
      ]);

      return {
        status,
        network: statusNet,
        firmware: statusFwr,
      };
    } catch (error) {
      throw TasmotaError.fromUnknown(error, this.config.host);
    }
  }

  /**
   * Handle axios errors and convert to TasmotaError
   */
  private handleAxiosError(error: AxiosError, command?: string): TasmotaError {
    const deviceHost = this.config.host;

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return TasmotaError.timeoutError(deviceHost, command, this.config.timeout);
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return TasmotaError.deviceNotFound(deviceHost);
    }

    if (error.response) {
      const { status, statusText } = error.response;
      
      if (status === 401) {
        return TasmotaError.authenticationError(deviceHost);
      }

      if (status >= 400 && status < 500) {
        return TasmotaError.commandFailed(
          command || 'unknown',
          deviceHost,
          status,
          error
        );
      }

      return TasmotaError.networkError(
        `HTTP ${status}: ${statusText}`,
        error,
        deviceHost,
        command
      );
    }

    if (error.request) {
      return TasmotaError.networkError(
        'No response received from device',
        error,
        deviceHost,
        command
      );
    }

    return TasmotaError.networkError(
      error.message || 'Unknown network error',
      error,
      deviceHost,
      command
    );
  }

  /**
   * Get the device configuration
   */
  getConfig(): Required<Pick<DeviceConfig, 'host' | 'port' | 'timeout'>> & Pick<DeviceConfig, 'username' | 'password'> {
    return { ...this.config };
  }

  /**
   * Update the timeout for requests
   */
  setTimeout(timeout: number): void {
    this.client.defaults.timeout = timeout;
  }

  /**
   * Close the HTTP client and cleanup resources
   */
  destroy(): void {
    // Axios doesn't have a specific destroy method, but we can clear interceptors
    this.client.interceptors.request.clear();
    this.client.interceptors.response.clear();
  }
}

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}
