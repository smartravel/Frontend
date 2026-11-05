import { useEffect, useState } from 'react'

const secondsLeft = (until: number | null) =>
  until === null ? 0 : Math.max(0, Math.ceil((until - Date.now()) / 1000))

export function useCountdown(until: number | null) {
  const [left, setLeft] = useState(() => secondsLeft(until))
  const [prevUntil, setPrevUntil] = useState(until)

  if (prevUntil !== until) {
    setPrevUntil(until)
    setLeft(secondsLeft(until))
  }

  useEffect(() => {
    if (until === null) return
    const timer = setInterval(() => {
      const next = secondsLeft(until)
      setLeft(next)
      if (next === 0) clearInterval(timer)
    }, 1000)
    return () => clearInterval(timer)
  }, [until])

  return left
}

export function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}
