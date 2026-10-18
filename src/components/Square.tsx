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
      className={`relative aspect-square w-full border-2 border-ink flex items-center justify-center select-none outline-none transition-all duration-100 ease-out focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 ${
        isWinningSquare
          ? 'bg-[#FEF08A] border-ink shadow-brutal translate-x-[-1px] translate-y-[-1px] z-10'
          : value
          ? 'bg-paper-surface shadow-brutal-sm'
          : 'bg-paper-surface hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shadow-brutal-sm cursor-pointer'
      } ${isDisabled && !value ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      {/* Hand-drawn SVG animated stroke for X */}
      {value === 'X' && (
        <svg
          viewBox="0 0 48 48"
          className="w-10 h-10 sm:w-14 sm:h-14"
          aria-hidden="true"
        >
          <line
            x1="11"
            y1="11"
            x2="37"
            y2="37"
            stroke="#E04F33"
            strokeWidth="5"
            strokeLinecap="round"
            className="draw-line-1"
          />
          <line
            x1="37"
            y1="11"
            x2="11"
            y2="37"
            stroke="#E04F33"
            strokeWidth="5"
            strokeLinecap="round"
            className="draw-line-2"
          />
        </svg>
      )}

      {/* Hand-drawn SVG animated stroke for O */}
      {value === 'O' && (
        <svg
          viewBox="0 0 48 48"
          className="w-10 h-10 sm:w-14 sm:h-14"
          aria-hidden="true"
        >
          <circle
            cx="24"
            cy="24"
            r="13"
            stroke="#2563EB"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            className="draw-circle"
          />
        </svg>
      )}

      {/* Subtle preview on hover for empty available cells */}
      {!value && !isDisabled && (
        <span
          aria-hidden="true"
          className={`font-mono text-xl sm:text-2xl font-bold opacity-0 hover:opacity-25 transition-opacity pointer-events-none select-none ${
            currentTurn === 'X' ? 'text-terracotta' : 'text-cobalt'
          }`}
        >
          {currentTurn}
        </span>
      )}
    </button>
  );
};
