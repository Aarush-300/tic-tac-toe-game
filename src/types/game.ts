export type Player = 'X' | 'O';
export type SquareValue = Player | null;
export type BoardState = SquareValue[];

export type GameMode = 'pvp' | 'ai-casual' | 'ai-tactician' | 'ai-adaptive';
export const opponents = {
  'ai-casual': { name: 'Club Player', detail: 'Casual · plays for fun', icon: 'club' },
  'ai-tactician': { name: 'Tactician', detail: 'Unbeatable · minimax', icon: 'tactician' },
  'ai-adaptive': { name: 'Adaptive Bot', detail: 'Learns from your games', icon: 'adaptive' },
  pvp: { name: 'Two players', detail: 'Share this device', icon: 'local' },
} as const;
export type Winner = Player | 'Draw' | null;
export type WinningLine = [number, number, number] | null;

export interface ScoreState {
  x: number;
  o: number;
  ties: number;
}

export interface GameStatus {
  winner: Winner;
  winningLine: WinningLine;
}
