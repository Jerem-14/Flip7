'use client'

import { Card as CardType } from '@/lib/types'

interface Props {
  card: CardType
  size?: 'sm' | 'md' | 'lg'
  faceDown?: boolean
}

const sizeClasses = {
  sm: 'w-10 h-14 text-xs',
  md: 'w-14 h-20 text-sm',
  lg: 'w-20 h-28 text-lg',
}

function cardLabel(card: CardType): string {
  if (card.type === 'number') return String(card.value)
  if (card.type === 'modifier') return card.modifier!
  const labels: Record<string, string> = {
    freeze: '❄️',
    second_chance: '🛡',
    flip_three: '×3',
  }
  return labels[card.action!] ?? '?'
}

function cardColors(card: CardType): string {
  if (card.type === 'number') {
    const v = card.value ?? 0
    if (v <= 3) return 'bg-emerald-100 border-emerald-400 text-emerald-900'
    if (v <= 7) return 'bg-blue-100 border-blue-400 text-blue-900'
    return 'bg-violet-100 border-violet-400 text-violet-900'
  }
  if (card.type === 'modifier') return 'bg-amber-100 border-amber-400 text-amber-900'
  const actionColors: Record<string, string> = {
    freeze: 'bg-cyan-100 border-cyan-400 text-cyan-900',
    second_chance: 'bg-rose-100 border-rose-400 text-rose-900',
    flip_three: 'bg-orange-100 border-orange-400 text-orange-900',
  }
  return actionColors[card.action!] ?? 'bg-gray-100 border-gray-400 text-gray-900'
}

export default function Card({ card, size = 'md', faceDown = false }: Props) {
  if (faceDown) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-lg border-2 border-gray-400 bg-gray-700 flex items-center justify-center font-bold text-gray-500 select-none shrink-0`}
      >
        ?
      </div>
    )
  }

  return (
    <div
      className={`${sizeClasses[size]} ${cardColors(card)} rounded-lg border-2 flex flex-col items-center justify-center font-bold select-none shrink-0 shadow-sm`}
    >
      <span>{cardLabel(card)}</span>
      {card.type === 'number' && (
        <span className="text-[0.6em] opacity-60 mt-0.5">
          {card.value === 0 ? 'zero' : ''}
        </span>
      )}
    </div>
  )
}
