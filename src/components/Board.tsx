import React, { useRef } from 'react';
import type { BoardState, Player, WinningLine } from '../types/game';
import { Square } from './Square';

interface BoardProps {
  board: BoardState;
  winningLine: WinningLine;
  isGameOver: boolean;
  isAiThinking: boolean;
  currentTurn: Player;
  onSquareClick: (index: number) => void;
}

export const Board: React.FC<BoardProps> = ({
  board,
  winningLine,
  isGameOver,
  isAiThinking,
  currentTurn,
  onSquareClick,
}) => {
  const squareRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLButtonElement>) => {
    let nextIndex: number | null = null;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (index - 3 >= 0) nextIndex = index - 3;
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (index + 3 < 9) nextIndex = index + 3;
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (index % 3 > 0) nextIndex = index - 1;
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (index % 3 < 2) nextIndex = index + 1;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = 8;
        break;
      default:
        break;
    }

    if (nextIndex !== null) {
      squareRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div
      role="grid"
      aria-label="Tic Tac Toe Board"
      className="w-full max-w-[360px] sm:max-w-[400px] aspect-square mx-auto p-3 sm:p-4 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-md mb-4 flex items-center justify-center relative"
    >
      <div className="grid grid-cols-3 grid-rows-3 gap-2.5 sm:gap-3.5 w-full h-full">
        {board.map((value, index) => {
          const isWinning = winningLine !== null && winningLine.includes(index);
          return (
            <Square
              key={index}
              index={index}
              value={value}
              isWinningSquare={isWinning}
              isGameOver={isGameOver}
              isAiThinking={isAiThinking}
              currentTurn={currentTurn}
              onClick={() => onSquareClick(index)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              buttonRef={(el) => {
                squareRefs.current[index] = el;
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
