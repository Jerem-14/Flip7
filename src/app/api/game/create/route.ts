import { NextRequest, NextResponse } from 'next/server'
import { createUniqueCode, setSession } from '@/lib/game-store'
import { buildDeck, dealInitialCards } from '@/lib/game-engine'
import { GameSession } from '@/lib/types'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const { nickname } = await req.json()
  if (!nickname?.trim()) {
    return NextResponse.json({ error: 'Nickname required' }, { status: 400 })
  }

  const code = createUniqueCode()
  const playerId = randomUUID()

  const session: GameSession = {
    code,
    hostId: playerId,
    players: [
      {
        id: playerId,
        nickname: nickname.trim(),
        cards: [],
        status: 'active',
        hasSecondChance: false,
        roundScore: 0,
        totalScore: 0,
      },
    ],
    deck: buildDeck(),
    phase: 'lobby',
    currentPlayerIndex: 0,
    roundNumber: 1,
    dealerIndex: 0,
    pendingFlipThreeDraws: 0,
    lastActivity: Date.now(),
  }

  setSession(session)
  return NextResponse.json({ code, playerId })
}
