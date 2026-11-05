import { useCallback, useEffect, useRef, useState } from 'react'
import { connectSocket, type SocketEvent, type SocketStatus } from '../../../shared/api'

type Listener = (event: SocketEvent) => void

export function useTripSocket(tripId: string, enabled: boolean) {
  const [status, setStatus] = useState<SocketStatus>('connecting')
  const listeners = useRef(new Set<Listener>())

  useEffect(() => {
    if (!enabled) return
    const connection = connectSocket(`/ws/trips/${tripId}`, {
      onStatus: setStatus,
      onEvent: (event) => listeners.current.forEach((listener) => listener(event)),
    })
    return () => connection.close()
  }, [tripId, enabled])

  const subscribe = useCallback((listener: Listener) => {
    listeners.current.add(listener)
    return () => {
      listeners.current.delete(listener)
    }
  }, [])

  return { status, subscribe }
}
