import React from 'react'

declare global {
  interface Window {
    ReactNativeWebView: {
      postMessage: (data: string) => void
    }
  }
}

/**
 * Define a hook that provides functions to send messages
 * to the react-native application -or- the local window for debugging
 */
export default function usePostMessage() {
  const postMessage = React.useCallback(
    ({
      message,
      targetOrigin,
      transfer
    }: {
      message: string
      targetOrigin: string
      transfer?: Transferable[]
    }) => window.postMessage(message, targetOrigin, transfer),
    []
  )
  const postMessageReactNative = React.useCallback(
    ({ message }: { message: string }) => {
      if (!window.ReactNativeWebView) {
        console.warn('window.ReactNativeWebView not available')
        return
      }
      return window.ReactNativeWebView.postMessage(message)
    },
    []
  )
  return React.useMemo(
    () =>
      ({
        postMessage,
        postMessageReactNative
      } as const),
    [postMessage, postMessageReactNative]
  )
}