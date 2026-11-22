import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { getBotHyperparameters, getBotPersona, type QLearningAgent } from '../utils/qLearning';
import { ResetControl } from './Controls';

export function BotTuner({ agent, setFocus, setAuto, reset }: {
  agent: QLearningAgent; setFocus: (n: number) => void; setAuto: (b: boolean) => void; reset: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const { tau, decayRate } = getBotHyperparameters(agent.focusLevel);
  return <details className="tuner">
    <summary><SlidersHorizontal/>Bot settings</summary>
    <div className="tuner-body">
      <label htmlFor="focus">Bot focus <strong>{agent.focusLevel}%</strong></label>
      <input id="focus" type="range" value={agent.focusLevel} onChange={e => setFocus(e.target.valueAsNumber)}/>
      <label className="auto-focus"><input type="checkbox" checked={agent.autoAdapt} onChange={e => setAuto(e.target.checked)}/>Adjust focus after each round</label>
      <p>Higher focus favors familiar moves among equally strong plays.</p>
      <dl><div><dt>Playing style</dt><dd>{getBotPersona(agent.focusLevel)}</dd></div>
        <div><dt>Exploration temperature</dt><dd>{tau.toFixed(2)}</dd></div>
        <div><dt>Memory retention</dt><dd>{Math.round(decayRate * 1000) / 10}%</dd></div>
        <div><dt>Rounds learned</dt><dd>{agent.gamesLearned}</dd></div></dl>
      <ResetControl target="bot memory" confirming={confirm} setConfirming={setConfirm} reset={reset}/>
    </div>
  </details>;
}
