'use client'

import { ClientGameState, Player } from '@/lib/types'
import CardComponent from './Card'

interface Props {
  state: ClientGameState
  myId: string
}

const statusBadge: Record<string, string> = {
  active: 'bg-emerald-500',
  stopped: 'bg-blue-500',
  busted: 'bg-red-500',
  frozen: 'bg-cyan-500',
}

const statusLabel: Record<string, string> = {
  active: 'playing',
  stopped: 'stopped',
  busted: 'bust!',
  frozen: 'frozen',
}

function OtherPlayer({
  player,
  isCurrentTurn,
}: {
  player: Player
  isCurrentTurn: boolean
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
        isCurrentTurn ? 'ring-2 ring-yellow-400 bg-gray-700' : 'bg-gray-800'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm text-white truncate max-w-24">{player.nickname}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold ${statusBadge[player.status]}`}>
          {statusLabel[player.status]}
        </span>
      </div>

      <div className="flex flex-wrap gap-1 justify-center">
        {player.cards.length === 0 ? (
          <span className="text-xs text-gray-500">no cards</span>
        ) : (
          player.cards.map(c => <CardComponent key={c.id} card={c} size="sm" />)
        )}
      </div>

      <div className="text-xs text-gray-400">
        Score: <span className="font-bold text-white">{player.totalScore}</span>
      </div>
    </div>
  )
}

export default function OtherPlayers({ state, myId }: Props) {
  const others = state.players.filter(p => p.id !== myId)
  if (others.length === 0) return null

  return (
    <div className="flex flex-wrap gap-3 justify-center p-4">
      {others.map((p) => {
        const globalIdx = state.players.findIndex(pl => pl.id === p.id)
        return (
          <OtherPlayer
            key={p.id}
            player={p}
            isCurrentTurn={globalIdx === state.currentPlayerIndex && state.phase === 'playing'}
          />
        )
      })}
    </div>
  )
}
