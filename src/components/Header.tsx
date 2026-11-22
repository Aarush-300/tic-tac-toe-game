import { useRef } from 'react';
import { CircleHelp, Volume2, VolumeX, X } from 'lucide-react';

export function Header({ isMuted, toggleMute }: { isMuted: boolean; toggleMute: () => void }) {
  const rules = useRef<HTMLDialogElement>(null);
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="wordmark"><span className="club-mark" aria-hidden="true"><i/><i/><i/><i/></span>Grid Club</div>
        <nav aria-label="Game tools">
          <button onClick={toggleMute} aria-label={isMuted ? 'Sound off' : 'Sound on'} aria-pressed={!isMuted}>
            {isMuted ? <VolumeX/> : <Volume2/>}<span>Sound {isMuted ? 'off' : 'on'}</span>
          </button>
          <span className="nav-rule" aria-hidden="true"/>
          <button onClick={() => rules.current?.showModal()}><CircleHelp/><span>How to play</span></button>
        </nav>
      </div>
      <dialog ref={rules} aria-labelledby="rules-heading">
        <div className="section-head"><h2 id="rules-heading">How to play</h2>
          <form method="dialog"><button className="icon-button" aria-label="Close rules" autoFocus><X/></button></form>
        </div>
        <p>X goes first. Take turns placing a mark in an empty square. Get three in a row across, down or diagonally to win.</p>
        <p>A full board with no winning line is a draw. Against a bot, you always play X. Choose Two players to share the board with a friend.</p>
        <h3>Playing with a keyboard</h3>
        <p>Tab to the board. Use the arrow keys to choose a square and Enter or Space to mark it. While the board has focus, U undoes your move and N starts a new round.</p>
      </dialog>
    </header>
  );
}

export function GamePieces() {
  return (
    <div aria-hidden="true" className="game-pieces">
      <div className="piece-art art-x"><i/><i/><i/><i/><i/></div>
      <div className="piece-art art-o"><i/><i/><i/><i/><i/></div>
    </div>
  );
}
