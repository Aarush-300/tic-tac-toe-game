import { Keyboard } from 'lucide-react';

export function Footer() {
  return <footer className="footer">
    <span><Keyboard aria-hidden="true"/>On the board</span>
    <span><kbd>Arrows</kbd> Navigate</span><span><kbd>Enter</kbd> Mark</span>
    <span><kbd>U</kbd> Undo</span><span><kbd>N</kbd> New round</span>
  </footer>;
}
