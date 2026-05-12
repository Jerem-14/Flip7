import { NextRequest } from 'next/server'
import { getSession } from '@/lib/game-store'
import { addClient, removeClient } from '@/lib/sse-broadcaster'
import { toClientState } from '@/lib/game-engine'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const session = await getSession(code)
  if (!session) {
    return new Response('Game not found', { status: 404 })
  }

  const encoder = new TextEncoder()
  let controller: ReadableStreamDefaultController

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl
      addClient(code, controller)
      // Send current state immediately on connect / reconnect
      const payload = `data: ${JSON.stringify(toClientState(session))}\n\n`
      ctrl.enqueue(encoder.encode(payload))
    },
    cancel() {
      removeClient(code, controller)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
