import { GameSession } from './types'

// ── Redis client (Upstash, only when env vars are present) ────────────────────

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Redis } = require('@upstash/redis')
  return new Redis({ url, token }) as import('@upstash/redis').Redis
}

const SESSION_TTL = 60 * 60 // 1 hour
const KEY = (code: string) => `game:${code}`

// ── In-memory fallback for local dev ─────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __gameStore: Map<string, GameSession> | undefined
}

const mem: Map<string, GameSession> = global.__gameStore ?? new Map()
if (!global.__gameStore) {
  global.__gameStore = mem
  setInterval(() => {
    const cutoff = Date.now() - SESSION_TTL * 1000
    for (const [code, s] of mem) if (s.lastActivity < cutoff) mem.delete(code)
  }, 5 * 60 * 1000)
}

// ── Store API ─────────────────────────────────────────────────────────────────

export async function getSession(code: string): Promise<GameSession | undefined> {
  const redis = getRedis()
  if (redis) return (await redis.get<GameSession>(KEY(code))) ?? undefined
  return mem.get(code)
}

export async function setSession(session: GameSession): Promise<void> {
  const redis = getRedis()
  if (redis) { await redis.set(KEY(session.code), session, { ex: SESSION_TTL }); return }
  mem.set(session.code, session)
}

export async function deleteSession(code: string): Promise<void> {
  const redis = getRedis()
  if (redis) { await redis.del(KEY(code)); return }
  mem.delete(code)
}

// ── Code generation ───────────────────────────────────────────────────────────

function generateCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const part1 = Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join('')
  const part2 = String(Math.floor(1000 + Math.random() * 9000))
  return `${part1}-${part2}`
}

export async function createUniqueCode(): Promise<string> {
  const redis = getRedis()
  let code = generateCode()
  if (redis) {
    while (await redis.exists(KEY(code))) code = generateCode()
  } else {
    while (mem.has(code)) code = generateCode()
  }
  return code
}
