import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { getBestMove, boardFromMoves } from './utils/gameLogic';

const square = (i: number) => within(screen.getByRole('grid')).getAllByRole('button')[i];
const choose = (name: RegExp) => fireEvent.click(screen.getByRole('radio', { name }));
const undo = () => fireEvent.click(screen.getByRole('button', { name: 'Undo move' }));
const tick = () => act(() => { vi.advanceTimersByTime(400); });
const marked = () => within(screen.getByRole('grid')).getAllByRole('button')
  .filter(button => !button.getAttribute('aria-label')!.includes('empty')).length;

beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('game screen', () => {
  it('starts with the unbeatable opponent, places a real minimax reply and undoes the pair', () => {
    render(<App/>);
    expect((screen.getByRole('radio', { name: /Tactician/ }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(square(0));
    fireEvent.click(square(1));
    expect(marked()).toBe(1);
    tick();
    expect(square(4).getAttribute('aria-label')).toContain('O');
    undo();
    expect(marked()).toBe(0);
  });

  it('cancels outstanding bot moves on undo, mode switch or new round', () => {
    render(<App/>);
    fireEvent.click(square(0));
    undo();
    tick();
    expect(marked()).toBe(0);
    fireEvent.click(square(0));
    fireEvent.click(screen.getByRole('button', { name: 'New round' }));
    tick();
    expect(marked()).toBe(0);
    fireEvent.click(square(0));
    choose(/Two players/);
    tick();
    expect(marked()).toBe(0);
    fireEvent.click(square(0));
    choose(/Two players/);
    expect(marked()).toBe(1);
  });

  it('rolls a draw back to an X turn with eight marks and counts the replay once', () => {
    render(<App/>);
    const moves: number[] = [];
    while (moves.length < 9) {
      const move = getBestMove(boardFromMoves(moves), 'X')!;
      fireEvent.click(square(move));
      moves.push(move);
      if (moves.length < 9) {
        moves.push(getBestMove(boardFromMoves(moves), 'O')!);
        tick();
      }
    }
    expect(screen.getByRole('status').textContent).toBe('Round drawn');
    expect(JSON.parse(localStorage.getItem('ttt_scores_v2')!).ties).toBe(1);
    undo();
    expect(marked()).toBe(8);
    expect(screen.getByRole('status').textContent).toBe('Your move');
    fireEvent.click(square(moves[8]));
    expect(JSON.parse(localStorage.getItem('ttt_scores_v2')!).ties).toBe(1);
  });

  it('keeps terminal boards closed, undoes a local win, and confirms a score reset', () => {
    render(<App/>);
    choose(/Two players/);
    for (const i of [0, 3, 1, 4, 2, 8]) fireEvent.click(square(i));
    expect(marked()).toBe(5);
    expect(screen.getByRole('status').textContent).toBe('Player X wins!');
    expect(screen.getAllByRole('button', { name: /winning square/ })).toHaveLength(3);
    undo();
    expect(marked()).toBe(4);
    expect(JSON.parse(localStorage.getItem('ttt_scores_v2')!).x).toBe(0);
    fireEvent.click(square(2));
    fireEvent.click(screen.getByRole('button', { name: 'Reset scores' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(JSON.parse(localStorage.getItem('ttt_scores_v2')!).x).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: 'Reset scores' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear scores' }));
    expect(JSON.parse(localStorage.getItem('ttt_scores_v2')!).x).toBe(0);
  });

  it('preserves mode and manual bot settings across remounts', () => {
    const first = render(<App/>);
    choose(/Adaptive Bot/);
    fireEvent.click(screen.getByText('Bot settings'));
    fireEvent.change(screen.getByRole('slider'), { target: { value: '85' } });
    first.unmount();
    render(<App/>);
    expect((screen.getByRole('radio', { name: /Adaptive Bot/ }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByText('Bot settings'));
    expect((screen.getByRole('slider') as HTMLInputElement).value).toBe('85');
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
  });

  it('keeps the board navigable across occupied cells and ignores modified shortcut keys', () => {
    render(<App/>);
    choose(/Two players/);
    act(() => square(0).focus());
    fireEvent.click(square(0));
    fireEvent.keyDown(square(0), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(square(1));
    fireEvent.keyDown(square(1), { key: 'n', ctrlKey: true });
    expect(marked()).toBe(1);
    fireEvent.keyDown(square(1), { key: 'u' });
    expect(marked()).toBe(0);
  });

  it('plays with blocked storage and recovers from invalid saved scores', () => {
    localStorage.setItem('ttt_scores_v2', '{"x":-1,"o":0,"ties":0}');
    const first = render(<App/>);
    expect(JSON.parse(localStorage.getItem('ttt_scores_v2')!).x).toBe(0);
    first.unmount();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    render(<App/>);
    choose(/Adaptive Bot/);
    fireEvent.click(square(0));
    tick();
    expect(marked()).toBe(2);
    fireEvent.click(screen.getByRole('button', { name: /Sound (on|off)/ }));
  });
});
