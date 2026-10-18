import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface HeaderProps {
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isMuted, onToggleMute }) => {
  return (
    <header className="w-full flex items-center justify-between pb-3 border-b-2 border-ink mb-4">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold tracking-widest text-ink px-1.5 py-0.5 bg-paper-muted border border-ink">
            SYS:01
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-ink font-sans">
            TIC-TAC-TOE
          </h1>
        </div>
        <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
          Paper & Ink // Tactical Engine
        </span>
      </div>

      <button
        onClick={onToggleMute}
        type="button"
        className="p-2 bg-paper-surface border-2 border-ink text-ink shadow-brutal-sm hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-brutal active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-100"
        aria-label={isMuted ? 'Unmute game sounds' : 'Mute game sounds'}
        title={isMuted ? 'Unmute game sounds' : 'Mute game sounds'}
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4 text-terracotta" />
        ) : (
          <Volume2 className="w-4 h-4 text-ink" />
        )}
      </button>
    </header>
  );
};
