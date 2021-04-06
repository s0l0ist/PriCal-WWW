import React from 'react'

/**
 * We define the window global to have the additional
 * `ReactNativeWebView` property that is injected
 * when the web app is loaded in a react-native (expo)
 * environment
 */
declare global {
  interface Window {
    ReactNativeWebView: {
      postMessage: (data: string) => void
    }
  }
}

/**
 * Define a hook that provides functions to posts messages
 * to the react-native application -or- the local window for debugging
 */
export default function usePostMessage() {
  const postMessage = React.useCallback(
    ({
      message,
      targetOrigin = '*',
      transfer
    }: {
      message: string
      targetOrigin?: string
      transfer?: Transferable[]
    }) => {
      // If rendered in a React-native WebView, this function is added
      // to the window and we should use it.
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(message)
      }
      window.postMessage(message, targetOrigin, transfer)
    },
    []
  )

  return React.useMemo(
    () =>
      ({
        postMessage
      } as const),
    [postMessage]
  )
}
