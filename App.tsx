import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import useMessageEvent from './hooks/useMessageEvent'
import usePostMessage from './hooks/usePostMessage'
import usePsi, {
  ClientRequestProps,
  ComputeIntersectionProps,
  ServerResponseProps
} from './hooks/usePsi'

enum PSI_COMMAND_TYPES {
  CREATE_REQUEST = 'CREATE_REQUEST',
  CREATE_RESPONSE = 'CREATE_RESPONSE',
  COMPUTE_INTERSECTION = 'COMPUTE_INTERSECTION'
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

type COMMAND =
  | PSI_CREATE_REQUEST_COMMAND
  | PSI_CREATE_RESPONSE_COMMAND
  | PSI_COMPUTE_INTERSECTION_COMMAND

export default function App() {
  const [command, setCommand] = React.useState<COMMAND>()

  const {
    createClientRequest,
    createServerResponse,
    computeIntersection
  } = usePsi()
  const { postMessageReactNative } = usePostMessage()

  /**
   * Set up our listener hook that captures messages sent
   * from react-native environments
   */
  useMessageEvent((event: MessageEvent) => {
    try {
      console.log('got message')
      const command = JSON.parse(event.data) as COMMAND
      setCommand(command)
    } catch (err) {
      console.warn('Unable to process message!')
    }
  })

  /**
   * Define our function to send messages back to react-native
   */
  const sendToReact = React.useCallback(function sendToReact<T>(payload: T) {
    console.log('sending to react')
    postMessageReactNative({ message: JSON.stringify(payload) })
  }, [])

  /**
   * Define our handlers for our PSI library
   */
  const handleClientRequest = React.useCallback(
    (command: PSI_CREATE_REQUEST_COMMAND) => {
      const psiPayload = createClientRequest(command.payload)
      sendToReact({ ...psiPayload, id: command.id })
    },
    []
  )
  const handleServerResponse = React.useCallback(
    (command: PSI_CREATE_RESPONSE_COMMAND) => {
      const psiPayload = createServerResponse(command.payload)
      sendToReact({ ...psiPayload, id: command.id })
    },
    []
  )
  const handleGetIntersection = React.useCallback(
    (command: PSI_COMPUTE_INTERSECTION_COMMAND) => {
      const psiPayload = computeIntersection(command.payload)
      sendToReact({ ...psiPayload, id: command.id })
    },
    []
  )

  /**
   * Effect: When a command is received, dispatch the corresponding
   * PSI request
   */
  React.useEffect(() => {
    if (command) {
      console.log('got command', command.type)
      switch (command.type) {
        case PSI_COMMAND_TYPES.CREATE_REQUEST:
          return handleClientRequest(command)
        case PSI_COMMAND_TYPES.CREATE_RESPONSE:
          return handleServerResponse(command)
        case PSI_COMMAND_TYPES.COMPUTE_INTERSECTION:
          return handleGetIntersection(command)
        default:
          console.warn('Command not found!')
          break
      }
    }
  }, [command, createClientRequest, createServerResponse, computeIntersection])

  return (
    <View style={styles.container}>
      <Text>
        PriCal's static site for providing WASM accelerated PSI capability
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
