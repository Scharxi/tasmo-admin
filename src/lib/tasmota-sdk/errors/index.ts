import { TasmotaErrorType, TasmotaErrorDetails } from '../types';

/**
 * Custom error class for Tasmota SDK operations
 */
export class TasmotaError extends Error {
  public readonly type: TasmotaErrorType;
  public readonly originalError?: unknown;
  public readonly deviceHost?: string;
  public readonly command?: string;
  public readonly statusCode?: number;

  constructor(details: TasmotaErrorDetails) {
    super(details.message);
    this.name = 'TasmotaError';
    this.type = details.type;
    this.originalError = details.originalError;
    this.deviceHost = details.deviceHost;
    this.command = details.command;
    this.statusCode = details.statusCode;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TasmotaError);
    }
  }

  /**
   * Create a network error
   */
  static networkError(
    message: string,
    originalError?: unknown,
    deviceHost?: string,
    command?: string
  ): TasmotaError {
    return new TasmotaError({
      type: 'NETWORK_ERROR',
      message,
      originalError,
      deviceHost,
      command,
    });
  }

  /**
   * Create a timeout error
   */
  static timeoutError(
    deviceHost: string,
    command?: string,
    timeout?: number
  ): TasmotaError {
    const timeoutMsg = timeout ? ` after ${timeout}ms` : '';
    return new TasmotaError({
      type: 'TIMEOUT_ERROR',
      message: `Request to ${deviceHost} timed out${timeoutMsg}`,
      deviceHost,
      command,
    });
  }

  /**
   * Create an authentication error
   */
  static authenticationError(deviceHost: string): TasmotaError {
    return new TasmotaError({
      type: 'AUTHENTICATION_ERROR',
      message: `Authentication failed for device ${deviceHost}`,
      deviceHost,
    });
  }

  /**
   * Create a device not found error
   */
  static deviceNotFound(deviceHost: string): TasmotaError {
    return new TasmotaError({
      type: 'DEVICE_NOT_FOUND',
      message: `Device not found at ${deviceHost}`,
      deviceHost,
    });
  }

  /**
   * Create an invalid response error
   */
  static invalidResponse(
    message: string,
    deviceHost?: string,
    command?: string,
    originalError?: unknown
  ): TasmotaError {
    return new TasmotaError({
      type: 'INVALID_RESPONSE',
      message,
      originalError,
      deviceHost,
      command,
    });
  }

  /**
   * Create a command failed error
   */
  static commandFailed(
    command: string,
    deviceHost: string,
    statusCode?: number,
    originalError?: unknown
  ): TasmotaError {
    return new TasmotaError({
      type: 'COMMAND_FAILED',
      message: `Command '${command}' failed on device ${deviceHost}`,
      deviceHost,
      command,
      statusCode,
      originalError,
    });
  }

  /**
   * Create a validation error
   */
  static validationError(
    message: string,
    originalError?: unknown,
    deviceHost?: string
  ): TasmotaError {
    return new TasmotaError({
      type: 'VALIDATION_ERROR',
      message,
      originalError,
      deviceHost,
    });
  }

  /**
   * Check if an error is a TasmotaError
   */
  static isTasmotaError(error: unknown): error is TasmotaError {
    return error instanceof TasmotaError;
  }

  /**
   * Convert an unknown error to a TasmotaError
   */
  static fromUnknown(
    error: unknown,
    deviceHost?: string,
    command?: string
  ): TasmotaError {
    if (TasmotaError.isTasmotaError(error)) {
      return error;
    }

    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        return TasmotaError.timeoutError(deviceHost || 'unknown', command);
      }

      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        return TasmotaError.deviceNotFound(deviceHost || 'unknown');
      }

      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return TasmotaError.authenticationError(deviceHost || 'unknown');
      }

      return TasmotaError.networkError(
        error.message,
        error,
        deviceHost,
        command
      );
    }

    return TasmotaError.networkError(
      `Unknown error: ${String(error)}`,
      error,
      deviceHost,
      command
    );
  }

  /**
   * Get a user-friendly error message
   */
  getUserFriendlyMessage(): string {
    switch (this.type) {
      case 'NETWORK_ERROR':
        return `Network connection failed${this.deviceHost ? ` to ${this.deviceHost}` : ''}. Please check your network connection and device availability.`;
      
      case 'TIMEOUT_ERROR':
        return `Request timed out${this.deviceHost ? ` to ${this.deviceHost}` : ''}. The device may be busy or unreachable.`;
      
      case 'AUTHENTICATION_ERROR':
        return `Authentication failed${this.deviceHost ? ` for ${this.deviceHost}` : ''}. Please check your credentials.`;
      
      case 'DEVICE_NOT_FOUND':
        return `Device not found${this.deviceHost ? ` at ${this.deviceHost}` : ''}. Please verify the device address and network connectivity.`;
      
      case 'INVALID_RESPONSE':
        return `Received invalid response from device${this.deviceHost ? ` ${this.deviceHost}` : ''}. The device may not be a Tasmota device or may be running an incompatible version.`;
      
      case 'COMMAND_FAILED':
        return `Command failed${this.command ? ` (${this.command})` : ''}${this.deviceHost ? ` on device ${this.deviceHost}` : ''}. Please check the command and device status.`;
      
      case 'VALIDATION_ERROR':
        return `Invalid input data: ${this.message}`;
      
      default:
        return this.message;
    }
  }

  /**
   * Convert error to JSON
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      deviceHost: this.deviceHost,
      command: this.command,
      statusCode: this.statusCode,
      stack: this.stack,
    };
  }
}
