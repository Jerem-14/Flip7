'use client'

import { ClientGameState, GameAction } from '@/lib/types'
import { calculateRoundScore } from '@/lib/game-engine'
import OtherPlayers from './OtherPlayers'
import DeckArea from './DeckArea'
import CardComponent from './Card'
import ActionButtons from './ActionButtons'
import ScoreBoard from './ScoreBoard'

interface Props {
  state: ClientGameState
  myId: string
  onAction: (action: GameAction) => void
}

export default function GameBoard({ state, myId, onAction }: Props) {
  const me = state.players.find(p => p.id === myId)
  const liveRoundScore = me ? (me.status === 'busted' ? 0 : calculateRoundScore(me)) : 0

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <span className="font-mono text-sm text-gray-400">{state.code}</span>
        <span className="font-bold text-sm">Round {state.roundNumber}</span>
        <span className="text-sm text-gray-400">
          {me?.nickname} — <span className="text-white font-bold">{me?.totalScore ?? 0} pts</span>
        </span>
      </div>

      {/* Other players */}
      <div className="border-b border-gray-700 bg-gray-850">
        <OtherPlayers state={state} myId={myId} />
      </div>

      {/* Deck area */}
      <div className="flex-1 flex items-center justify-center py-6">
        <DeckArea state={state} />
      </div>

      {/* My hand */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        {me && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-gray-400">Your hand</span>
              <span className="text-sm text-yellow-300 font-bold">{liveRoundScore} pts</span>
              {me.status === 'busted' && (
                <span className="text-xs bg-red-600 px-2 py-0.5 rounded-full font-bold">BUST</span>
              )}
              {me.status === 'stopped' && (
                <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full font-bold">STOPPED</span>
              )}
              {me.status === 'frozen' && (
                <span className="text-xs bg-cyan-600 px-2 py-0.5 rounded-full font-bold">FROZEN</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-2 min-h-10">
              {me.cards.length === 0 ? (
                <span className="text-sm text-gray-500 italic">No cards yet</span>
              ) : (
                me.cards.map(c => <CardComponent key={c.id} card={c} size="lg" />)
              )}
            </div>

            {state.lastDiscard && state.lastDiscard.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-500">discarded:</span>
                {state.lastDiscard.map(c => (
                  <div key={c.id} className="relative opacity-40 grayscale">
                    <CardComponent card={c} size="lg" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-red-400 text-3xl font-black leading-none">✕</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-center">
              <ActionButtons state={state} myId={myId} onAction={onAction} />
            </div>
          </>
        )}
      </div>

      {/* Scoreboard overlay */}
      <ScoreBoard state={state} myId={myId} onAction={onAction} />
    </div>
  )
}
