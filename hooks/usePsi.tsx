import PSI from '@openmined/psi.js/combined_wasm_web'
import {
  Request,
  Response,
  ServerSetup
} from '@openmined/psi.js/implementation/proto/psi_pb'
import { PSILibrary } from '@openmined/psi.js/implementation/psi'
import * as Base64 from 'base64-js'
import * as React from 'react'

import useRandom from './useRandom'

/**
 * Type alias to 'see' that the string should be base64 encoded
 */
type base64 = string

/**
 * Prop types for our APIs
 */
export type InitializedProps = {
  initialized: boolean
}

export type ClientRequestProps = {
  grid: string[]
}

export type ServerResponseProps = {
  request: base64
  grid: string[]
}

export type ComputeIntersectionProps = {
  key: base64
  response: base64
  setup: base64
}

/**
 * Return types for our APIs
 */
export type ClientRequest = {
  contextId: string
  privateKey: base64
  clientRequest: base64
}

export type ServerResponse = {
  serverSetup: base64
  serverResponse: base64
}

export type Intersection = {
  intersection: number[]
}

type PsiProps = {
  initializedPsi: (payload: InitializedProps) => void
}
/**
 * Define our PSI library helpers
 *
 * This file holds our module's PSI WASM instance. There should ever only be
 * a single instance throughout the application lifetime. This is tracked using `psiRef`
 *
 * Initiating the PSI protocol by calling `createClientRequest`
 * generates an contextId which is metadata that will be used to reference the
 * client's private key used in the transaction.
 *
 * Ex: Alice (client) makes a request to John (server).
 * When the John has responded, the Alice will need to
 * lookup up the private key that was used in the original request
 * in order to compute the intersection.
 */
export default function usePsi({ initializedPsi }: PsiProps) {
  const psiRef = React.useRef<PSILibrary>()
  const { getRandomString, getRandomBytes } = useRandom()

  /**
   * Deserializes and returns an instance of a [Client] Request
   */
  const deserializeRequest = React.useCallback(
    (request: base64): Request =>
      psiRef.current!.request.deserializeBinary(Base64.toByteArray(request)),
    []
  )

  /**
   * Deserializes and returns an instance of a [Server] Response
   */
  const deserializeResponse = React.useCallback(
    (response: base64): Response =>
      psiRef.current!.response.deserializeBinary(Base64.toByteArray(response)),
    []
  )

  /**
   * Deserializes and returns an instance of a [Server] ServerSetup
   */
  const deserializeServerSetup = React.useCallback(
    (setup: base64): ServerSetup =>
      psiRef.current!.serverSetup.deserializeBinary(Base64.toByteArray(setup)),
    []
  )

  /**
   * [Acting as a Client] Encrypts a grid and returns the serialized client request
   */
  const createClientRequest = React.useCallback(
    ({ grid }: ClientRequestProps): ClientRequest => {
      const contextId = getRandomString(4)
      // In a typical Browser or NodeJS environment, it is sufficient to
      // call `psiRef.current!.client!.createWithNewKey(true)` as the library will
      // use the appropriate CSPRNG for the given environment. However, we show a more
      // flexible option that will work in the event the environment is not able to
      // automatically use a CSPRNG. We use a wrapper around expo-random to generate a
      // random key for maximum cross-platform compatability.
      const client = psiRef.current!.client!.createFromKey(
        getRandomBytes(32),
        true
      )
      const privateKey = Base64.fromByteArray(client.getPrivateKeyBytes())
      const clientRequest = Base64.fromByteArray(
        client.createRequest(grid).serializeBinary()
      )

      // Always destroy the client instance to prevent WASM heap buildup
      client.delete()

      return {
        contextId,
        privateKey,
        clientRequest
      }
    },
    []
  )

  /**
   * [Acting as a Server] Processes the client request and returns both an
   * encrypted server response and server setup generated from a time-grid
   */
  const createServerResponse = React.useCallback(
    ({ request, grid }: ServerResponseProps): ServerResponse => {
      const clientRequest = deserializeRequest(request)
      // We provide our own random key as the PSI library has issues
      // with react-native
      const server = psiRef.current!.server!.createFromKey(
        getRandomBytes(32),
        true
      )
      const serverResponse = Base64.fromByteArray(
        server.processRequest(clientRequest).serializeBinary()
      )
      const serverSetup = Base64.fromByteArray(
        server
          .createSetupMessage(
            0.001,
            clientRequest.getEncryptedElementsList().length,
            grid,
            psiRef.current!.dataStructure.GCS
          )
          .serializeBinary()
      )

      // Always destroy the server instance to prevent WASM heap buildup
      server.delete()

      return {
        serverResponse,
        serverSetup
      }
    },
    []
  )

  /**
   * [Acting as a Client] Computes the (private) intersection from the
   * server's response and the original client's request
   */
  const computeIntersection = React.useCallback(
    ({ key, response, setup }: ComputeIntersectionProps): Intersection => {
      const privateKey = Base64.toByteArray(key)
      const client = psiRef.current!.client!.createFromKey(privateKey, true)
      const serverResponse = deserializeResponse(response)
      const serverSetup = deserializeServerSetup(setup)
      const intersection = client.getIntersection(serverSetup, serverResponse)

      // Always destroy the client instance to prevent WASM heap buildup
      client.delete()

      intersection.sort((a, b) => a - b)
      return {
        intersection
      }
    },
    []
  )

  /**
   * Effect: On mount, initialize the PSI library and set the ref
   */
  React.useEffect(() => {
    ;(async () => {
      if (!psiRef.current) {
        psiRef.current = await PSI()
        initializedPsi({ initialized: true })
      }
    })()
  }, [])

  return React.useMemo(
    () =>
      ({
        createClientRequest,
        createServerResponse,
        computeIntersection
      } as const),
    [createClientRequest, createServerResponse, computeIntersection]
  )
}
