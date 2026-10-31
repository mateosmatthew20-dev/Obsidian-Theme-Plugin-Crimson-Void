# Crimson Void

A cinematic scarlet-and-black visual system for [Obsidian](https://obsidian.md), consisting of a custom theme and a complementary animated-effects plugin.

> **Repository setup in progress.** The packaged source files have not yet been pushed. Do not treat this repository as an installable release until `theme.css`, `main.js`, `styles.css`, and the manifests are present.

## Features

- Deep-black workspace, scarlet highlights, refined sidebar and tab chrome
- Animated eclipse, atmospheric clouds, and particle effects in Markdown notes and empty tabs
- Crimson native Graph View styling
- Performance Guard for Graph View: suspends expensive visual layers to preserve native graph responsiveness
- Motion/accessibility and performance controls

## Planned repository layout

```text
themes/Crimson Void/
  manifest.json
  theme.css
plugins/crimson-void/
  manifest.json
  main.js
  styles.css
```

## Installation (after source upload)

1. Copy `themes/Crimson Void` to your vault's `.obsidian/themes/` directory.
2. Copy `plugins/crimson-void` to your vault's `.obsidian/plugins/` directory.
3. In Obsidian's Appearance settings, activate **Crimson Void** (dark mode).
4. Under Community plugins, enable **Crimson Void FX**.
5. For large vaults, leave **Graph Performance Guard** enabled.

## Status

The latest tested build is *Crimson Void Theme v4 + FX v8 GraphFix*. Native Obsidian platform compatibility and large-vault performance need further testing before directory submission.

## Notes

The theme and FX plugin are intentionally separate, so the dark-red styling can remain active while animated FX are disabled. No user vault notes or settings files should be committed to this repository.
