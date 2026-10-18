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
      : gameMode === 'ai-easy'
      ? 'AI (EASY)'
      : 'AI (MASTER)';

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full mb-4">
      {/* Player X Card */}
      <div
        className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border transition-all duration-300 relative overflow-hidden ${
          isXTurn
            ? 'bg-slate-900 border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/40'
            : 'bg-slate-900/60 border-slate-800 text-slate-400'
        }`}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block shadow-[0_0_6px_#22d3ee]" />
          <span className="text-[11px] font-bold tracking-wider text-cyan-400">
            {gameMode === 'pvp' ? 'PLAYER X' : 'YOU (X)'}
          </span>
        </div>
        <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {scores.x}
        </span>
        {isXTurn && (
          <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-300 mt-0.5 animate-pulse">
            Thinking...
          </span>
        )}
      </div>

      {/* Ties Card */}
      <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
          <span className="text-[11px] font-bold tracking-wider text-slate-400">
            TIES
          </span>
        </div>
        <span className="text-xl sm:text-2xl font-black text-slate-200 tracking-tight">
          {scores.ties}
        </span>
        <span className="text-[10px] text-slate-500 mt-0.5">DRAWS</span>
      </div>

      {/* Player O Card */}
      <div
        className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border transition-all duration-300 relative overflow-hidden ${
          isOTurn
            ? 'bg-slate-900 border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.25)] ring-1 ring-rose-500/40'
            : 'bg-slate-900/60 border-slate-800 text-slate-400'
        }`}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-2 h-2 rounded-full bg-rose-400 inline-block shadow-[0_0_6px_#fb7185]" />
          <span className="text-[11px] font-bold tracking-wider text-rose-400">
            {oLabel}
          </span>
        </div>
        <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {scores.o}
        </span>
        {isOTurn && (
          <span className="text-[10px] uppercase font-bold tracking-wider text-rose-300 mt-0.5 animate-pulse">
            Thinking...
          </span>
        )}
      </div>
    </div>
  );
};
