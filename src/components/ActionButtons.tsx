'use client'

import { useEffect } from 'react'
import { ClientGameState, GameAction } from '@/lib/types'

interface Props {
  state: ClientGameState
  myId: string
  onAction: (action: GameAction) => void
}

export default function ActionButtons({ state, myId, onAction }: Props) {
  const me = state.players.find(p => p.id === myId)

  const needsTarget =
    state.phase === 'awaiting_target' &&
    state.pendingActionPlayerId === myId

  const otherTargets = needsTarget
    ? state.players.filter(p => p.id !== myId && p.status === 'active')
    : []

  // Auto-resolve when no other active players are available as targets
  useEffect(() => {
    if (needsTarget && otherTargets.length === 0) {
      onAction({ type: 'target_action', targetPlayerId: myId })
    }
  }, [needsTarget, otherTargets.length, myId, onAction])

  if (!me) return null

  const isMyTurn =
    state.players[state.currentPlayerIndex]?.id === myId &&
    state.phase === 'playing' &&
    me.status === 'active'

  if (needsTarget) {
    const targets = otherTargets
    if (targets.length === 0) {
      return <div className="text-sm text-gray-400 animate-pulse">Auto-resolving…</div>
    }

    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-orange-400 font-semibold">
          Choose a target for{' '}
          {state.pendingActionCard?.action === 'freeze' ? 'Freeze' : 'Flip Three'}:
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {targets.map(p => (
            <button
              key={p.id}
              onClick={() => onAction({ type: 'target_action', targetPlayerId: p.id })}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-400 rounded-lg font-semibold transition-colors"
            >
              {p.nickname}
            </button>
          ))}
          {/* Allow self-targeting */}
          <button
            onClick={() => onAction({ type: 'target_action', targetPlayerId: myId })}
            className="px-4 py-2 bg-orange-700 hover:bg-orange-600 rounded-lg font-semibold transition-colors"
          >
            Myself
          </button>
        </div>
      </div>
    )
  }

  if (!isMyTurn) {
    return (
      <div className="flex gap-4">
        <button disabled className="px-8 py-3 bg-gray-700 opacity-40 rounded-xl font-bold text-lg cursor-not-allowed">
          Flip
        </button>
        <button disabled className="px-8 py-3 bg-gray-700 opacity-40 rounded-xl font-bold text-lg cursor-not-allowed">
          Stop
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-4">
      <button
        onClick={() => onAction({ type: 'flip' })}
        className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 rounded-xl font-bold text-lg transition-all"
      >
        Flip
      </button>
      <button
        onClick={() => onAction({ type: 'stop' })}
        className="px-8 py-3 bg-blue-500 hover:bg-blue-400 active:scale-95 rounded-xl font-bold text-lg transition-all"
      >
        Stop
      </button>
    </div>
  )
}
