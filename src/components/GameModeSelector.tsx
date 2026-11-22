import type { GameMode } from '../types/game';

import { opponents } from '../types/game';

// Each silhouette is drawn on the same twelve-pixel grid.
const avatars = {
  club: ['000011110000','001111111100','011111111110','111111111111','111001100111','111001100111','111111111111','011100001110','011111111110','001100001100'],
  tactician: ['010000000010','011000000110','011111111110','111111111111','111111111111','110001100011','111001100111','011111111110','001110011100','000111111000'],
  adaptive: ['000011000000','000001100000','000000100000','001111111100','011111111110','111001100111','111001100111','111111111111','011010010110','001111111100'],
  local: ['000000011100','001100111110','011110111110','011110011100','001100000000','000000111110','011110111111','111111111111','111111000000','111111000000'],
};

function Avatar({ kind }: { kind: keyof typeof avatars }) {
  const path = avatars[kind].flatMap((row, y) => [...row].map((dot, x) =>
    dot === '1' ? `M${x} ${y}h1v1h-1z` : ''
  )).join('');
  return <span className={'avatar ' + kind}><svg viewBox="-1 -2 14 14" aria-hidden="true" shapeRendering="crispEdges"><path d={path}/></svg></span>;
}

export function GameModeSelector({ currentMode, selectMode }: { currentMode: GameMode; selectMode: (mode: GameMode) => void }) {
  return (
    <fieldset className="opponents">
      <legend>Choose opponent</legend>
      {(Object.keys(opponents) as GameMode[]).map(id => (
        <label key={id} className="opponent">
          <input type="radio" name="opponent" checked={currentMode === id} onChange={() => selectMode(id)}/>
          <Avatar kind={opponents[id].icon}/>
          <span className="opponent-copy"><strong>{opponents[id].name}</strong><span>{opponents[id].detail}</span></span>
          <span className="radio-dot" aria-hidden="true"/>
        </label>
      ))}
    </fieldset>
  );
}
