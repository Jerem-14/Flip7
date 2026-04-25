'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGame } from '@/lib/useGame'
import Lobby from '@/components/Lobby'
import GameBoard from '@/components/GameBoard'

const STORAGE_KEY_ID = (code: string) => `flip7_id_${code}`
const STORAGE_KEY_NICK = (code: string) => `flip7_nick_${code}`

export default function GamePage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()

  const [playerId, setPlayerId] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [nickname, setNickname] = useState('')
  const [needsNickname, setNeedsNickname] = useState(false)

  const { state, sendAction, startGame } = useGame(code, playerId)

  // On mount, try to re-use stored identity
  useEffect(() => {
    const storedId = localStorage.getItem(STORAGE_KEY_ID(code))
    const storedNick = localStorage.getItem(STORAGE_KEY_NICK(code))

    if (storedId) {
      // Try to rejoin silently
      fetch(`/api/game/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: storedId, nickname: storedNick ?? '' }),
      }).then(async r => {
        if (r.ok) {
          const data = await r.json()
          setPlayerId(data.playerId)
        } else {
          setNeedsNickname(true)
        }
      })
    } else {
      setNeedsNickname(true)
    }
  }, [code])

  async function handleJoin() {
    if (!nickname.trim()) return
    setJoining(true)
    setJoinError(null)

    const res = await fetch(`/api/game/${code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: nickname.trim() }),
    })

    if (!res.ok) {
      const { error } = await res.json()
      setJoinError(error ?? 'Failed to join')
      setJoining(false)
      return
    }

    const { playerId: id } = await res.json()
    localStorage.setItem(STORAGE_KEY_ID(code), id)
    localStorage.setItem(STORAGE_KEY_NICK(code), nickname.trim())
    setPlayerId(id)
    setNeedsNickname(false)
    setJoining(false)
  }

  // Nickname entry screen
  if (needsNickname && !playerId) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-black mb-2">Joining {code}</h1>
        <p className="text-gray-400 mb-8">Enter your nickname to join the game</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <input
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            placeholder="Your nickname"
            maxLength={20}
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors"
            autoFocus
          />
          {joinError && <p className="text-red-400 text-sm">{joinError}</p>}
          <button
            onClick={handleJoin}
            disabled={joining || !nickname.trim()}
            className="py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition-colors"
          >
            {joining ? 'Joining…' : 'Join'}
          </button>
          <button
            onClick={() => router.push('/')}
            className="py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            Back to home
          </button>
        </div>
      </div>
    )
  }

  // Loading
  if (!state || !playerId) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Connecting…</div>
      </div>
    )
  }

  if (state.phase === 'lobby') {
    return <Lobby state={state} myId={playerId} onStart={startGame} />
  }

  return <GameBoard state={state} myId={playerId} onAction={sendAction} />
}
