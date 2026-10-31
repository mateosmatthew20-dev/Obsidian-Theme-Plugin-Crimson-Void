# Crimson Void
**A cinematic scarlet-and-black Obsidian theme + optional animated FX plugin.**

> **Public beta — Theme v4.0.0 · FX v8.0.0.** Source is available now. These builds have undergone simulated/browser checks, but have not been comprehensively verified across native Obsidian versions, operating systems, and large vaults.

Crimson Void transforms Obsidian into a high-contrast, atmospheric workspace: deep black panels, vivid scarlet controls, a dramatic eclipse backdrop, and red network styling for Graph View. The **theme** owns the permanent appearance; the optional **FX plugin** adds motion and configurable ambience.

## Features
- **Premium chrome:** customized tabs, title bar area, ribbon, sidebar selections, menus, typography, and status bar
- **Cinematic FX:** eclipse, smoke, subtle motion, particle glow, and interactive lighting on notes and empty tabs
- **Native Graph View styling:** scarlet graph nodes and connections, without replacing Obsidian's graph engine
- **Graph Performance Guard (v8):** suspends costly extra FX layers when the graph is open; keeps the theme active
- **Configurable performance:** animation and quality controls; reduced-motion support

## Screenshots
Real native-Obsidian screenshots are being collected. **Please do not publish browser mockups as screenshots of the actual plugin.** If you'd like to contribute genuine screenshots, open an issue with your OS and Obsidian version.<img width="625" height="394" alt="image" src="https://github.com/user-attachments/assets/88b3e0a0-f033-4a24-8062-92b985f12df2" />


## Installation
This beta is **not yet listed in Obsidian's community directories**. Install manually:

1. Download the repository as ZIP and extract it.
2. Back up your vault's `.obsidian` folder.
3. Copy `themes/Crimson Void/` into `<vault>/.obsidian/themes/Crimson Void/`.
4. Copy `plugins/crimson-void/` into `<vault>/.obsidian/plugins/crimson-void/`.
5. Disable conflicting older Crimson/Galaxy CSS snippets.
6. Restart Obsidian and choose **Crimson Void** in **Settings → Appearance → Themes**. Use dark mode.
7. Enable **Crimson Void FX** under **Settings → Community plugins**.
8. For large vaults, leave **Graph Performance Guard** on.

To keep the visual theme without animations, disable the FX plugin.

## Directory structure
```text
themes/Crimson Void/
  manifest.json
  theme.css
plugins/crimson-void/
  manifest.json
  main.js
  styles.css
```

## Known limitations
- Large Graph Views can be expensive in Obsidian itself. The guard keeps plugin rendering out of their way, but doesn't accelerate Obsidian's underlying graph simulation.
- Appearance may vary with Obsidian versions, native titlebar modes, platform window chrome, and third-party plugins.
- **Native end-to-end testing is still needed.** Report problems using the GitHub issue template.

## Beta release notes
See [CHANGELOG.md](CHANGELOG.md) for the current v4/v8 beta notes, known issues, and testing status.

## Feedback & contributions
Use [Issues](../../issues) for bug reports, accessibility problems, screenshots, and performance observations. Include your OS, Obsidian version, theme/FX versions, vault size (note and link counts if possible), and reproduction steps. Never upload private vault files or API tokens.

## License
[MIT](LICENSE).
