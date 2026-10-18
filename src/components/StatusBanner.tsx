import React from 'react';
import { Trophy, Bot, Loader2, Sparkles, MinusCircle } from 'lucide-react';
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
        <div className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-sm tracking-wide shadow-md mb-4 animate-fade-in">
          <MinusCircle className="w-4 h-4 text-amber-400" />
          <span>It's a Draw! Both sides held the line.</span>
        </div>
      );
    }

    const isX = winner === 'X';
    const winnerTitle =
      winner === 'X'
        ? gameMode === 'pvp'
          ? 'Player X Wins!'
          : 'You Won!'
        : gameMode === 'pvp'
        ? 'Player O Wins!'
        : 'AI Wins!';

    return (
      <div
        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm tracking-wide shadow-lg mb-4 animate-fade-in ${
          isX
            ? 'bg-cyan-500/15 border border-cyan-400/50 text-cyan-200 shadow-cyan-500/20 glow-box-cyan'
            : 'bg-rose-500/15 border border-rose-400/50 text-rose-200 shadow-rose-500/20 glow-box-pink'
        }`}
      >
        <Trophy className={`w-4 h-4 ${isX ? 'text-cyan-300' : 'text-rose-300'}`} />
        <span>{winnerTitle}</span>
        <Sparkles className="w-4 h-4 text-amber-300" />
      </div>
    );
  }

  if (isAiThinking) {
    return (
      <div className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-850 border border-slate-700/60 text-slate-300 text-sm font-medium mb-4 animate-pulse">
        <Bot className="w-4 h-4 text-rose-400" />
        <span>AI is calculating optimal move...</span>
        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const isXTurn = turn === 'X';
  const turnLabel =
    isXTurn
      ? gameMode === 'pvp'
        ? "Player X's Turn"
        : 'Your Turn (X)'
      : gameMode === 'pvp'
      ? "Player O's Turn"
      : "AI's Turn (O)";

  return (
    <div className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 text-sm font-medium mb-4">
      <span
        className={`w-2.5 h-2.5 rounded-full ${
          isXTurn
            ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
            : 'bg-rose-400 shadow-[0_0_8px_#fb7185]'
        }`}
      />
      <span>{turnLabel}</span>
    </div>
  );
};
