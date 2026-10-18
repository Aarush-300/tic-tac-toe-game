import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App Component and User Interaction', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the game header, mode selector, and scoreboard', () => {
    render(<App />);
    expect(screen.getByText('TIC-TAC-TOE')).toBeDefined();
    expect(screen.getByText('Local PvP')).toBeDefined();
    expect(screen.getByText('Club Player')).toBeDefined();
    expect(screen.getByText('Tactician')).toBeDefined();
    expect(screen.getByText('Adaptive Bot')).toBeDefined();
    expect(screen.getByText('DRAWS')).toBeDefined();
  });

  it('renders 9 board cells as accessible buttons with proper aria-labels', () => {
    render(<App />);
    const buttons = screen.getAllByRole('gridcell');
    expect(buttons.length).toBe(9);
    expect(buttons[0].getAttribute('aria-label')).toBe('Row 1, Column 1, empty');
    expect(buttons[8].getAttribute('aria-label')).toBe('Row 3, Column 3, empty');
  });

  it('allows clicking an empty cell to place an X mark', () => {
    render(<App />);
    const buttons = screen.getAllByRole('gridcell');
    fireEvent.click(buttons[0]);
    expect(buttons[0].getAttribute('aria-label')).toBe('Row 1, Column 1, marked X');
  });

  it('resets board when clicking NEW ROUND', () => {
    render(<App />);
    const buttons = screen.getAllByRole('gridcell');
    fireEvent.click(buttons[0]);
    expect(buttons[0].getAttribute('aria-label')).toBe('Row 1, Column 1, marked X');

    const newRoundButton = screen.getByText('NEW ROUND');
    fireEvent.click(newRoundButton);
    expect(buttons[0].getAttribute('aria-label')).toBe('Row 1, Column 1, empty');
  });

  it('allows undoing a move in PvP mode', () => {
    render(<App />);
    // Select Local PvP
    const pvpTab = screen.getByRole('tab', { name: /Local PvP/i });
    fireEvent.click(pvpTab);

    const buttons = screen.getAllByRole('gridcell');
    fireEvent.click(buttons[0]);
    expect(buttons[0].getAttribute('aria-label')).toBe('Row 1, Column 1, marked X');

    const undoButton = screen.getByRole('button', { name: /undo move/i });
    fireEvent.click(undoButton);
    expect(buttons[0].getAttribute('aria-label')).toBe('Row 1, Column 1, empty');
  });

  it('displays generation badge when Adaptive Bot mode is selected', () => {
    render(<App />);
    const adaptiveTab = screen.getByRole('tab', { name: /Adaptive Bot/i });
    fireEvent.click(adaptiveTab);

    expect(screen.getByText(/Learned from you:/i)).toBeDefined();
    expect(screen.getByText(/Confidence:/i)).toBeDefined();
    expect(screen.getByText(/Wipe Memory/i)).toBeDefined();
  });
});
