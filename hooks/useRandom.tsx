import * as Random from 'expo-random'
import * as React from 'react'

export default function useRandom() {
  /**
   * Convert a decimal number to hex
   * Ex: i.e. 0-255 -> '00'-'ff'
   * @param dec The decimal number to convert
   */
  const dec2hex = (dec: number) => {
    return dec < 10 ? '0' + String(dec) : dec.toString(16)
  }

  /**
   * Generates completely random bytes using native implementations
   *
   * @param byteCount Number of random bytes
   */
  const getRandomBytes = (byteCount: number): Uint8Array => {
    return Random.getRandomBytes(byteCount)
  }

  /**
   * Generates completely random bytes using native implementations (async)
   *
   * @param byteCount Number of random bytes
   */
  const getRandomBytesAsync = async (
    byteCount: number
  ): Promise<Uint8Array> => {
    return await Random.getRandomBytesAsync(byteCount)
  }

  /**
   * Generate a random string from the specified number of bytes
   *
   * @param byteCount Number of random bytes for returned string
   */
  const getRandomString = (byteCount: number): string => {
    const byteArray = getRandomBytes(byteCount)
    return Array.from(byteArray, dec2hex).join('')
  }

  /**
   * Generate a random string from the specified number of bytes (async)
   *
   * @param byteCount Number of random bytes for returned string
   */
  const getRandomStringAsync = async (byteCount: number): Promise<string> => {
    const byteArray = await getRandomBytesAsync(byteCount)
    return Array.from(byteArray, dec2hex).join('')
  }

  /**
   * Fills an input array with random bytes
   *
   * @param array Input array to fill with random values
   */
  const getRandomValues = (array: Uint8Array): void => {
    array = Random.getRandomBytes(array.length)
  }

  /**
   * Fills an input array with random bytes (async)
   *
   * @param array Input array to fill with random values
   */
  const getRandomValuesAsync = async (array: Uint8Array): Promise<void> => {
    array = await Random.getRandomBytesAsync(array.length)
  }

  /**
   * Here, we define a polyfill for `crypto.getRandomValues` which is
   * used for some modules such as `@openmined/psi.js`
   */
  if (typeof crypto !== 'object') {
    // @ts-ignore
    crypto = {}
  }

  if (typeof crypto.getRandomValues !== 'function') {
    // @ts-ignore
    crypto.getRandomValues = getRandomValues
  }

  return React.useMemo(
    () =>
      ({
        getRandomBytes,
        getRandomBytesAsync,
        getRandomString,
        getRandomStringAsync,
        getRandomValues,
        getRandomValuesAsync
      } as const),
    []
  )
}
