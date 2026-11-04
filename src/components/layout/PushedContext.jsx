import { createContext, useState } from 'react'

/** Shared flag: is the fixed urgent banner currently visible (navbar shifts down). */
export const PushedContext = createContext({ pushed: false, setPushed: () => {} })

export function PushedProvider({ children }) {
  const [pushed, setPushed] = useState(false)
  return <PushedContext.Provider value={{ pushed, setPushed }}>{children}</PushedContext.Provider>
}
