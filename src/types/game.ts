export type Player = 'X' | 'O';
export type SquareValue = Player | null;
export type BoardState = SquareValue[];

export type GameMode = 'pvp' | 'ai-casual' | 'ai-tactician' | 'ai-adaptive';
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
