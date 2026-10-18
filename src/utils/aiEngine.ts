import type { BoardState, Player } from '../types/game';
import { checkWinner, getAvailableMoves, WINNING_LINES } from './gameLogic';
import { qLearningAgent } from './qLearning';

const CORNERS = [0, 2, 6, 8] as const;
const EDGES = [1, 3, 5, 7] as const;
const CENTER = 4;

/**
 * Samples an item from a list of items with scores using Softmax distribution with temperature.
 */
export function softmaxSample<T>(
  candidates: { item: T; score: number }[],
  temperature: number = 1.0
): T {
  if (candidates.length === 0) {
    throw new Error('Cannot sample from empty candidates list');
  }
  if (candidates.length === 1) {
    return candidates[0].item;
  }

  const maxScore = Math.max(...candidates.map((c) => c.score));
  const t = Math.max(temperature, 0.05);
  const expScores = candidates.map((c) => Math.exp((c.score - maxScore) / t));
  const total = expScores.reduce((sum, val) => sum + val, 0);

  const rand = Math.random() * total;
  let running = 0;
  for (let i = 0; i < candidates.length; i++) {
    running += expScores[i];
    if (rand <= running) {
      return candidates[i].item;
    }
  }

  return candidates[candidates.length - 1].item;
}

/**
 * Finds an immediate winning move for the given player if one exists.
 */
export function findImmediateWin(board: BoardState, player: Player): number | null {
  const availableMoves = getAvailableMoves(board);
  for (const move of availableMoves) {
    board[move] = player;
    const { winner } = checkWinner(board);
    board[move] = null;
    if (winner === player) {
      return move;
    }
  }
  return null;
}

/**
 * CLUB PLAYER (Casual - Beatable via Strategy)
 * - 1-step lookahead only.
 * - Takes immediate win 90% of the time.
 * - Blocks opponent immediate win 75% of the time.
 * - Otherwise: weighted positional heuristic (Center ~30%, Corners ~50%, Edges ~20%) with Softmax noise.
 */
export function getClubPlayerMove(board: BoardState, aiPlayer: Player = 'O'): number | null {
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) return null;

  const humanPlayer: Player = aiPlayer === 'X' ? 'O' : 'X';

  // 1. Immediate Win check (90% execution rate)
  const immediateWin = findImmediateWin(board, aiPlayer);
  if (immediateWin !== null && Math.random() < 0.9) {
    return immediateWin;
  }

  // 2. Immediate Threat Block check (75% execution rate)
  const immediateThreat = findImmediateWin(board, humanPlayer);
  if (immediateThreat !== null && Math.random() < 0.75) {
    return immediateThreat;
  }

  // 3. Positional heuristics with Softmax
  // Center = 30%, Corners = 50%, Edges = 20%
  const openCorners = availableMoves.filter((m) => CORNERS.includes(m as 0 | 2 | 6 | 8));
  const openEdges = availableMoves.filter((m) => EDGES.includes(m as 1 | 3 | 5 | 7));
  const isCenterOpen = board[CENTER] === null;

  const cornerWeight = openCorners.length > 0 ? 50 / openCorners.length : 0;
  const edgeWeight = openEdges.length > 0 ? 20 / openEdges.length : 0;
  const centerWeight = isCenterOpen ? 30 : 0;

  const candidates: { item: number; score: number }[] = availableMoves.map((move) => {
    let score = 10;
    if (move === CENTER) {
      score += centerWeight;
    } else if (CORNERS.includes(move as 0 | 2 | 6 | 8)) {
      score += cornerWeight;
    } else {
      score += edgeWeight;
    }
    return { item: move, score };
  });

  return softmaxSample(candidates, 1.2);
}

/**
 * Heuristic evaluation at depth limit for Tactician Minimax.
 */
function evaluateBoardHeuristic(board: BoardState, aiPlayer: Player): number {
  const humanPlayer: Player = aiPlayer === 'X' ? 'O' : 'X';
  let score = 0;

  for (const [a, b, c] of WINNING_LINES) {
    const line = [board[a], board[b], board[c]];
    const aiCount = line.filter((sq) => sq === aiPlayer).length;
    const humanCount = line.filter((sq) => sq === humanPlayer).length;

    if (aiCount === 2 && humanCount === 0) score += 3.0;
    if (humanCount === 2 && aiCount === 0) score -= 3.0;
    if (aiCount === 1 && humanCount === 0) score += 0.5;
    if (humanCount === 1 && aiCount === 0) score -= 0.5;
  }

  if (board[CENTER] === aiPlayer) score += 0.5;
  if (board[CENTER] === humanPlayer) score -= 0.5;

  return score;
}

