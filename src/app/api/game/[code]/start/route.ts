import { NextRequest, NextResponse } from 'next/server'
import { getSession, setSession } from '@/lib/game-store'
import { broadcast } from '@/lib/sse-broadcaster'
import { dealInitialCards, toClientState } from '@/lib/game-engine'
import { buildDeck } from '@/lib/game-engine'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const { playerId } = await req.json()

  const session = getSession(code)
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (session.hostId !== playerId) return NextResponse.json({ error: 'Not host' }, { status: 403 })
  if (session.phase !== 'lobby') return NextResponse.json({ error: 'Already started' }, { status: 400 })
  if (session.players.length < 2) return NextResponse.json({ error: 'Need at least 2 players' }, { status: 400 })

  const started = dealInitialCards({
    ...session,
    deck: buildDeck(),
    lastActivity: Date.now(),
  })

  setSession(started)
  broadcast(code, toClientState(started))

  return NextResponse.json({ ok: true })
}
