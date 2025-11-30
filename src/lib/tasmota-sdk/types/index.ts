import { z } from 'zod';

// Power States - Tasmota returns uppercase ON/OFF
export const PowerState = z.enum(['ON', 'OFF']);
export type PowerState = z.infer<typeof PowerState>;

/**
 * Power command values supported by Tasmota
 * @see https://tasmota.github.io/docs/Commands/#control
 * 
 * Tasmota accepts:
 * - OFF: 0, off, false, OFF
 * - ON: 1, on, true, ON  
 * - TOGGLE: 2, toggle, TOGGLE
 * - BLINK: 3 (start blinking)
 * - BLINKOFF: 4 (stop blinking)
 */
export const PowerCommand = z.enum([
  // Uppercase (standard)
  'ON', 'OFF', 'TOGGLE',
  // Lowercase (also accepted by Tasmota)
  'on', 'off', 'toggle',
  // Numeric string values
  '0', '1', '2',
  // Boolean-like
  'true', 'false',
  // Blink commands
  '3', '4', 'BLINK', 'BLINKOFF',
]);
export type PowerCommand = z.infer<typeof PowerCommand>;

// Device Configuration
export const DeviceConfig = z.object({
  host: z.string().ip().or(z.string().url()),
  port: z.number().min(1).max(65535).optional(),
  timeout: z.number().min(1000).max(30000).optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});
export type DeviceConfig = z.infer<typeof DeviceConfig>;

// Basic Tasmota Response Schema
export const TasmotaResponse = z.object({
  POWER: PowerState.optional(),
  POWER1: PowerState.optional(),
  POWER2: PowerState.optional(),
  POWER3: PowerState.optional(),
  POWER4: PowerState.optional(),
});
export type TasmotaResponse = z.infer<typeof TasmotaResponse>;

// Status Response Schemas
export const StatusSTS = z.object({
  Time: z.string(),
  Uptime: z.string(),
  UptimeSec: z.number(),
  Heap: z.number(),
  SleepMode: z.string(),
  Sleep: z.number(),
  LoadAvg: z.number(),
  MqttCount: z.number(),
  POWER: PowerState.optional(),
  POWER1: PowerState.optional(),
  POWER2: PowerState.optional(),
  POWER3: PowerState.optional(),
  POWER4: PowerState.optional(),
  Dimmer: z.number().optional(),
  Color: z.string().optional(),
  HSBColor: z.string().optional(),
  White: z.number().optional(),
  CT: z.number().optional(),
  Channel: z.array(z.number()).optional(),
}).passthrough(); // Allow additional fields like Wifi
export type StatusSTS = z.infer<typeof StatusSTS>;

export const StatusFWR = z.object({
  Version: z.string(),
  BuildDateTime: z.string(),
  Boot: z.number(),
  Core: z.string(),
  SDK: z.string(),
  CpuFrequency: z.number(),
  Hardware: z.string(),
  CR: z.string().optional(),
}).passthrough();
export type StatusFWR = z.infer<typeof StatusFWR>;

export const StatusLOG = z.object({
  SerialLog: z.number(),
  WebLog: z.number(),
  MqttLog: z.number(),
  SysLog: z.number(),
  LogHost: z.string(),
  LogPort: z.number(),
  SSId: z.array(z.string()),
  TelePeriod: z.number(),
  Resolution: z.string(),
  SetOption: z.array(z.string()),
}).passthrough();
export type StatusLOG = z.infer<typeof StatusLOG>;

export const StatusMEM = z.object({
  ProgramSize: z.number(),
  Free: z.number(),
  Heap: z.number(),
  ProgramFlashSize: z.number(),
  FlashSize: z.number(),
  FlashChipId: z.string(),
  FlashFrequency: z.number(),
  FlashMode: z.union([z.number(), z.string()]), // Can be number or string depending on firmware
  Features: z.array(z.string()),
  Drivers: z.string(),
  Sensors: z.string(),
}).passthrough(); // Allow additional fields like I2CDriver
export type StatusMEM = z.infer<typeof StatusMEM>;

export const StatusNET = z.object({
  Hostname: z.string(),
  IPAddress: z.string(),
  Gateway: z.string(),
  Subnetmask: z.string(),
  // Tasmota uses DNSServer1/DNSServer2 instead of DNSServer
  DNSServer1: z.string().optional(),
  DNSServer2: z.string().optional(),
  DNSServer: z.string().optional(), // Keep for backwards compatibility
  Mac: z.string(),
  Webserver: z.number(),
  WifiConfig: z.number(),
  WifiPower: z.number(),
}).passthrough(); // Allow additional fields like HTTP_API
export type StatusNET = z.infer<typeof StatusNET>;

export const StatusTIM = z.object({
  UTC: z.string(),
  Local: z.string(),
  StartDST: z.string(),
  EndDST: z.string(),
  Timezone: z.string(),
  Sunrise: z.string().optional(),
  Sunset: z.string().optional(),
}).passthrough();
export type StatusTIM = z.infer<typeof StatusTIM>;

