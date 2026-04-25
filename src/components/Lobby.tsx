'use client'

import { ClientGameState } from '@/lib/types'

interface Props {
  state: ClientGameState
  myId: string
  onStart: () => void
}

export default function Lobby({ state, myId, onStart }: Props) {
  const isHost = state.hostId === myId
  const gameUrl = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-black mb-2 tracking-tight">Flip7</h1>
      <p className="text-gray-400 mb-8">Waiting for players…</p>

      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mb-6">
        <p className="text-sm text-gray-400 mb-1">Room code</p>
        <p className="text-3xl font-mono font-bold tracking-widest text-white mb-4">{state.code}</p>

        <p className="text-sm text-gray-400 mb-1">Share this link</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={gameUrl}
            className="flex-1 bg-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 outline-none"
          />
          <button
            onClick={() => navigator.clipboard.writeText(gameUrl)}
            className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm transition-colors"
          >
            Copy
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mb-6">
        <p className="text-sm text-gray-400 mb-3">Players ({state.players.length}/10)</p>
        <ul className="space-y-2">
          {state.players.map(p => (
            <li key={p.id} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className={p.id === myId ? 'font-bold' : ''}>{p.nickname}</span>
              {p.id === state.hostId && (
                <span className="text-xs text-amber-400 ml-auto">host</span>
              )}
              {p.id === myId && p.id !== state.hostId && (
                <span className="text-xs text-gray-500 ml-auto">you</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {isHost ? (
        <button
          onClick={onStart}
          disabled={state.players.length < 2}
          className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition-colors"
        >
          Start Game
        </button>
      ) : (
        <p className="text-gray-500 text-sm">Waiting for host to start…</p>
      )}
    </div>
  )
}
