import * as React from 'react'

type EventMap = WindowEventMap | DocumentEventMap

/**
 * Define a generic window listener contructor
 */
export default function useEvent<K extends keyof EventMap>(
  type: K,
  listener: (this: Window | Document, ev: EventMap[K]) => any,
  options?: boolean | AddEventListenerOptions,
  dependencies?: any[]
): void {
  const deps = React.useMemo(() => (dependencies ? dependencies : []), [
    dependencies
  ])

  React.useEffect(() => {
    window.addEventListener(type, listener)
    document.addEventListener(type, listener)
    return () => {
      window.removeEventListener(type, listener)
      document.removeEventListener(type, listener)
    }
  }, [type, listener, options, ...deps])
}
