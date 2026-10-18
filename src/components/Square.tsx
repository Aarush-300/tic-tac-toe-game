import React from 'react';
import type { Player, SquareValue } from '../types/game';

interface SquareProps {
  index: number;
  value: SquareValue;
  isWinningSquare: boolean;
  isGameOver: boolean;
  isAiThinking: boolean;
  currentTurn: Player;
  onClick: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}

export const Square: React.FC<SquareProps> = ({
  index,
  value,
  isWinningSquare,
  isGameOver,
  isAiThinking,
  currentTurn,
  onClick,
  onKeyDown,
  buttonRef,
}) => {
  const row = Math.floor(index / 3) + 1;
  const col = (index % 3) + 1;

  const ariaLabel = `Row ${row}, Column ${col}${
    value ? `, marked ${value}` : ', empty'
  }${isWinningSquare ? ', winning square' : ''}`;

  const isDisabled = value !== null || isGameOver || isAiThinking;

  return (
    <button
      ref={buttonRef}
      type="button"
      role="gridcell"
      aria-label={ariaLabel}
      disabled={isDisabled}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={`relative aspect-square w-full rounded-2xl flex items-center justify-center font-black transition-all duration-200 select-none outline-none group focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
        isWinningSquare
          ? 'bg-emerald-950/80 border-2 border-emerald-400 animate-pulse-glow z-10'
          : value
          ? 'bg-slate-900/90 border border-slate-800 shadow-md'
          : 'bg-slate-900/40 hover:bg-slate-850/80 border border-slate-800/80 hover:border-slate-700 active:scale-95 cursor-pointer shadow-inner'
      } ${isDisabled && !value ? 'cursor-not-allowed opacity-75' : ''}`}
    >
      {/* Existing Mark */}
      {value === 'X' && (
        <span className="text-4xl sm:text-5xl md:text-6xl font-black text-cyan-400 glow-cyan animate-pop">
          ✕
        </span>
      )}

      {value === 'O' && (
        <span className="text-4xl sm:text-5xl md:text-6xl font-black text-rose-500 glow-pink animate-pop">
          ◯
        </span>
      )}

      {/* Ghost Preview on hover for empty squares */}
      {!value && !isDisabled && (
        <span
          aria-hidden="true"
          className={`text-3xl sm:text-4xl font-black opacity-0 group-hover:opacity-20 transition-opacity duration-150 ${
            currentTurn === 'X' ? 'text-cyan-400' : 'text-rose-400'
          }`}
        >
          {currentTurn === 'X' ? '✕' : '◯'}
        </span>
      )}
    </button>
  );
};
