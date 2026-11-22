# Grid Club · Tic Tac Toe

Play a friend on the same device or pick one of three computer opponents. X opens every round. Get three marks across, down or diagonally to win.

## Opponents

| Opponent | How it plays |
| --- | --- |
| Club Player | Takes immediate wins and blocks immediate threats. Its weighted opening choices leave room for a well-played fork. |
| Tactician | Searches to the end of the game with memoized minimax. It takes the fastest forced win and can always secure at least a draw from a fresh board. The default for new players. |
| Adaptive Bot | Uses the same optimal move set. A local, symmetry-aware learning table chooses among equally strong moves. Focus changes how often it uses a familiar move. |
| Two players | X and O take turns on one screen. |

Open **Bot settings** under Adaptive Bot to change focus, toggle automatic adjustment or reset learning. The bot starts with 150 self-play rounds. The learned-round counter tracks completed games you play against it.

## Play locally

Use Node.js 24.19.0, the version pinned in [.node-version](.node-version).

```sh
npm ci
npm run dev
```

Open the local address Vite prints. The game runs entirely in the browser. Scores, opponent choice, sound and bot memory are saved on this device when browser storage is available. Reloading starts a fresh board.

| Control | Action |
| --- | --- |
| Click or tap | Mark an empty square |
| Tab, then arrow keys | Focus the board and move between squares |
| Enter or Space | Mark the focused square |
| U with the board focused | Undo one local move, or return to your last decision against a bot |
| N with the board focused | Start a new round |

Undoing a completed round also reverses its score and adaptive learning. The scorecard totals all opponents. Resetting the scorecard and resetting bot memory are independent actions.

## Verify a change

```sh
npm run lint
npm test
npm audit
npm run build
```

The solver test walks all **5,478 reachable positions** and checks the moves against an independent bitmask evaluator. It covers both marks, terminal boards and every candidate the learner can select. UI tests exercise timed replies, undo after a draw, scorekeeping, keyboard controls and unavailable storage.

The build runs TypeScript checks and emits a static site in `dist/`. To preview the assets, run `npm run preview`. To exercise Pages response headers locally, use Wrangler from the repository root.

```sh
npx wrangler@4.166.0 pages dev
```

## Deploy to Cloudflare Pages

**Direct Upload** works from your local build. Run `npm run build`, create a Pages project using Direct Upload in the Cloudflare dashboard, and upload the **dist** folder. A Git push is unnecessary. [Cloudflare Direct Upload guide](https://developers.cloudflare.com/pages/get-started/direct-upload/)

For a Git-integrated Pages project, use these settings. [Cloudflare build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)

| Setting | Value |
| --- | --- |
| Project name | `grid-club`, or change the name in `wrangler.jsonc` to match your Pages project |
| Root directory | Repository root |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node.js | `24.19.0` from `.node-version` |

The application requires no secrets, backend services or Pages Functions. The Wrangler configuration points to the same output directory used by the dashboard. [Wrangler configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)

## Security and privacy

Fonts, scripts and styles ship with the site. Pages reads `dist/_headers` to enforce a same-origin content security policy, disable framing and MIME sniffing, and restrict browser permissions. Hashed assets have immutable cache headers. Saved scores and bot data are validated before use. [Cloudflare Pages headers](https://developers.cloudflare.com/pages/configuration/headers/)

## Project map

| Location | Responsibility |
| --- | --- |
| `src/utils/gameLogic.ts` | Win detection, move history reconstruction and full-depth search |
| `src/utils/aiEngine.ts`, `src/utils/qLearning.ts` | Opponent policies, learning, persistence and migration |
| `src/hooks/useTicTacToe.ts` | Turns, timers, undo, rounds and scores |
| `src/components/`, `src/index.css` | Board, opponent selection, scorecard, controls and responsive layout |
| `public/_headers`, `wrangler.jsonc` | Pages response headers and deployment output |
| `public/licenses/` | Licenses for the bundled DM Sans and DM Serif Text fonts |
