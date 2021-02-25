import useWindowEvent from './useWindowEvent'

/**
 * Create a Message listener that accepts a callback
 */
export default function useMessageEvent(listener: {
  (event: MessageEvent): void
  (this: Window, ev: MessageEvent<any>): any
}) {
  useWindowEvent('message', listener)
}
