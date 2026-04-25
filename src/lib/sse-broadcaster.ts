import { ClientGameState } from './types'

type Controller = ReadableStreamDefaultController

declare global {
  // eslint-disable-next-line no-var
  var __sseBroadcaster: Map<string, Set<Controller>> | undefined
}

const registry: Map<string, Set<Controller>> =
  global.__sseBroadcaster ?? new Map()
if (!global.__sseBroadcaster) global.__sseBroadcaster = registry

export function addClient(code: string, controller: Controller): void {
  if (!registry.has(code)) registry.set(code, new Set())
  registry.get(code)!.add(controller)
}

export function removeClient(code: string, controller: Controller): void {
  registry.get(code)?.delete(controller)
}

export function broadcast(code: string, state: ClientGameState): void {
  const clients = registry.get(code)
  if (!clients) return
  const payload = `data: ${JSON.stringify(state)}\n\n`
  const encoder = new TextEncoder()
  for (const ctrl of clients) {
    try {
      ctrl.enqueue(encoder.encode(payload))
    } catch {
      clients.delete(ctrl)
    }
  }
}