export const StatusSNS = z.object({
  Time: z.string(),
  ENERGY: z.object({
    TotalStartTime: z.string(),
    Total: z.number(),
    Yesterday: z.number(),
    Today: z.number(),
    Power: z.number(),
    ApparentPower: z.number(),
    ReactivePower: z.number(),
    Factor: z.number(),
    Voltage: z.number(),
    Current: z.number(),
  }).optional(),
  Temperature: z.number().optional(),
  Humidity: z.number().optional(),
  Pressure: z.number().optional(),
}).passthrough();
export type StatusSNS = z.infer<typeof StatusSNS>;

// Complete Status Response
export const StatusResponse = z.object({
  Status: z.object({
    Module: z.number(),
    DeviceName: z.string(),
    FriendlyName: z.array(z.string()),
    Topic: z.string(),
    ButtonTopic: z.string(),
    Power: z.number(),
    PowerOnState: z.number(),
    LedState: z.number(),
    LedMask: z.string(),
    SaveData: z.number(),
    SaveState: z.number(),
    SwitchTopic: z.string(),
    SwitchMode: z.array(z.number()),
    ButtonRetain: z.number(),
    SwitchRetain: z.number(),
    SensorRetain: z.number(),
    PowerRetain: z.number(),
  }).passthrough(), // Allow additional fields like InfoRetain, StateRetain, StatusRetain
  StatusPRM: z.object({
    Baudrate: z.number(),
    SerialConfig: z.string(),
    GroupTopic: z.string(),
    OtaUrl: z.string(),
    RestartReason: z.string(),
    Uptime: z.string(),
    StartupUTC: z.string(),
    Sleep: z.number(),
    CfgHolder: z.number(),
    BootCount: z.number(),
    BCResetTime: z.string(),
    SaveCount: z.number(),
    SaveAddress: z.string(),
  }).passthrough(),
  StatusFWR,
  StatusLOG,
  StatusMEM,
  StatusNET,
  StatusMQT: z.object({
    MqttHost: z.string(),
    MqttPort: z.number(),
    MqttClientMask: z.string(),
    MqttClient: z.string(),
    MqttUser: z.string(),
    MqttCount: z.number(),
    MAX_PACKET_SIZE: z.number(),
    KEEPALIVE: z.number(),
    SOCKET_TIMEOUT: z.number(),
  }).passthrough(),
  StatusTIM,
  StatusSNS,
  StatusSTS,
}).passthrough(); // Allow additional fields like StatusPTH
export type StatusResponse = z.infer<typeof StatusResponse>;

// Device Information
export const DeviceInfo = z.object({
  hostname: z.string(),
  ipAddress: z.string(),
  macAddress: z.string(),
  friendlyName: z.array(z.string()),
  version: z.string(),
  buildDateTime: z.string(),
  hardware: z.string(),
  uptime: z.string(),
  uptimeSeconds: z.number(),
});
export type DeviceInfo = z.infer<typeof DeviceInfo>;

// Power Status
export const PowerStatus = z.object({
  relayCount: z.number(),
  relays: z.record(z.string(), PowerState),
});
export type PowerStatus = z.infer<typeof PowerStatus>;

// Energy Monitoring
export const EnergyData = z.object({
  totalStartTime: z.string(),
  total: z.number(),
  yesterday: z.number(),
  today: z.number(),
  power: z.number(),
  apparentPower: z.number(),
  reactivePower: z.number(),
  factor: z.number(),
  voltage: z.number(),
  current: z.number(),
});
export type EnergyData = z.infer<typeof EnergyData>;

// Discovery Response
export const DiscoveryDevice = z.object({
  hostname: z.string(),
  ipAddress: z.string(),
  macAddress: z.string(),
  friendlyName: z.string(),
  version: z.string(),
  module: z.string(),
  fallbackTopic: z.string(),
  fullTopic: z.string(),
});
export type DiscoveryDevice = z.infer<typeof DiscoveryDevice>;

// Error Types
export const TasmotaErrorType = z.enum([
  'NETWORK_ERROR',
  'TIMEOUT_ERROR',
  'AUTHENTICATION_ERROR',
  'DEVICE_NOT_FOUND',
  'INVALID_RESPONSE',
  'COMMAND_FAILED',
  'VALIDATION_ERROR',
]);
export type TasmotaErrorType = z.infer<typeof TasmotaErrorType>;

export const TasmotaErrorDetails = z.object({
  type: TasmotaErrorType,
  message: z.string(),
  originalError: z.unknown().optional(),
  deviceHost: z.string().optional(),
  command: z.string().optional(),
  statusCode: z.number().optional(),
});
export type TasmotaErrorDetails = z.infer<typeof TasmotaErrorDetails>;

// SDK Options
export const SDKOptions = z.object({
  defaultTimeout: z.number().min(1000).max(60000).optional().default(5000),
  retryAttempts: z.number().min(0).max(5).optional().default(3),
  retryDelay: z.number().min(100).max(10000).optional().default(1000),
  discoveryTimeout: z.number().min(1000).max(30000).optional().default(10000),
  validateResponses: z.boolean().optional().default(true),
});
export type SDKOptions = z.infer<typeof SDKOptions>;

// Command Response Generic
export const CommandResponse = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: TasmotaErrorDetails.optional(),
});
export type CommandResponse<T = unknown> = Omit<z.infer<typeof CommandResponse>, 'data'> & {
  data?: T;
};
