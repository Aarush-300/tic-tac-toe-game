import { RotateCcw, Undo2 } from 'lucide-react';

export function Controls({ newRound, undo, canUndo }: { newRound: () => void; undo: () => void; canUndo: boolean }) {
  return <div className="actions">
    <button className="primary-button" onClick={newRound}><RotateCcw/>New round</button>
    <button className="secondary-button" disabled={!canUndo} onClick={undo}><Undo2/>Undo move</button>
  </div>;
}

export function ResetControl({ target, confirming, setConfirming, reset }: {
  target: 'scores' | 'bot memory'; confirming: boolean; setConfirming: (value: boolean) => void; reset: () => void;
}) {
  return confirming ? <div className="confirm-actions">
    <button className="text-button" onClick={() => setConfirming(false)}>Cancel</button>
    <button className="text-button danger" onClick={() => { reset(); setConfirming(false); }}>Clear {target}</button>
  </div> : <button className="text-button" onClick={() => setConfirming(true)}><RotateCcw/>Reset {target}</button>;
}
