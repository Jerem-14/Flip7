'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STORAGE_KEY_ID = (code: string) => `flip7_id_${code}`
const STORAGE_KEY_NICK = (code: string) => `flip7_nick_${code}`

export default function Home() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!nickname.trim()) return
    setCreating(true)
    setError(null)

    const res = await fetch('/api/game/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: nickname.trim() }),
    })

    if (!res.ok) {
      setError('Failed to create game')
      setCreating(false)
      return
    }

    const { code, playerId } = await res.json()
    localStorage.setItem(STORAGE_KEY_ID(code), playerId)
    localStorage.setItem(STORAGE_KEY_NICK(code), nickname.trim())
    router.push(`/game/${code}`)
  }

  function handleJoin() {
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    router.push(`/game/${code}`)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
      <div className="mb-10 text-center">
        <h1 className="text-6xl font-black tracking-tight mb-2">Flip7</h1>
        <p className="text-gray-400 text-lg">Push your luck. Don&apos;t bust.</p>
      </div>

      <div className="w-full max-w-sm space-y-6">
        {/* Create */}
        <div className="bg-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-lg">Create a game</h2>
          <input
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Your nickname"
            maxLength={20}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleCreate}
            disabled={creating || !nickname.trim()}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition-colors"
          >
            {creating ? 'Creating…' : 'Create Game'}
          </button>
        </div>

        <div className="text-center text-gray-600 font-semibold text-sm">— or —</div>

        {/* Join */}
        <div className="bg-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-lg">Join a game</h2>
          <input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            placeholder="Room code (e.g. ABCD-1234)"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white outline-none focus:border-blue-500 transition-colors font-mono uppercase"
          />
          <button
            onClick={handleJoin}
            disabled={!joinCode.trim()}
            className="w-full py-3 bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition-colors"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  )
}
