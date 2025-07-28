export interface ServerInstance {
  id: string
  name: string
  description?: string
  nest: string
  egg: string
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error'
  resourceLimits: ResourceLimits
  envVars: { [key: string]: string }
  wingsNodeId?: string
  wingsUuid?: string
  port: number
  gameVersion?: string
  createdAt: string
  updatedAt: string
  owner: {
    id: string
    username: string
  }
  ownerId: string
}

export interface ResourceLimits {
  memory: number
  cpu: number
  disk: number
  swap: number
  io: number
}

export interface CreateServerRequest {
  name: string
  description?: string
  nest: string
  egg: string
  resourceLimits: ResourceLimits
  envVars?: { [key: string]: string }
  port?: number
  gameVersion?: string
}

export interface UpdateServerRequest {
  name?: string
  description?: string
  resourceLimits?: Partial<ResourceLimits>
  envVars?: { [key: string]: string }
}

export interface ServerActionRequest {
  action: 'start' | 'stop' | 'restart' | 'kill'
}

export interface LogEntry {
  id: string
  message: string
  level: 'info' | 'warn' | 'error' | 'debug'
  source?: string
  timestamp: string
  serverId: string
}

export interface ServerStats {
  memory_bytes: number
  memory_limit_bytes: number
  cpu_absolute: number
  network: {
    rx_bytes: number
    tx_bytes: number
  }
  state: string
}