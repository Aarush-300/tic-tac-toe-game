import React from 'react';
import type { GameMode, Player, Winner } from '../types/game';

interface StatusBannerProps {
  winner: Winner;
  turn: Player;
  isAiThinking: boolean;
  gameMode: GameMode;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  winner,
  turn,
  isAiThinking,
  gameMode,
}) => {
  if (winner) {
    if (winner === 'Draw') {
      return (
        <div className="w-full flex items-center justify-center gap-2 py-2 px-4 border-2 border-ink bg-paper-muted text-ink font-mono font-bold text-xs tracking-wider shadow-brutal-sm mb-4">
          <span>// STALEMATE: NO CONTEST</span>
        </div>
      );
    }

    const isX = winner === 'X';
    const outcomeText =
      winner === 'X'
        ? gameMode === 'pvp'
          ? 'VICTORY: PLAYER X WINS'
          : 'ROUND WON: YOU PREVAILED'
        : gameMode === 'pvp'
        ? 'VICTORY: PLAYER O WINS'
        : 'ROUND OVER: OPPONENT PREVAILED';

    return (
      <div
        className={`w-full flex items-center justify-center gap-2 py-2 px-4 border-2 border-ink font-mono font-bold text-xs tracking-wider shadow-brutal-sm mb-4 ${
          isX ? 'bg-terracotta text-white' : 'bg-cobalt text-white'
        }`}
      >
        <span>// {outcomeText}</span>
      </div>
    );
  }

  if (isAiThinking) {
    return (
      <div className="w-full flex items-center justify-center gap-2 py-2 px-4 border-2 border-ink bg-paper-surface text-ink font-mono text-xs shadow-brutal-sm mb-4">
        <span className="w-2 h-2 rounded-full bg-ink inline-block animate-ping" />
        <span>OPPONENT EVALUATING GRID...</span>
      </div>
    );
  }

  const isXTurn = turn === 'X';
  const turnLabel =
    isXTurn
      ? gameMode === 'pvp'
        ? 'TURN: PLAYER X'
        : 'YOUR TURN (X)'
      : gameMode === 'pvp'
      ? 'TURN: PLAYER O'
      : "OPPONENT'S TURN (O)";

  return (
    <div className="w-full flex items-center justify-center gap-2 py-2 px-4 border-2 border-ink bg-paper-surface text-ink font-mono text-xs shadow-brutal-sm mb-4">
      <span
        className={`w-2.5 h-2.5 border border-ink inline-block ${
          isXTurn ? 'bg-terracotta' : 'bg-cobalt'
        }`}
      />
      <span>{turnLabel}</span>
    </div>
  );
};
