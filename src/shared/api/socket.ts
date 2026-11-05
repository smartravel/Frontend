import { API_URL } from '../config/env'

export type SocketStatus = 'connecting' | 'open' | 'reconnecting'

export type SocketEvent = {
  type: string
  entity?: string
  data?: unknown
}

type SocketHandlers = {
  onEvent: (event: SocketEvent) => void
  onStatus: (status: SocketStatus) => void
}

function socketUrl(path: string) {
  const base = API_URL.startsWith('http') ? API_URL : `${window.location.origin}${API_URL}`
  return `${base.replace(/^http/, 'ws')}${path}`
}

export function connectSocket(path: string, { onEvent, onStatus }: SocketHandlers) {
  let socket: WebSocket | null = null
  let retry = 0
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let closedByUs = false

  function open() {
    onStatus(retry === 0 ? 'connecting' : 'reconnecting')
    socket = new WebSocket(socketUrl(path))

    socket.addEventListener('open', () => {
      retry = 0
      onStatus('open')
    })

    socket.addEventListener('message', (message) => {
      try {
        onEvent(JSON.parse(message.data) as SocketEvent)
      } catch {}
    })

    socket.addEventListener('close', () => {
      if (closedByUs) return
      onStatus('reconnecting')
      const delay = Math.min(1000 * 2 ** retry, 15_000)
      retry += 1
      retryTimer = setTimeout(open, delay)
    })
  }

  open()

  return {
    close() {
      closedByUs = true
      clearTimeout(retryTimer)
      socket?.close()
    },
  }
}
