import useEvent from './useEvent'

/**
 * Create a Message listener that accepts a callback
 */
export default function useMessageEvent(listener: {
  (event: MessageEvent): void
  (this: Window, ev: MessageEvent<any>): any
}) {
  // 'message' is not defined on 'document', but it is
  // there when Andriod uses a WebView.
  // @ts-ignore
  return useEvent('message', listener)
}
