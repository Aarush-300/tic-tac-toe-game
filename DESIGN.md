---
name: Grid Club
description: A tic-tac-toe table with green felt, a cream paper scorecard and two distinct playing pieces.
colors:
  paper: "#f8f7ef"
  ink: "#183d31"
  muted: "#58675c"
  line: "#d4d8c8"
  green: "#204f3f"
  lime: "#d8ed82"
  coral: "#ffab87"
typography:
  display:
    fontFamily: "'DM Serif Text', Georgia, serif"
    fontSize: "clamp(3.4rem, 6.3vw, 5.15rem)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "'DM Serif Text', Georgia, serif"
    fontSize: "1.7rem"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-0.03em"
  body:
    fontFamily: "'DM Sans Variable', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
  action:
    fontFamily: "'DM Sans Variable', system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 700
  score:
    fontFamily: "'DM Sans Variable', system-ui, sans-serif"
    fontSize: "1.85rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.04em"
rounded:
  board: "3px"
  utility: "6px"
  control: "8px"
  opponent: "10px"
  dialog: "14px"
  table: "16px"
spacing:
  small: "8px"
  medium: "12px"
  section: "16px"
  table: "24px"
components:
  button-primary:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
  button-secondary:
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
  button-text:
    textColor: "{colors.muted}"
    rounded: "{rounded.utility}"
    padding: "5px 8px"
  game-tools:
    textColor: "{colors.ink}"
    rounded: "{rounded.utility}"
  opponent-row:
    backgroundColor: "#fdfcf5"
    rounded: "{rounded.opponent}"
    padding: "9px 14px 9px 10px"
  felt-grid:
    backgroundColor: "{colors.green}"
    rounded: "{rounded.board}"
  scorecard:
    textColor: "{colors.ink}"
---

# Grid Club design system

## Overview

**Creative North Star** · “Tabletop club scorecard”

The green felt holds the game. Cream paper carries the instructions, opponent choices and scores. A tilted four-tile monogram and a pair of illustrated game pieces identify the club before the first move.

The same cross and ring appear on the board and in its player key. A small serif heading, a thin rule and aligned digits give the scorecard the feel of a printed record.

**Key characteristics**

- A pale page around a dark playing table.
- Citron crosses and coral rings with written player labels.
- Serif headings and compact sans-serif controls.

## Colors

The felt green fills the table insert. Deep green ink frames it and carries text on paper. Muted ink handles supporting copy, and a pale rule divides navigation, scores and footer. Citron marks X and fills New round. Coral marks O. On the light scorecard, darker versions of the cross and ring retain their outlines beside the labels.

**Player identification.** Keep X a cross and O a ring on both felt and paper. Use a written label wherever the symbols identify the players.

## Typography

DM Serif Text gives the game title and section headings their soft curves. The title sets “Toe” in italic. DM Sans Variable handles the wordmark, instructions, buttons and numbers. Scores and round counts use tabular digits. The compact uppercase round count gains a little letter spacing (0.08em).

## Layout

The desktop room centers at a maximum width of 1032px with at least 32px on either side. The table and rail share the available width in a 1.48 to 1 ratio. The grid stays square and centers inside the felt at up to 318px wide.

At 740px and below the room becomes a single column, up to 550px wide. The board and both round controls precede opponent selection and scores. The board caps at 310px. At 430px the sound control becomes icon-only and the title scales down. At 345px the decorative pieces disappear and the outer margins narrow to 12px.

## Elevation & Depth

The table frame casts one shallow shadow. A fine dot pattern distinguishes the felt from the smooth frame. Stacked silhouettes give the illustrated pieces their thickness, and a dotted ellipse grounds them. The scorecard sits flat on the page. Opening the rules dims the room behind a cream dialog.

## Shapes

A clipped diagonal cross and a thick open ring distinguish the two players at every board size. The square grid has fine corners and solid internal rules. The frame has the broadest corners, followed by the opponent rows and round controls. Empty squares carry a small centered dot.

## Components

- **Game table.** Place the turn or result above the grid and the player key below it. A placed mark settles into its square in 160ms. Hover-capable pointers see a faint preview on playable cells. Winning squares share a lighter green fill.
- **Round controls.** Give New round more width than Undo move. Both buttons carry a line icon and label and are at least 44px tall. A quieter border and text show when undo is unavailable.
- **Opponent selector.** Each labeled radio row combines a pixel portrait, name, description and trailing selection circle. A pale green surface and thicker radio ring identify the selected row. Adaptive Bot reveals a disclosure for its settings.
- **Scorecard.** Three equal columns carry X wins, Draws and O wins. Keep two-digit minimum scores aligned under their labels. Reset exposes Cancel and Clear scores in place.
- **Game tools.** Sound and How to play share a compact text-and-icon navigation row. Keyboard focus uses a 3px ochre outline on paper and a citron inset outline inside the board.

## Do's and Don'ts

- Do pair each player’s shape with a written name in the board key.
- Do keep round controls next to the board when the columns stack.
- Do respect reduced motion by disabling the mark animation.
- Don't use color alone to communicate a player or radio selection.
