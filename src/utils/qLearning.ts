import type { BoardState, Player, Winner } from '../types/game';
import { checkWinner, getAvailableMoves } from './gameLogic';

const Q_TABLE_STORAGE_KEY = 'ttt_q_table_v2';
const Q_GAMES_COUNT_KEY = 'ttt_q_games_learned_v2';

export interface QStep {
  state: string;
  action: number;
}

export class QLearningAgent {
  public qTable: Record<string, Record<number, number>> = {};
  public gamesLearned: number = 0;
  private currentEpisodeSteps: QStep[] = [];

  // Hyperparameters
  private readonly alpha = 0.2; // Learning rate
  private readonly gamma = 0.9; // Discount factor

  constructor() {
    this.loadFromStorage();
    if (Object.keys(this.qTable).length === 0) {
      this.preWarmPolicy(300);
      this.saveToStorage();
    }
  }

  /**
   * Serializes a board state into a 9-character string.
   */
  public serializeState(board: BoardState): string {
    return board.map((cell) => (cell === null ? '.' : cell)).join('');
  }

  /**
   * Retrieves or initializes Q-values for all legal moves in a given state.
   */
  public getQValues(stateStr: string, availableMoves: number[]): Record<number, number> {
    if (!this.qTable[stateStr]) {
      this.qTable[stateStr] = {};
    }
    for (const move of availableMoves) {
      if (this.qTable[stateStr][move] === undefined) {
        this.qTable[stateStr][move] = 0.0;
      }
    }
    return this.qTable[stateStr];
  }

  /**
   * Selects an action using epsilon-greedy policy over legal moves.
   */
  public selectAction(
    board: BoardState,
    availableMoves: number[],
    epsilon: number = 0.05
  ): number {
    if (availableMoves.length === 0) return 0;
    if (availableMoves.length === 1) return availableMoves[0];

    // Exploration
    if (Math.random() < epsilon) {
      const randomIndex = Math.floor(Math.random() * availableMoves.length);
      return availableMoves[randomIndex];
    }

    // Exploitation: Pick move with highest Q-value
    const stateStr = this.serializeState(board);
    const qValues = this.getQValues(stateStr, availableMoves);

    let maxQ = -Infinity;
    let bestMoves: number[] = [];

    for (const move of availableMoves) {
      const q = qValues[move] ?? 0;
      if (q > maxQ) {
        maxQ = q;
        bestMoves = [move];
      } else if (Math.abs(q - maxQ) < 1e-6) {
        bestMoves.push(move);
      }
    }

    // Random tie-breaker among moves with equal best Q-value
    const chosenIndex = Math.floor(Math.random() * bestMoves.length);
    return bestMoves[chosenIndex];
  }

  /**
   * Records a step taken during the current game episode.
   */
  public recordStep(board: BoardState, action: number): void {
    const stateStr = this.serializeState(board);
    this.currentEpisodeSteps.push({ state: stateStr, action });
  }

  /**
   * Updates the Q-table using the episode trajectory when the game finishes.
   */
  public finalizeGame(winner: Winner, aiPlayer: Player = 'O'): number {
    if (this.currentEpisodeSteps.length === 0) {
      return this.gamesLearned;
    }

    // Determine final reward
    let reward = 0;
    if (winner === aiPlayer) {
      reward = 1.0;
    } else if (winner === 'Draw') {
      reward = 0.3; // Positive reinforcement for securing a tie
    } else if (winner !== null) {
      reward = -1.0; // Negative reinforcement for loss
    }

    // Backward Q-value updates
    let nextMaxQ = 0;
    for (let i = this.currentEpisodeSteps.length - 1; i >= 0; i--) {
      const { state, action } = this.currentEpisodeSteps[i];
      if (!this.qTable[state]) {
        this.qTable[state] = {};
      }
      const currentQ = this.qTable[state][action] ?? 0.0;
      const target = reward + this.gamma * nextMaxQ;
      this.qTable[state][action] = currentQ + this.alpha * (target - currentQ);

      // Max Q for prior step
      const actions = Object.values(this.qTable[state]);
      nextMaxQ = actions.length > 0 ? Math.max(...actions) : 0;
      reward = 0; // Immediate reward for non-terminal moves is 0
    }

    this.currentEpisodeSteps = [];
    this.gamesLearned += 1;
    this.saveToStorage();
    return this.gamesLearned;
  }

  /**
   * Clears episode history without saving.
   */
  public resetCurrentEpisode(): void {
    this.currentEpisodeSteps = [];
  }

  /**
   * Pre-trains the agent with simulated self-play games.
   */
  public preWarmPolicy(episodes: number = 300): void {
    for (let ep = 0; ep < episodes; ep++) {
      const board: BoardState = Array(9).fill(null);
      let turn: Player = 'X';
      const episodeStepsX: QStep[] = [];
      const episodeStepsO: QStep[] = [];

      while (checkWinner(board).winner === null) {
        const moves = getAvailableMoves(board);
        if (moves.length === 0) break;

        const action = this.selectAction(board, moves, 0.25);
        const stateStr = this.serializeState(board);

        if (turn === 'X') {
          episodeStepsX.push({ state: stateStr, action });
          board[action] = 'X';
          turn = 'O';
        } else {
          episodeStepsO.push({ state: stateStr, action });
          board[action] = 'O';
          turn = 'X';
        }
      }

      const { winner } = checkWinner(board);

      // Update O transitions
      const rewardO = winner === 'O' ? 1.0 : winner === 'Draw' ? 0.3 : -1.0;
      this.applyTrajectoryUpdate(episodeStepsO, rewardO);

      // Update X transitions
      const rewardX = winner === 'X' ? 1.0 : winner === 'Draw' ? 0.3 : -1.0;
      this.applyTrajectoryUpdate(episodeStepsX, rewardX);
    }
  }

  private applyTrajectoryUpdate(steps: QStep[], finalReward: number): void {
    let nextMaxQ = 0;
    let reward = finalReward;
    for (let i = steps.length - 1; i >= 0; i--) {
      const { state, action } = steps[i];
      if (!this.qTable[state]) {
        this.qTable[state] = {};
      }
      const currentQ = this.qTable[state][action] ?? 0.0;
      const target = reward + this.gamma * nextMaxQ;
      this.qTable[state][action] = currentQ + this.alpha * (target - currentQ);

      const actions = Object.values(this.qTable[state]);
      nextMaxQ = actions.length > 0 ? Math.max(...actions) : 0;
      reward = 0;
    }
  }

  /**
   * Clears learned user weights, resets generation counter, and re-seeds baseline policy.
   */
  public resetMemory(): void {
    this.qTable = {};
    this.gamesLearned = 0;
    this.currentEpisodeSteps = [];
    this.preWarmPolicy(300);
    this.saveToStorage();
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(Q_TABLE_STORAGE_KEY, JSON.stringify(this.qTable));
      localStorage.setItem(Q_GAMES_COUNT_KEY, String(this.gamesLearned));
    } catch {
      // Storage quota or privacy mode error handling
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const savedCount = localStorage.getItem(Q_GAMES_COUNT_KEY);
      if (savedCount !== null) {
        this.gamesLearned = parseInt(savedCount, 10) || 0;
      }
      const savedTable = localStorage.getItem(Q_TABLE_STORAGE_KEY);
      if (savedTable) {
        this.qTable = JSON.parse(savedTable);
      }
    } catch {
      this.qTable = {};
      this.gamesLearned = 0;
    }
  }
}

export const qLearningAgent = new QLearningAgent();
