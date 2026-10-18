import React from 'react';
import { Users, Sparkles, Cpu } from 'lucide-react';
import type { GameMode } from '../types/game';

interface GameModeSelectorProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  disabled?: boolean;
}

export const GameModeSelector: React.FC<GameModeSelectorProps> = ({
  currentMode,
  onSelectMode,
  disabled = false,
}) => {
  const modes: { id: GameMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'pvp',
      label: 'PvP',
      icon: <Users className="w-4 h-4" />,
      desc: 'Local 2 Players',
    },
    {
      id: 'ai-easy',
      label: 'AI (Easy)',
      icon: <Sparkles className="w-4 h-4" />,
      desc: 'Casual Moves',
    },
    {
      id: 'ai-unbeatable',
      label: 'AI (Master)',
      icon: <Cpu className="w-4 h-4" />,
      desc: 'Minimax Engine',
    },
  ];

  return (
    <div
      role="tablist"
      aria-label="Select Game Mode"
      className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 shadow-inner mb-4 w-full"
    >
      {modes.map((mode) => {
        const isActive = currentMode === mode.id;
        return (
          <button
            key={mode.id}
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => onSelectMode(mode.id)}
            className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg text-xs font-semibold transition-all duration-200 relative ${
              isActive
                ? 'bg-gradient-to-b from-slate-800 to-slate-850 text-white shadow-md border border-cyan-500/40 ring-1 ring-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-98'}`}
          >
            <div className="flex items-center gap-1.5">
              <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>
                {mode.icon}
              </span>
              <span>{mode.label}</span>
            </div>
            <span className="text-[10px] font-normal text-slate-500 mt-0.5 hidden sm:inline">
              {mode.desc}
            </span>
            {isActive && (
              <span className="absolute -bottom-[1px] left-1/4 right-1/4 h-[2px] bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]" />
            )}
          </button>
        );
      })}
    </div>
  );
};
