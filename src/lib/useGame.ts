'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ClientGameState, GameAction } from './types'

export function useGame(code: string, playerId: string | null) {
  const [state, setState] = useState<ClientGameState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!code || !playerId) return

    function connect() {
      const es = new EventSource(`/api/game/${code}/stream`)
      esRef.current = es

      es.onmessage = e => {
        try {
          setState(JSON.parse(e.data) as ClientGameState)
          setError(null)
        } catch {
          // ignore parse errors
        }
      }

      es.onerror = () => {
        es.close()
        // EventSource auto-reconnects; we close and let browser handle it
        // Reconnect manually after a short delay to re-register
        setTimeout(connect, 2000)
      }
    }

    connect()

    return () => {
      esRef.current?.close()
    }
  }, [code, playerId])

  const sendAction = useCallback(
    async (action: GameAction) => {
      if (!playerId) return
      await fetch(`/api/game/${code}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, action }),
      })
    },
    [code, playerId]
  )

  const startGame = useCallback(async () => {
    if (!playerId) return
    await fetch(`/api/game/${code}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId }),
    })
  }, [code, playerId])

  return { state, error, sendAction, startGame }
}
