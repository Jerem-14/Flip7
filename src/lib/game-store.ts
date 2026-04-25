import { GameSession } from './types'

declare global {
  // eslint-disable-next-line no-var
  var __gameStore: Map<string, GameSession> | undefined
}

// Survive Next.js hot-reloads in dev
const store: Map<string, GameSession> = global.__gameStore ?? new Map()
if (!global.__gameStore) {
  global.__gameStore = store

  // Prune sessions inactive for 30 min every 5 min
  setInterval(() => {
    const cutoff = Date.now() - 30 * 60 * 1000
    for (const [code, session] of store) {
      if (session.lastActivity < cutoff) store.delete(code)
    }
  }, 5 * 60 * 1000)
}

export function getSession(code: string): GameSession | undefined {
  return store.get(code)
}

export function setSession(session: GameSession): void {
  store.set(session.code, session)
}

export function deleteSession(code: string): void {
  store.delete(code)
}

function generateCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const part1 = Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join('')
  const part2 = String(Math.floor(1000 + Math.random() * 9000))
  return `${part1}-${part2}`
}

export function createUniqueCode(): string {
  let code = generateCode()
  while (store.has(code)) code = generateCode()
  return code
}
