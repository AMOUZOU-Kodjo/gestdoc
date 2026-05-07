import { useEffect, useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export function useWakeBackend() {
  const woken = useRef(false)
  useEffect(() => {
    if (woken.current) return
    woken.current = true
    fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(30000) }).catch(() => {})
  }, [])
}