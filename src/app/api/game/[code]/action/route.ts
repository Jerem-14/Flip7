import { NextRequest, NextResponse } from 'next/server'
import { getSession, setSession } from '@/lib/game-store'
import { broadcast } from '@/lib/sse-broadcaster'
import { applyAction, toClientState } from '@/lib/game-engine'
import { GameAction } from '@/lib/types'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const { playerId, action }: { playerId: string; action: GameAction } = await req.json()

  const session = getSession(code)
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = applyAction(session, playerId, action)
  setSession(updated)
  broadcast(code, toClientState(updated))

  return NextResponse.json({ ok: true })
}