/**
 * Evaluates candidate moves for Tactician using depth-limited Minimax (depth = 2).
 */
function evaluateTacticianMove(
  board: BoardState,
  move: number,
  aiPlayer: Player,
  humanPlayer: Player
): number {
  board[move] = aiPlayer;
  const { winner: winAfterAi } = checkWinner(board);

  if (winAfterAi === aiPlayer) {
    board[move] = null;
    return 10.0;
  }
  if (winAfterAi === 'Draw') {
    board[move] = null;
    return 0.0;
  }

  // Opponent turn (human)
  const humanReplies = getAvailableMoves(board);
  let minHumanScore = Infinity;

  for (const reply of humanReplies) {
    board[reply] = humanPlayer;
    const { winner: winAfterHuman } = checkWinner(board);

    let replyScore: number;
    if (winAfterHuman === humanPlayer) {
      replyScore = -10.0;
    } else if (winAfterHuman === 'Draw') {
      replyScore = 0.0;
    } else {
      // Depth limit = 2 reached, evaluate board heuristic
      replyScore = evaluateBoardHeuristic(board, aiPlayer);
    }

    board[reply] = null;
    minHumanScore = Math.min(minHumanScore, replyScore);
  }

  board[move] = null;
  return minHumanScore;
}

/**
 * TACTICIAN (Challenging - Vulnerable Only to Clever Forks)
 * - 100% takes immediate wins.
 * - 100% blocks immediate 1-move threats.
 * - Depth-limited Minimax (depth = 2) with Softmax selection (temperature = 0.8) among top 2 moves.
 */
export function getTacticianMove(board: BoardState, aiPlayer: Player = 'O'): number | null {
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) return null;
  if (availableMoves.length === 1) return availableMoves[0];

  const humanPlayer: Player = aiPlayer === 'X' ? 'O' : 'X';

  // 1. Always take immediate win (100%)
  const immediateWin = findImmediateWin(board, aiPlayer);
  if (immediateWin !== null) {
    return immediateWin;
  }

  // 2. Always block immediate threat (100%)
  const immediateThreat = findImmediateWin(board, humanPlayer);
  if (immediateThreat !== null) {
    return immediateThreat;
  }

  // 3. Depth-limited Minimax (depth = 2)
  const scoredMoves: { item: number; score: number }[] = availableMoves.map((move) => ({
    item: move,
    score: evaluateTacticianMove(board, move, aiPlayer, humanPlayer),
  }));

  // Sort candidate moves by score descending
  scoredMoves.sort((a, b) => b.score - a.score);

  // Select between top 2 moves using Softmax with temperature 0.8
  const topCandidates = scoredMoves.slice(0, 2);
  return softmaxSample(topCandidates, 0.8);
}

/**
 * ADAPTIVE BOT (Rubber-Banding Q-Learning Agent)
 * - 1-Ply Reflex: Takes immediate wins 85% of the time (leaves human-like blunders).
 * - Blocks immediate human threats with blockProbability = clamp(1.0 - botTemperature, 0.50, 0.85).
 * - Uses dynamic temperature Boltzmann Softmax sampling over top 3 legal moves.
 * - Records state transitions for live counterfactual imitation and memory decay.
 */
export function getAdaptiveBotMove(board: BoardState, aiPlayer: Player = 'O'): number | null {
  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) return null;

  const humanPlayer: Player = aiPlayer === 'X' ? 'O' : 'X';

  // 1. Immediate 1-Move Win Check (85% execution rate)
  const immediateWin = findImmediateWin(board, aiPlayer);
  if (immediateWin !== null && Math.random() < 0.85) {
    qLearningAgent.recordBotStep(board, immediateWin, aiPlayer);
    return immediateWin;
  }

  // 2. Immediate 1-Move Threat Block Check based on dynamic focus (50% to 85%)
  const immediateThreat = findImmediateWin(board, humanPlayer);
  if (immediateThreat !== null) {
    const blockProbability = Math.min(
      0.85,
      Math.max(0.50, 1.0 - qLearningAgent.botTemperature)
    );
    if (Math.random() < blockProbability) {
      qLearningAgent.recordBotStep(board, immediateThreat, aiPlayer);
      return immediateThreat;
    }
  }

  // 3. Consult Q-table using dynamic temperature Boltzmann Softmax over top 3 moves
  const chosenMove = qLearningAgent.selectAction(
    board,
    availableMoves,
    aiPlayer,
    qLearningAgent.botTemperature
  );
  qLearningAgent.recordBotStep(board, chosenMove, aiPlayer);
  return chosenMove;
}
