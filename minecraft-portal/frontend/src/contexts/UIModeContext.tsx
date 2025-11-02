import React, { createContext, useContext, useState, useEffect } from 'react'

export type UIMode = 'simple' | 'elite'

interface UIModeContextType {
  mode: UIMode
  setMode: (mode: UIMode) => void
  isSimpleMode: boolean
  isEliteMode: boolean
}

const UIModeContext = createContext<UIModeContextType | undefined>(undefined)

export const UIModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<UIMode>(() => {
    const saved = localStorage.getItem('uiMode')
    return (saved as UIMode) || 'simple'
  })

  const setMode = (newMode: UIMode) => {
    setModeState(newMode)
    localStorage.setItem('uiMode', newMode)
  }

  const value = {
    mode,
    setMode,
    isSimpleMode: mode === 'simple',
    isEliteMode: mode === 'elite',
  }

  return <UIModeContext.Provider value={value}>{children}</UIModeContext.Provider>
}

export const useUIMode = () => {
  const context = useContext(UIModeContext)
  if (context === undefined) {
    throw new Error('useUIMode must be used within a UIModeProvider')
  }
  return context
}
