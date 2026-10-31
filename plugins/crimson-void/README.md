# Crimson Void FX 8.0 — Graph Performance Fix

## Why this update
FX 7 layered large animated, blurred, screen-blended effects over the native Graph View canvas. With very large vaults, this competes for GPU and compositor bandwidth, causing severe lag.

## What changed
- **Graph Performance Guard** ON by default. While global/local Graph View is visible, completely remove FX layers (not merely hide them), suspend particles, and cancel animation loops. The theme’s native graph colors and UI styling remain.
- Reopen a note or empty tab and your cinematic effects return automatically.
- Existing v7 `data.json` is migrated once. Graph overlays/sparks default to OFF so the v7 performance issue does not silently return.
- Experimental Graph atmosphere remains opt-in if Graph Performance Guard is deliberately disabled; it is NOT recommended for large vaults.
- Note and new-tab visuals are unchanged.

## Installation
Replace `plugins/crimson-void/main.js`, `manifest.json`, and `styles.css` with the supplied files. **Keep your existing `data.json`** to preserve other settings. Reload Obsidian, then verify Settings > Crimson Void FX > Graph Performance Guard is ON.

## Testing note
Verified in Chromium with a simulated Obsidian workspace. Native Obsidian testing on a large vault remains necessary. If the graph still lags, disable Crimson Void FX and report your OS, Obsidian version, and approximate graph node/link count.
