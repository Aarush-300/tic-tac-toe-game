import { useTicTacToe } from './hooks/useTicTacToe';
import { Header, GamePieces } from './components/Header';
import { GameModeSelector } from './components/GameModeSelector';
import { opponents } from './types/game';
import { BotTuner } from './components/BotTuner';
import { Scoreboard } from './components/Scoreboard';
import { StatusBanner } from './components/StatusBanner';
import { Board } from './components/Board';
import { Controls } from './components/Controls';
import { Footer } from './components/Footer';

export default function App() {
  const game = useTicTacToe();
  const local = game.gameMode === 'pvp';
  return <>
    <Header isMuted={game.isMuted} toggleMute={game.toggleMute}/>
    <main className="room">
      <div className="intro">
        <div><h1>Tic Tac <em>Toe</em></h1><p>Get three in a row, in any direction.</p></div>
        <GamePieces/>
      </div>
      <div className="game-layout">
        <section className="play-area" aria-label="Game table">
          <div className="table">
            <StatusBanner winner={game.winner} turn={game.turn} local={local} round={game.round}/>
            <Board board={game.board} winningLine={game.winningLine} turn={game.turn}
              locked={!!game.winner || game.isAiThinking} play={game.play} undo={game.undo} newRound={game.newRound}/>
            <div className="table-key">
              <span><i className="mini-mark mark-X"/>{local ? 'Player X' : 'You'}</span>
              <span><i className="mini-mark mark-O"/>{local ? 'Player O' : opponents[game.gameMode].name}</span>
            </div>
          </div>
          <Controls newRound={game.newRound} undo={game.undo} canUndo={game.moves.length > 0}/>
        </section>
        <aside>
          <GameModeSelector currentMode={game.gameMode} selectMode={game.selectMode}/>
          {game.gameMode === 'ai-adaptive' && game.agent && <BotTuner agent={game.agent} setFocus={game.setFocus} setAuto={game.setAuto} reset={game.resetMemory}/>}
          <Scoreboard scores={game.scores} reset={game.resetScores}/>
        </aside>
      </div>
      <Footer/>
    </main>
  </>;
}
