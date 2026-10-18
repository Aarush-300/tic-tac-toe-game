import React from 'react';
import type { GameMode, Player, ScoreState } from '../types/game';

interface ScoreboardProps {
  scores: ScoreState;
  turn: Player;
  gameMode: GameMode;
  winner: string | null;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  scores,
  turn,
  gameMode,
  winner,
}) => {
  const isXTurn = turn === 'X' && !winner;
  const isOTurn = turn === 'O' && !winner;

  const oLabel =
    gameMode === 'pvp'
      ? 'PLAYER O'
      : gameMode === 'ai-casual'
      ? 'CLUB AI'
      : gameMode === 'ai-tactician'
      ? 'TACTICIAN'
      : 'ADAPTIVE';

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full mb-4">
      {/* Player X Card */}
      <div
        className={`flex flex-col items-center justify-center p-2.5 sm:p-3 border-2 border-ink transition-all duration-100 ${
          isXTurn
            ? 'bg-terracotta-light shadow-brutal translate-x-[-1px] translate-y-[-1px]'
            : 'bg-paper-surface shadow-brutal-sm'
        }`}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-2.5 h-2.5 bg-terracotta inline-block border border-ink" />
          <span className="text-[11px] font-mono font-bold tracking-wider text-ink">
            {gameMode === 'pvp' ? 'PLAYER X' : 'YOU (X)'}
          </span>
        </div>
        <span className="text-2xl sm:text-3xl font-mono font-bold text-ink">
          {scores.x}
        </span>
        <span className="text-[10px] font-mono text-ink-muted mt-0.5">
          {isXTurn ? '[TURN]' : 'WINS'}
        </span>
      </div>

      {/* Draws / Ties Card */}
      <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 border-2 border-ink bg-paper-surface shadow-brutal-sm">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-2.5 h-2.5 bg-ink-muted inline-block border border-ink" />
          <span className="text-[11px] font-mono font-bold tracking-wider text-ink">
            DRAWS
          </span>
        </div>
        <span className="text-2xl sm:text-3xl font-mono font-bold text-ink">
          {scores.ties}
        </span>
        <span className="text-[10px] font-mono text-ink-muted mt-0.5">TIED</span>
      </div>

      {/* Player O Card */}
      <div
        className={`flex flex-col items-center justify-center p-2.5 sm:p-3 border-2 border-ink transition-all duration-100 ${
          isOTurn
            ? 'bg-cobalt-light shadow-brutal translate-x-[-1px] translate-y-[-1px]'
            : 'bg-paper-surface shadow-brutal-sm'
        }`}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-2.5 h-2.5 bg-cobalt inline-block border border-ink" />
          <span className="text-[11px] font-mono font-bold tracking-wider text-ink">
            {oLabel}
          </span>
        </div>
        <span className="text-2xl sm:text-3xl font-mono font-bold text-ink">
          {scores.o}
        </span>
        <span className="text-[10px] font-mono text-ink-muted mt-0.5">
          {isOTurn ? '[TURN]' : 'WINS'}
        </span>
      </div>
    </div>
  );
};
