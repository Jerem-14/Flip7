'use client'

import { ClientGameState } from '@/lib/types'
import CardComponent from './Card'

interface Props {
  state: ClientGameState
}

export default function DeckArea({ state }: Props) {
  const currentPlayer = state.players[state.currentPlayerIndex]

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-8">
        {/* Deck pile */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-20 h-28 rounded-xl border-2 border-gray-500 bg-gray-700 flex items-center justify-center text-gray-400 font-bold text-lg shadow-lg">
            {state.deckSize}
          </div>
          <span className="text-xs text-gray-500">deck</span>
        </div>

        {/* Last flipped */}
        <div className="flex flex-col items-center gap-1">
          {state.lastFlippedCard ? (
            <CardComponent card={state.lastFlippedCard} size="lg" />
          ) : (
            <div className="w-20 h-28 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-600 text-xs">
              —
            </div>
          )}
          <span className="text-xs text-gray-500">last flipped</span>
        </div>
      </div>

      {/* Turn indicator */}
      {state.phase === 'playing' && currentPlayer && (
        <p className="text-sm text-yellow-400 font-semibold">
          {currentPlayer.nickname}&apos;s turn
        </p>
      )}
      {state.phase === 'awaiting_target' && (
        <p className="text-sm text-orange-400 font-semibold animate-pulse">
          Choosing target…
        </p>
      )}
      {state.pendingFlipThreeDraws > 0 && (
        <p className="text-sm text-orange-400 font-semibold">
          Flip Three: {state.pendingFlipThreeDraws} draws left
        </p>
      )}
    </div>
  )
}
