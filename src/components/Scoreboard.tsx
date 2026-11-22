import { useState } from 'react';
import type { ScoreState } from '../types/game';
import { ResetControl } from './Controls';

export function Scoreboard({ scores, reset }: { scores: ScoreState; reset: () => void }) {
  const [confirm, setConfirm] = useState(false);
  return <section className="scorecard" aria-labelledby="score-title">
    <div className="section-head"><h2 id="score-title">Scorecard</h2>
      <ResetControl target="scores" confirming={confirm} setConfirming={setConfirm} reset={reset}/>
    </div>
    <dl>{([['x', 'X wins'], ['ties', 'Draws'], ['o', 'O wins']] as const).map(([key, label]) =>
      <div key={key}><dt><i className={'score-symbol symbol-' + key} aria-hidden="true"/>{label}</dt><dd>{String(scores[key]).padStart(2, '0')}</dd></div>
    )}</dl>
    <p>All opponents combined</p>
  </section>;
}
