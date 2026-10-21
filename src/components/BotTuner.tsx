import React from 'react';
import { Sliders, RotateCcw, Activity } from 'lucide-react';
import { getBotHyperparameters, getBotPersona } from '../utils/qLearning';

export interface BotTunerProps {
  focusLevel: number;
  autoAdapt: boolean;
  onSetFocusLevel: (level: number) => void;
  onToggleAutoAdapt: (enabled: boolean) => void;
  onResetMemory: () => void;
  qGeneration: number;
  qConfidence?: { scoreStr: string; winProbStr: string; display: string };
  disabled?: boolean;
}

export const BotTuner: React.FC<BotTunerProps> = ({
  focusLevel,
  autoAdapt,
  onSetFocusLevel,
  onToggleAutoAdapt,
  onResetMemory,
  qGeneration,
  qConfidence,
  disabled = false,
}) => {
  const { tau, decayRate, blockProb } = getBotHyperparameters(focusLevel);
  const persona = getBotPersona(focusLevel);

  return (
    <section
      aria-label="Bot Brain Tuner"
      className="w-full bg-paper-surface border-2 border-ink p-3.5 mb-4 shadow-brutal transition-all"
    >
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b-2 border-ink/20">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-ink text-paper-surface border border-ink">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <span className="font-sans font-bold text-xs tracking-wider uppercase text-ink">
            Bot Focus / IQ
          </span>
          <span
            className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${persona.badgeClass}`}
          >
            {persona.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-Adapt Toggle */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => onToggleAutoAdapt(!autoAdapt)}
            className={`px-2.5 py-1 text-[11px] font-mono font-bold border-2 border-ink transition-all duration-100 ${
              autoAdapt
                ? 'bg-ink text-paper-surface shadow-none'
                : 'bg-paper text-ink shadow-[2px_2px_0px_0px_#18181B] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px]'
            } active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer disabled:opacity-50`}
            title="Toggle dynamic rubber-band auto adaptation"
          >
            AUTO: {autoAdapt ? 'ON' : 'OFF'}
          </button>

          {/* Wipe Memory Button */}
          <button
            type="button"
            disabled={disabled}
            onClick={onResetMemory}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono font-bold bg-paper text-ink border-2 border-ink shadow-[2px_2px_0px_0px_#18181B] hover:text-terracotta hover:border-terracotta active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer disabled:opacity-50 transition-colors"
            title="Purge Q-table memory and reset to baseline 50% focus"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Wipe</span>
          </button>
        </div>
      </div>

      {/* Main Slider Control */}
      <div className="pt-3 pb-2">
        <div className="flex justify-between items-center mb-1 text-[11px] font-mono text-ink">
          <span className="font-semibold">Focus Intensity</span>
          <span className="font-bold text-xs px-1.5 py-0.2 bg-paper-muted border border-ink">
            {focusLevel}%
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={focusLevel}
          disabled={disabled}
          onChange={(e) => onSetFocusLevel(Number(e.target.value))}
          className="brutal-slider my-1.5"
          aria-label="Bot Focus Level"
        />

        {/* Slider Tick Marks */}
        <div className="flex justify-between text-[10px] font-mono text-ink-muted px-0.5">
          <span>0% (Casual)</span>
          <span>50% (Balanced)</span>
          <span>100% (Grandmaster)</span>
        </div>
      </div>

      {/* Live JetBrains Mono Telemetry Grid */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-ink/15 text-center font-mono">
        <div className="p-1.5 bg-paper-muted border border-ink/30">
          <div className="text-[9px] text-ink-muted uppercase tracking-wider font-sans font-bold">
            TEMP (τ)
          </div>
          <div className="text-xs font-bold text-ink mt-0.5">{tau.toFixed(3)}</div>
        </div>

        <div className="p-1.5 bg-paper-muted border border-ink/30">
          <div className="text-[9px] text-ink-muted uppercase tracking-wider font-sans font-bold">
            REFLEX
          </div>
          <div className="text-xs font-bold text-ink mt-0.5">
            {(blockProb * 100).toFixed(0)}%
          </div>
        </div>

        <div className="p-1.5 bg-paper-muted border border-ink/30">
          <div className="text-[9px] text-ink-muted uppercase tracking-wider font-sans font-bold">
            RETENTION
          </div>
          <div className="text-xs font-bold text-ink mt-0.5">
            {(decayRate * 100).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Auxiliary learning & confidence stats */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-dashed border-ink/20 text-[11px] font-mono text-ink">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cobalt inline-block animate-ping" />
          <span>Learned: <strong className="font-bold">Gen #{qGeneration}</strong></span>
        </div>
        {qConfidence && (
          <div className="flex items-center gap-1 text-[11px]">
            <Activity className="w-3 h-3 text-cobalt" />
            <span>Conf: <strong className="text-cobalt font-bold">{qConfidence.scoreStr}</strong> ({qConfidence.winProbStr})</span>
          </div>
        )}
      </div>
    </section>
  );
};

