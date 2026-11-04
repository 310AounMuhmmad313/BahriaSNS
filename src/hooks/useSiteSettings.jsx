import { createContext, useContext, useEffect, useState } from 'react'
import { settingsApi } from '../lib/api'
import { DEFAULT_SETTINGS, getSetting } from '../lib/settings'

const SettingsCtx = createContext(null)

export function SettingsProvider({ children }) {
  const [map, setMap] = useState(null) // null = not loaded yet; defaults are used for rendering

  const refresh = async () => {
    try {
      const settings = await settingsApi.getAll()
      setMap(settings || {})
      return settings || {}
    } catch (error) {
      // Keep the UI usable with built-in defaults if the settings table cannot be read.
      console.error('Could not load website settings:', error)
      setMap({})
      return {}
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <SettingsCtx.Provider value={{ map, refresh, get: (key) => getSetting(map, key) }}>
      {children}
    </SettingsCtx.Provider>
  )
}

export const useSettings = () => useContext(SettingsCtx)
export { DEFAULT_SETTINGS }
