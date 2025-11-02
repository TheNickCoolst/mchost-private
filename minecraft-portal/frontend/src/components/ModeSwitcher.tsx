import React from 'react'
import { useUIMode } from '../contexts/UIModeContext'
import { Sparkles, Zap } from 'lucide-react'

const ModeSwitcher: React.FC = () => {
  const { mode, setMode, isSimpleMode } = useUIMode()

  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-1 inline-flex border border-purple-500/20">
      <button
        onClick={() => setMode('simple')}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200
          ${isSimpleMode
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50'
            : 'text-gray-400 hover:text-white'
          }
        `}
      >
        <Sparkles className="h-4 w-4" />
        <span className="font-medium">🎮 Einfach</span>
      </button>
      <button
        onClick={() => setMode('elite')}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200
          ${!isSimpleMode
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50'
            : 'text-gray-400 hover:text-white'
          }
        `}
      >
        <Zap className="h-4 w-4" />
        <span className="font-medium">⚡ Elite</span>
      </button>
    </div>
  )
}

export default ModeSwitcher
