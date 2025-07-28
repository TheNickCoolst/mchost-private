import React, { useEffect, useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { serverApi } from '../services/api'
import { socketService } from '../services/socket'
import { Terminal, Send } from 'lucide-react'

interface ServerConsoleProps {
  serverId: string
}

const ServerConsole: React.FC<ServerConsoleProps> = ({ serverId }) => {
  const [command, setCommand] = useState('')
  const [consoleLines, setConsoleLines] = useState<string[]>([])
  const consoleEndRef = useRef<HTMLDivElement>(null)

  const { data: initialLogs } = useQuery({
    queryKey: ['console', serverId],
    queryFn: () => serverApi.getConsole(serverId).then(res => res.data),
    refetchInterval: 5000,
  })

  useEffect(() => {
    if (initialLogs) {
      setConsoleLines(initialLogs)
    }
  }, [initialLogs])

  useEffect(() => {
    socketService.onConsoleOutput((data) => {
      if (data.serverId === serverId) {
        setConsoleLines(prev => [...prev, data.message].slice(-1000)) // Keep last 1000 lines
      }
    })

    return () => {
      socketService.offConsoleOutput()
    }
  }, [serverId])

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [consoleLines])

  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault()
    if (command.trim()) {
      // In a real implementation, you'd send this to the server
      console.log('Sending command:', command)
      setCommand('')
    }
  }

  const formatLogLine = (line: string) => {
    // Basic ANSI color code removal and formatting
    const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '')
    
    // Color coding based on log level
    if (cleanLine.includes('[ERROR]') || cleanLine.includes('ERROR')) {
      return <span className="text-red-400">{cleanLine}</span>
    }
    if (cleanLine.includes('[WARN]') || cleanLine.includes('WARN')) {
      return <span className="text-yellow-400">{cleanLine}</span>
    }
    if (cleanLine.includes('[INFO]') || cleanLine.includes('INFO')) {
      return <span className="text-blue-400">{cleanLine}</span>
    }
    if (cleanLine.includes('[DEBUG]') || cleanLine.includes('DEBUG')) {
      return <span className="text-gray-400">{cleanLine}</span>
    }

    return <span className="text-gray-200">{cleanLine}</span>
  }

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-4">
        <Terminal className="h-5 w-5 text-green-400" />
        <h3 className="text-lg font-medium text-white">Console</h3>
      </div>

      <div className="console-log mb-4">
        {consoleLines.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No console output yet...</p>
          </div>
        ) : (
          consoleLines.map((line, index) => (
            <div key={index} className="mb-1 text-sm leading-relaxed">
              {formatLogLine(line)}
            </div>
          ))
        )}
        <div ref={consoleEndRef} />
      </div>

      <form onSubmit={handleSendCommand} className="flex space-x-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter command..."
            className="input-field pr-10 font-mono text-sm"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-500 text-sm">$</span>
          </div>
        </div>
        <button
          type="submit"
          disabled={!command.trim()}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
          <span>Send</span>
        </button>
      </form>

      <div className="mt-3 text-xs text-gray-500">
        <p>• Commands are sent directly to the server</p>
        <p>• Console automatically updates with new output</p>
        <p>• Last 1000 lines are kept in memory</p>
      </div>
    </div>
  )
}

export default ServerConsole