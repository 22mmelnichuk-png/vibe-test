Top-down Firefighting demo

How to run

1. Open `index.html` in your browser (double-click or use Live Server extension).
2. Controls: WASD to move, move the mouse to aim, hold mouse button to spray water.
3. Refill water by standing in the blue pond (bottom-right).

Notes

- Fires spawn and spread; the purple "fire monster" spawns fires.
- The yellow MChS firefighter will run to fires and reduce their intensity.
- Water is limited; manage it and refill at ponds.

Files

- index.html — main page
- style.css — styling
- main.js — game logic

GitHub

The project has been published to GitHub: https://github.com/22mmelnichuk-png/vibe-test

Clone and run locally:

```bash
git clone https://github.com/22mmelnichuk-png/vibe-test.git
cd vibe-test
# Open index.html in your browser, or use Live Server for automatic reloads:
open index.html
```

Notes on running

- For quick iteration, use the VS Code Live Server extension or any static file server.
- If you want me to add a simple `serve` script or package.json with a dev server, I can add that.

Artwork

- The project now includes simple SVG sprite art in the `assets/` folder: `player.svg`, `mch.svg`, `monster.svg`, `fire.svg`, `tree.svg`, `pond.svg`.
- The game will automatically use these SVGs when available and fall back to simple shapes if your browser cannot load them.
