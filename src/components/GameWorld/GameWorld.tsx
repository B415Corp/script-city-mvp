import { IsometricGrid } from '../IsometricGrid'
import { GameUI } from '../GameUI'
import './GameWorld.css'

interface GameWorldProps {
  onBack: () => void
}

export function GameWorld({ onBack }: GameWorldProps) {
  return (
    <div className="game-world">
      <IsometricGrid />
      <GameUI onBack={onBack} />
    </div>
  )
}

