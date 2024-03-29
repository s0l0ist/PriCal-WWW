import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import useMessageEvent from './hooks/useMessageEvent'
import usePostMessage from './hooks/usePostMessage'
import usePsi, {
  InitializedProps,
  ClientRequestProps,
  ComputeIntersectionProps,
  ServerResponseProps
} from './hooks/usePsi'

export enum PSI_COMMAND_TYPES {
  INITIALIZED = 'INITIALIZED',
  CREATE_REQUEST = 'CREATE_REQUEST',
  CREATE_RESPONSE = 'CREATE_RESPONSE',
  COMPUTE_INTERSECTION = 'COMPUTE_INTERSECTION'
}

export type PSI_INITIALIZED_COMMAND = {
  id: string
  type: PSI_COMMAND_TYPES.INITIALIZED
  payload: InitializedProps
}

type PSI_CREATE_REQUEST_COMMAND = {
  id: string
  type: PSI_COMMAND_TYPES.CREATE_REQUEST
  payload: ClientRequestProps
}

type PSI_CREATE_RESPONSE_COMMAND = {
  id: string
  type: PSI_COMMAND_TYPES.CREATE_RESPONSE
  payload: ServerResponseProps
}

type PSI_COMPUTE_INTERSECTION_COMMAND = {
  id: string
  type: PSI_COMMAND_TYPES.COMPUTE_INTERSECTION
  payload: ComputeIntersectionProps
}

type UNKNOWN = any

type COMMAND =
  | PSI_INITIALIZED_COMMAND
  | PSI_CREATE_REQUEST_COMMAND
  | PSI_CREATE_RESPONSE_COMMAND
  | PSI_COMPUTE_INTERSECTION_COMMAND
  | UNKNOWN

export default function App() {
  const [command, setCommand] = React.useState<COMMAND>()
  const { postMessage } = usePostMessage()

  /**
   * Define our function to send messages back to react-native
   */
  const sendMessage = React.useCallback(function sendMessage<T>(payload: T) {
    postMessage({ message: JSON.stringify(payload) })
  }, [])

  /**
   * Initialize our PSI library. We provide a prop which sends a message
   * to the WebView in react-native that the PSI library has initialized.
   *
   * If omitted, we risk the mobile app sending PSI commands when the library
   * was not initialized.
   */
  const {
    createClientRequest,
    createServerResponse,
    computeIntersection
  } = usePsi({ initializedPsi: payload => sendMessage(payload) })

  /**
   * Define our handlers for our PSI library
   */
  const handleClientRequest = React.useCallback(
    (command: PSI_CREATE_REQUEST_COMMAND) => {
      const psiPayload = createClientRequest(command.payload)
      sendMessage({ ...psiPayload, id: command.id })
    },
    []
  )
  const handleServerResponse = React.useCallback(
    (command: PSI_CREATE_RESPONSE_COMMAND) => {
      const psiPayload = createServerResponse(command.payload)
      sendMessage({ ...psiPayload, id: command.id })
    },
    []
  )
  const handleGetIntersection = React.useCallback(
    (command: PSI_COMPUTE_INTERSECTION_COMMAND) => {
      const psiPayload = computeIntersection(command.payload)
      sendMessage({ ...psiPayload, id: command.id })
    },
    []
  )
  const handleUnknownCommand = React.useCallback((command: UNKNOWN) => {
    sendMessage({ ...command, error: 'Unknown command' })
  }, [])

  /**
   * Set up our listener hook that captures messages sent
   * from react-native environments
   */
  useMessageEvent((event: MessageEvent) => {
    try {
      const command = JSON.parse(event.data) as COMMAND
      setCommand(command)
    } catch (err) {
      // Errors will typically happen when debugging
      // as react-devtools sends messages that aren't JSON
      sendMessage({ err })
    }
  })

  /**
   * Effect: When a command is received, dispatch the corresponding
   * PSI request
   */
  React.useEffect(() => {
    if (command) {
      switch (command.type) {
        case PSI_COMMAND_TYPES.CREATE_REQUEST:
          return handleClientRequest(command)
        case PSI_COMMAND_TYPES.CREATE_RESPONSE:
          return handleServerResponse(command)
        case PSI_COMMAND_TYPES.COMPUTE_INTERSECTION:
          return handleGetIntersection(command)
        default:
          return handleUnknownCommand(command)
      }
    }
  }, [
    command,
    handleClientRequest,
    handleServerResponse,
    handleGetIntersection,
    handleUnknownCommand
  ])

  /**
   * Effect: send any uncaught errors back to the client
   */
  React.useEffect(() => {
    window.onerror = function (message, source, lineno, colno, error) {
      sendMessage({ message, source, lineno, colno, error })
    }
  }, [])

  return (
    <View style={styles.container}>
      <Text>
        PriCal's static site for providing WASM accelerated PSI capability.
      </Text>
      <StatusBar style="auto" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  }
})
