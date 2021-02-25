import * as React from 'react'

/**
 * Define a generic window listener contructor
 */
export default function useWindowEvent<K extends keyof WindowEventMap>(
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions,
  dependencies?: any[]
): void {
  const deps = React.useMemo(() => (dependencies ? dependencies : []), [
    dependencies
  ])

  React.useEffect(() => {
    window.addEventListener(type, listener)
    return () => window.removeEventListener(type, listener)
  }, [type, listener, options, ...deps])
}
