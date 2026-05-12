import { NextRequest, NextResponse } from 'next/server'
import { getSession, setSession } from '@/lib/game-store'
import { broadcast } from '@/lib/sse-broadcaster'
import { toClientState } from '@/lib/game-engine'
import { randomUUID } from 'crypto'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const { nickname, playerId: existingId } = await req.json()

  const session = await getSession(code)
  if (!session) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  // Reconnect: player already exists
  if (existingId) {
    const existing = session.players.find(p => p.id === existingId)
    if (existing) {
      return NextResponse.json({ playerId: existingId })
    }
  }

  if (session.phase !== 'lobby') {
    return NextResponse.json({ error: 'Game already started' }, { status: 400 })
  }

  if (session.players.length >= 10) {
    return NextResponse.json({ error: 'Game is full' }, { status: 400 })
  }

  if (!nickname?.trim()) {
    return NextResponse.json({ error: 'Nickname required' }, { status: 400 })
  }

  const playerId = randomUUID()
  const updated = {
    ...session,
    lastActivity: Date.now(),
    players: [
      ...session.players,
      {
        id: playerId,
        nickname: nickname.trim(),
        cards: [],
        status: 'active' as const,
        hasSecondChance: false,
        roundScore: 0,
        totalScore: 0,
      },
    ],
  }

  await setSession(updated)
  broadcast(code, toClientState(updated))

  return NextResponse.json({ playerId })
}
