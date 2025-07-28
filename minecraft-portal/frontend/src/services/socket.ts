import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

class SocketService {
  private socket: Socket | null = null

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        auth: {
          token: localStorage.getItem('accessToken')
        }
      })

      this.socket.on('connect', () => {
        console.log('Connected to server')
      })

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server')
      })

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error)
      })
    }
    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  joinServerRoom(serverId: string) {
    if (this.socket) {
      this.socket.emit('join-server', serverId)
    }
  }

  leaveServerRoom(serverId: string) {
    if (this.socket) {
      this.socket.emit('leave-server', serverId)
    }
  }

  onStatusUpdate(callback: (data: { serverId: string; status: string }) => void) {
    if (this.socket) {
      this.socket.on('status-update', callback)
    }
  }

  onConsoleOutput(callback: (data: { serverId: string; message: string }) => void) {
    if (this.socket) {
      this.socket.on('console-output', callback)
    }
  }

  offStatusUpdate() {
    if (this.socket) {
      this.socket.off('status-update')
    }
  }

  offConsoleOutput() {
    if (this.socket) {
      this.socket.off('console-output')
    }
  }

  getSocket() {
    return this.socket
  }
}

export const socketService = new SocketService()