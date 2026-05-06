export type CardType = 'number' | 'modifier' | 'action'
export type ModifierValue = '+2' | '+4' | '+6' | '+8' | '+10' | 'x2'
export type ActionValue = 'freeze' | 'second_chance' | 'flip_three'

export interface Card {
  id: string
  type: CardType
  value?: number
  modifier?: ModifierValue
  action?: ActionValue
}

export type PlayerStatus = 'active' | 'stopped' | 'busted' | 'frozen'

export interface Player {
  id: string
  nickname: string
  cards: Card[]
  status: PlayerStatus
  hasSecondChance: boolean
  roundScore: number
  totalScore: number
}

export type GamePhase = 'lobby' | 'dealing' | 'playing' | 'awaiting_target' | 'round_end' | 'game_end'

export interface PendingAction {
  card: Card
  playerId: string
}

export interface GameSession {
  code: string
  hostId: string
  players: Player[]
  deck: Card[]
  phase: GamePhase
  currentPlayerIndex: number
  roundNumber: number
  dealerIndex: number
  pendingFlipThreeDraws: number
  pendingActionQueue: PendingAction[]
  lastFlippedCard?: Card
  lastDiscard?: Card[]
  lastFlipThreeCards?: Card[]
  lastFlipThreeTargetId?: string
  lastActivity: number
  winnerId?: string
}

export type GameAction =
  | { type: 'flip' }
  | { type: 'stop' }
  | { type: 'use_second_chance' }
  | { type: 'target_action'; targetPlayerId: string }
  | { type: 'next_round' }
  | { type: 'restart_game' }

// What we send to clients (no deck details)
export type ClientGameState = Omit<GameSession, 'deck'> & {
  deckSize: number
}
