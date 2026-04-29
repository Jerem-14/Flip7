'use client'

import { useRouter } from 'next/navigation'
import { ClientGameState, GameAction } from '@/lib/types'

interface Props {
  state: ClientGameState
  myId: string
  onAction: (action: GameAction) => void
}

export default function ScoreBoard({ state, myId, onAction }: Props) {
  const router = useRouter()
  const isRoundEnd = state.phase === 'round_end'
  const isGameEnd = state.phase === 'game_end'

  if (!isRoundEnd && !isGameEnd) return null

  const sorted = [...state.players].sort((a, b) => b.totalScore - a.totalScore)
  const winner = state.players.find(p => p.id === state.winnerId)
  const isHost = state.hostId === myId

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-black text-center mb-1">
          {isGameEnd ? '🏆 Game Over!' : `Round ${state.roundNumber} Results`}
        </h2>
        {isGameEnd && winner && (
          <p className="text-center text-emerald-400 font-bold mb-4">
            {winner.nickname} wins!
          </p>
        )}

        <table className="w-full mb-6 text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="text-left py-2">Player</th>
              <th className="text-right py-2">Round</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr key={p.id} className="border-b border-gray-700/50">
                <td className="py-2 flex items-center gap-2">
                  {i === 0 && isGameEnd && <span>🥇</span>}
                  {i === 1 && isGameEnd && <span>🥈</span>}
                  {i === 2 && isGameEnd && <span>🥉</span>}
                  {i >= 3 && isGameEnd && <span>💩</span>}
                  <span className={p.id === myId ? 'font-bold text-white' : 'text-gray-300'}>
                    {p.nickname}
                  </span>
                  {p.status === 'busted' && (
                    <span className="text-xs text-red-400">(bust)</span>
                  )}
                </td>
                <td className="text-right py-2 text-gray-300">{p.roundScore}</td>
                <td className="text-right py-2 font-bold text-white">{p.totalScore}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {isRoundEnd && isHost && (
          <button
            onClick={() => onAction({ type: 'next_round' })}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 rounded-xl font-bold text-lg transition-colors"
          >
            Next Round
          </button>
        )}
        {isRoundEnd && !isHost && (
          <p className="text-center text-gray-500 text-sm">Waiting for host to start next round…</p>
        )}

        {isGameEnd && (
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/')}
              className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 rounded-xl font-bold text-lg transition-colors"
            >
              Home
            </button>
            {isHost ? (
              <button
                onClick={() => onAction({ type: 'restart_game' })}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 rounded-xl font-bold text-lg transition-colors"
              >
                Play Again
              </button>
            ) : (
              <div className="flex-1 py-3 rounded-xl bg-gray-700 text-center font-bold text-lg text-gray-500">
                Play Again
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
