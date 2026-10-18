import React from 'react';
import { Users, User, ShieldAlert, Cpu, RotateCcw } from 'lucide-react';
import type { GameMode } from '../types/game';

interface GameModeSelectorProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  qGeneration: number;
  onResetQMemory: () => void;
  disabled?: boolean;
}

export const GameModeSelector: React.FC<GameModeSelectorProps> = ({
  currentMode,
  onSelectMode,
  qGeneration,
  onResetQMemory,
  disabled = false,
}) => {
  const modes: { id: GameMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'pvp',
      label: 'Local PvP',
      icon: <Users className="w-3.5 h-3.5" />,
      desc: '2 Players',
    },
    {
      id: 'ai-casual',
      label: 'Club Player',
      icon: <User className="w-3.5 h-3.5" />,
      desc: 'Casual',
    },
    {
      id: 'ai-tactician',
      label: 'Tactician',
      icon: <ShieldAlert className="w-3.5 h-3.5" />,
      desc: 'Minimax D=2',
    },
    {
      id: 'ai-adaptive',
      label: 'Adaptive Bot',
      icon: <Cpu className="w-3.5 h-3.5" />,
      desc: 'Q-Learning',
    },
  ];

  return (
    <div className="w-full flex flex-col gap-2 mb-4">
      <div
        role="tablist"
        aria-label="Select Opponent Mode"
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full"
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
              className={`flex flex-col items-center justify-center py-2 px-2 border-2 border-ink font-sans transition-all duration-100 ${
                isActive
                  ? 'bg-ink text-paper-surface translate-x-[2px] translate-y-[2px] shadow-none font-bold'
                  : 'bg-paper-surface text-ink shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-1.5 text-xs">
                <span>{mode.icon}</span>
                <span className="font-bold tracking-tight">{mode.label}</span>
              </div>
              <span
                className={`text-[10px] font-mono mt-0.5 ${
                  isActive ? 'text-paper-muted' : 'text-ink-muted'
                }`}
              >
                {mode.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Adaptive Bot Q-Learning Badge & Wipe Control */}
      {currentMode === 'ai-adaptive' && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-paper-muted border-2 border-ink text-xs font-mono shadow-brutal-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cobalt inline-block animate-ping" />
            <span className="font-semibold text-ink">
              Learned from you:{' '}
              <span className="bg-paper-surface px-1.5 py-0.2 border border-ink font-bold">
                Gen #{qGeneration}
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={onResetQMemory}
            className="flex items-center gap-1 text-[11px] text-ink hover:text-terracotta underline font-semibold cursor-pointer active:scale-95 transition-colors"
            title="Reset Q-Learning Agent memory to initial baseline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Wipe Memory</span>
          </button>
        </div>
      )}
    </div>
  );
};
