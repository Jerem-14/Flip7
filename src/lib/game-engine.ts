import { Card, GameSession, Player, ClientGameState, GameAction, ModifierValue } from './types'

// ── Deck ──────────────────────────────────────────────────────────────────────

export function buildDeck(): Card[] {
  const cards: Card[] = []
  let idCounter = 0
  const id = () => String(idCounter++)

  // Number cards: n copies of value n, except 0 and 1 get 1 copy each
  for (let v = 0; v <= 12; v++) {
    const count = v === 0 ? 1 : v === 1 ? 1 : v
    for (let i = 0; i < count; i++) {
      cards.push({ id: id(), type: 'number', value: v })
    }
  }

  // Modifier cards
  const modifiers: ModifierValue[] = ['+2', '+4', '+6', '+8', '+8', '+10', 'x2']
  for (const m of modifiers) {
    cards.push({ id: id(), type: 'modifier', modifier: m })
  }

  // Action cards (3 of each)
  for (let i = 0; i < 3; i++) {
    cards.push({ id: id(), type: 'action', action: 'freeze' })
    cards.push({ id: id(), type: 'action', action: 'second_chance' })
    cards.push({ id: id(), type: 'action', action: 'flip_three' })
  }

  return shuffle(cards)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Scoring ───────────────────────────────────────────────────────────────────

export function calculateRoundScore(player: Player): number {
  const numberCards = player.cards.filter(c => c.type === 'number')
  const modifiers = player.cards.filter(c => c.type === 'modifier')

  const hasX2 = modifiers.some(c => c.modifier === 'x2')
  const addModifiers = modifiers
    .filter(c => c.modifier !== 'x2')
    .reduce((sum, c) => sum + parseInt(c.modifier!.replace('+', ''), 10), 0)

  let base = numberCards.reduce((sum, c) => sum + (c.value ?? 0), 0)
  if (hasX2) base *= 2
  base += addModifiers

  const uniqueNumbers = new Set(numberCards.map(c => c.value)).size
  if (uniqueNumbers === 7) base += 15

  return base
}

function hasFlip7(player: Player): boolean {
  const nums = player.cards.filter(c => c.type === 'number').map(c => c.value)
  return new Set(nums).size === 7
}

// ── Bust check ────────────────────────────────────────────────────────────────

function wouldBust(player: Player, card: Card): boolean {
  if (card.type !== 'number') return false
  return player.cards.some(c => c.type === 'number' && c.value === card.value)
}

// ── Turn helpers ──────────────────────────────────────────────────────────────

function drawCard(session: GameSession): [Card | undefined, GameSession] {
  if (session.deck.length === 0) return [undefined, session]
  const [card, ...rest] = session.deck
  return [card, { ...session, deck: rest, lastFlippedCard: card }]
}

function advancePlayer(session: GameSession): GameSession {
  const { players, currentPlayerIndex } = session
  const n = players.length
  let next = (currentPlayerIndex + 1) % n
  let loops = 0
  while (
    players[next].status !== 'active' &&
    loops < n
  ) {
    next = (next + 1) % n
    loops++
  }
  return { ...session, currentPlayerIndex: next }
}

function allDone(session: GameSession): boolean {
  return session.players.every(p => p.status !== 'active')
}

function endRound(session: GameSession): GameSession {
  const players = session.players.map(p => {
    if (p.status === 'busted') return { ...p, roundScore: 0 }
    const score = calculateRoundScore(p)
    return { ...p, roundScore: score, totalScore: p.totalScore + score }
  })

  const winner = players.find(p => p.totalScore >= 200)
  return {
    ...session,
    players,
    phase: winner ? 'game_end' : 'round_end',
    winnerId: winner?.id,
  }
}

// ── Initial deal ──────────────────────────────────────────────────────────────

export function dealInitialCards(session: GameSession): GameSession {
  return {
    ...session,
    phase: 'playing',
    currentPlayerIndex: (session.dealerIndex + 1) % session.players.length,
  }
}

// ── Main action handler ───────────────────────────────────────────────────────

export function applyAction(
  session: GameSession,
  playerId: string,
  action: GameAction
): GameSession {
  const playerIdx = session.players.findIndex(p => p.id === playerId)
  if (playerIdx === -1) return session

  const player = session.players[playerIdx]
  let s = { ...session, lastActivity: Date.now() }

  // ── restart_game ──
  if (action.type === 'restart_game') {
    if (s.phase !== 'game_end') return s
    const players = s.players.map(p => ({
      ...p,
      cards: [],
      status: 'active' as const,
      hasSecondChance: false,
      roundScore: 0,
      totalScore: 0,
    }))
    const newSession: GameSession = {
      ...s,
      players,
      deck: buildDeck(),
      phase: 'dealing',
      currentPlayerIndex: 0,
      roundNumber: 1,
      dealerIndex: 0,
      pendingFlipThreeDraws: 0,
      pendingActionCard: undefined,
      pendingActionPlayerId: undefined,
      lastFlippedCard: undefined,
      winnerId: undefined,
    }
    return dealInitialCards(newSession)
  }

  // ── next_round ──
  if (action.type === 'next_round') {
    if (s.phase !== 'round_end') return s
    const players = s.players.map(p => ({
      ...p,
      cards: [],
      status: 'active' as const,
      hasSecondChance: false,
      roundScore: 0,
    }))
    const newDealerIndex = (s.dealerIndex + 1) % players.length
    const newSession: GameSession = {
      ...s,
      players,
      deck: buildDeck(),
      phase: 'dealing',
      currentPlayerIndex: 0,
      roundNumber: s.roundNumber + 1,
      dealerIndex: newDealerIndex,
      pendingFlipThreeDraws: 0,
      pendingActionCard: undefined,
      pendingActionPlayerId: undefined,
      lastFlippedCard: undefined,
    }
    return dealInitialCards(newSession)
  }

  // ── target_action (resolve pending Freeze or Flip Three) ──
  if (action.type === 'target_action') {
    if (s.phase !== 'awaiting_target') return s
    const targetIdx = s.players.findIndex(p => p.id === action.targetPlayerId)
    if (targetIdx === -1) return s

    const pendingCard = s.pendingActionCard!
    // Remove the played action card from the drawer's hand
    const drawerIdx = s.players.findIndex(p => p.id === s.pendingActionPlayerId)
    if (drawerIdx !== -1) {
      const players = s.players.map((p, i) =>
        i === drawerIdx ? { ...p, cards: p.cards.filter(c => c.id !== pendingCard.id) } : p
      )
      s = { ...s, players }
    }
    s = { ...s, phase: 'playing', pendingActionCard: undefined, pendingActionPlayerId: undefined }

    if (pendingCard.action === 'freeze') {
      const players = s.players.map((p, i) =>
        i === targetIdx ? { ...p, status: 'frozen' as const, cards: [...p.cards, pendingCard] } : p
      )
      s = { ...s, players }
      if (allDone(s)) return endRound(s)
      return advancePlayer(s)
    }

    if (pendingCard.action === 'flip_three') {
      s = { ...s, pendingFlipThreeDraws: 3, currentPlayerIndex: targetIdx }
      return applyFlipThreeDraws(s)
    }

    return s
  }

  // ── stop ──
  if (action.type === 'stop') {
    if (s.phase !== 'playing' || playerIdx !== s.currentPlayerIndex || player.status !== 'active') return s
    const players = s.players.map((p, i) =>
      i === playerIdx ? { ...p, status: 'stopped' as const } : p
    )
    s = { ...s, players }
    if (allDone(s)) return endRound(s)
    return advancePlayer(s)
  }

  // ── use_second_chance (not exposed directly; handled during flip) ──
  if (action.type === 'use_second_chance') {
    // no-op: handled inline during flip
    return s
  }

  // ── flip ──
  if (action.type === 'flip') {
    if (s.phase !== 'playing' || playerIdx !== s.currentPlayerIndex || player.status !== 'active') return s

    s = { ...s, lastDiscard: undefined }

    let [card, next] = drawCard(s)
    s = next
    if (!card) return s  // empty deck; treat as stop
    s = { ...s, lastFlippedCard: card }

    return processDrawnCard(s, playerIdx, card)
  }

  return s
}

function processDrawnCard(
  session: GameSession,
  playerIdx: number,
  card: Card
): GameSession {
  let s = session
  const player = s.players[playerIdx]

  // ── Action card ──
  if (card.type === 'action') {
    // Always add the card to the drawer's hand so it's visible
    const playersWithCard = s.players.map((p, i) =>
      i === playerIdx
        ? {
            ...p,
            cards: [...p.cards, card],
            hasSecondChance: card.action === 'second_chance' ? true : p.hasSecondChance,
          }
        : p
    )
    s = { ...s, players: playersWithCard }

    if (card.action === 'second_chance') {
      // Turn ends after drawing Second Chance (passive card, no targeting)
      return advancePlayer(s)
    }

    // Freeze or Flip Three: need to pick a target
    // If in a Flip Three sequence, queue it for after
    if (s.pendingFlipThreeDraws > 0) {
      s = { ...s, pendingFlipThreeDraws: s.pendingFlipThreeDraws - 1 }
      if (!s.pendingActionCard) {
        s = { ...s, pendingActionCard: card, pendingActionPlayerId: s.players[playerIdx].id }
      }
      if (s.pendingFlipThreeDraws === 0) {
        return resolveQueuedAction(s)
      }
      return s
    }

    // Normal: enter awaiting_target
    return {
      ...s,
      phase: 'awaiting_target',
      pendingActionCard: card,
      pendingActionPlayerId: player.id,
    }
  }

  // ── Number card ──
  if (card.type === 'number') {
    if (wouldBust(player, card)) {
      // Can use Second Chance?
      if (player.hasSecondChance) {
        // Discard one Second Chance + the duplicate; player keeps their turn
        const scIdx = player.cards.findIndex(c => c.action === 'second_chance')
        const secondChanceCard = player.cards[scIdx]
        const cardsAfter = player.cards.filter((_, i) => i !== scIdx)
        const stillHasSecondChance = cardsAfter.some(c => c.action === 'second_chance')
        const players = s.players.map((p, i) =>
          i === playerIdx
            ? { ...p, hasSecondChance: stillHasSecondChance, cards: cardsAfter }
            : p
        )
        const lastDiscard = secondChanceCard ? [secondChanceCard, card] : [card]
        return { ...s, players, lastDiscard }
      }

      // Bust
      const players = s.players.map((p, i) =>
        i === playerIdx ? { ...p, status: 'busted' as const, cards: [...p.cards, card!] } : p
      )
      s = { ...s, players }
      if (allDone(s)) return endRound(s)
      return advancePlayer(s)
    }

    // Normal draw
    const players = s.players.map((p, i) =>
      i === playerIdx ? { ...p, cards: [...p.cards, card!] } : p
    )
    s = { ...s, players }

    // Flip7 check
    if (hasFlip7(s.players[playerIdx])) {
      return endRound(s)
    }

    // If in Flip Three, decrement counter (automated — do not advance turn here)
    if (s.pendingFlipThreeDraws > 0) {
      s = { ...s, pendingFlipThreeDraws: s.pendingFlipThreeDraws - 1 }
      if (s.pendingFlipThreeDraws === 0) {
        return resolveQueuedAction(s)
      }
      return applyFlipThreeDraws(s)
    }

    // Normal flip: turn ends after drawing one card
    return advancePlayer(s)
  }

  // ── Modifier card ──
  if (card.type === 'modifier') {
    const players = s.players.map((p, i) =>
      i === playerIdx ? { ...p, cards: [...p.cards, card!] } : p
    )
    s = { ...s, players }

    if (s.pendingFlipThreeDraws > 0) {
      s = { ...s, pendingFlipThreeDraws: s.pendingFlipThreeDraws - 1 }
      if (s.pendingFlipThreeDraws === 0) {
        return resolveQueuedAction(s)
      }
      return applyFlipThreeDraws(s)
    }

    // Normal flip: turn ends after drawing one card
    return advancePlayer(s)
  }

  return s
}

// Automatically draw remaining Flip Three cards
function applyFlipThreeDraws(session: GameSession): GameSession {
  let s = session
  while (s.pendingFlipThreeDraws > 0 && s.phase === 'playing') {
    const targetIdx = s.currentPlayerIndex
    const target = s.players[targetIdx]
    if (target.status !== 'active') {
      s = { ...s, pendingFlipThreeDraws: 0 }
      break
    }
    let [card, next] = drawCard(s)
    s = next
    if (!card) break
    s = { ...s, lastFlippedCard: card }
    s = processDrawnCard(s, targetIdx, card)
    // processDrawnCard may change pendingFlipThreeDraws; loop re-checks
  }
  return s
}

function resolveQueuedAction(session: GameSession): GameSession {
  const s = session
  if (!s.pendingActionCard) return advancePlayer(s)

  return {
    ...s,
    phase: 'awaiting_target',
    pendingFlipThreeDraws: 0,
  }
}

// ── Serialize for client ──────────────────────────────────────────────────────

export function toClientState(session: GameSession): ClientGameState {
  const { deck, ...rest } = session
  return { ...rest, deckSize: deck.length }
}
