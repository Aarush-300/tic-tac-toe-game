import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameMode, Player, ScoreState } from '../types/game';
import { boardFromMoves, checkWinner } from '../utils/gameLogic';
import { getAdaptiveBotMove, getClubPlayerMove, getTacticianMove } from '../utils/aiEngine';
import { QLearningAgent } from '../utils/qLearning';
import { isCounter, readSaved, writeSaved } from '../utils/storage';
import { sound } from '../utils/sound';

const SCORES = 'ttt_scores_v2';
const MODE = 'ttt_gamemode_v2';
const zero: ScoreState = { x: 0, ties: 0, o: 0 };
const scoreKey = { X: 'x', O: 'o', Draw: 'ties' } as const;

function initialScores(): ScoreState {
  try {
    const data = JSON.parse(readSaved(SCORES) ?? 'null');
    if (data && [data.x, data.o, data.ties].every(isCounter)) {
      return { x: data.x, o: data.o, ties: data.ties };
    }
  } catch { /* Start a fresh scorecard if the old one is unreadable. */ }
  return zero;
}

function initialMode(): GameMode {
  const saved = readSaved(MODE);
  if (saved === 'pvp' || saved === 'ai-adaptive' || saved === 'ai-casual') return saved;
  return 'ai-tactician';
}

export function useTicTacToe() {
  const [moves, setMoves] = useState<number[]>([]);
  const [round, setRound] = useState(1);
  const [gameMode, setMode] = useState<GameMode>(initialMode);
  const [scores, setScores] = useState(initialScores);
  const [isMuted, setMuted] = useState(sound.isMuted);
  const [agent, setAgent] = useState(() => gameMode === 'ai-adaptive' ? new QLearningAgent() : null);
  const [, refreshTuner] = useState(0);
  const board = useMemo(() => boardFromMoves(moves), [moves]);
  const { winner, winningLine } = checkWinner(board);
  const turn: Player = moves.length % 2 === 0 ? 'X' : 'O';
  const isAiThinking = !winner && turn === 'O' && gameMode !== 'pvp';
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => { writeSaved(SCORES, JSON.stringify(scores)); }, [scores]);
  useEffect(() => { writeSaved(MODE, gameMode); }, [gameMode]);

  const place = useCallback((index: number) => {
    if (winner || board[index] !== null) return;
    const next = [...moves, index];
    const result = checkWinner(boardFromMoves(next)).winner;
    sound.playMove(turn);
    setMoves(next);
    if (result) {
      if (result === 'Draw') sound.playDraw();
      else sound.playWin();
      const key = scoreKey[result];
      setScores(prev => ({ ...prev, [key]: Math.min(Number.MAX_SAFE_INTEGER, prev[key] + 1) }));
      if (gameMode === 'ai-adaptive') agent?.finalizeGame(next, result);
    }
  }, [agent, board, gameMode, moves, turn, winner]);

  useEffect(() => {
    if (!isAiThinking) return;
    timer.current = setTimeout(() => {
      let move: number | null;
      if (gameMode === 'ai-adaptive' && agent) move = getAdaptiveBotMove(board, 'O', agent);
      else if (gameMode === 'ai-casual') move = getClubPlayerMove(board);
      else move = getTacticianMove(board);
      if (move !== null) place(move);
    }, 320);
    return () => clearTimeout(timer.current);
  }, [agent, board, gameMode, isAiThinking, place]);

  function newRound() {
    clearTimeout(timer.current);
    setMoves([]);
    setRound(value => value + 1);
    sound.playClick();
  }

  function selectMode(mode: GameMode) {
    if (mode === gameMode) return;
    if (mode === 'ai-adaptive' && !agent) setAgent(new QLearningAgent());
    newRound();
    setMode(mode);
  }

  function undo() {
    if (!moves.length) return;
    clearTimeout(timer.current);
    if (winner) {
      const key = scoreKey[winner];
      setScores(prev => ({ ...prev, [key]: Math.max(0, prev[key] - 1) }));
      if (gameMode === 'ai-adaptive') agent?.undoResult();
    }
    // Return to the last human decision, including a draw on X's ninth move
    // or a human move whose scheduled AI reply has not yet arrived.
    const count = gameMode === 'pvp' || moves.length % 2 === 1 ? 1 : 2;
    setMoves(moves.slice(0, -count));
    sound.playClick();
  }

  return {
    board, moves, round, turn, gameMode, scores, winner, winningLine, isMuted, isAiThinking, agent,
    play: (index: number) => { if (!isAiThinking) place(index); },
    newRound, undo, selectMode,
    resetScores: () => setScores(zero),
    toggleMute: () => setMuted(sound.toggleMute()),
    setFocus: (level: number) => { agent?.setFocusLevel(level); refreshTuner(n => n + 1); },
    setAuto: (enabled: boolean) => { agent?.setAutoAdapt(enabled); refreshTuner(n => n + 1); },
    resetMemory: () => { agent?.resetMemory(); refreshTuner(n => n + 1); },
  };
}
