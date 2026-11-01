# Crimson Eclipse validation — 2026-10-31

Theme 4.1.0 / FX 8.1.0. Matthew approved the dramatic cinematic direction and explicitly requested improved sidebar and top bar.

## Scope
Theme CSS: warm scarlet-lit top strip, stronger active tabs, sidebar folder hierarchy and selected rows, ribbon, status rail, menus, settings navigation and quieter scrollbars. Existing native titlebar geometry and right no-drag pseudo-element fix preserved.
Plugin CSS: aligned eclipse disk/corona/hot rim, sharper luminous rim with no animated disk blur/scaling, restrained smoke/canvas opacity, .44 Markdown atmosphere (.30 while editing with focus dim), static subdued Markdown meteors, coordinated settings hero/cards. Existing particles, quality budgets, settings and graph guard preserved. main.js changes only its version comment and settings overline; no logic changes.

## Checks actually performed
- CSS rules/declarations recursively parsed with tinycss2; zero parse errors. JavaScript syntax checked with `node --check`; whitespace checked with `git diff --check`.
- Running Windows Obsidian 1.14.5: empty tab, existing Markdown note, sidebar selected row, normal and maximized window, narrow editor with docked DevTools, and separate FX settings window visually inspected.
- Eclipse layers measured at identical 683.558px width/height and identical offsets in the observed narrow viewport; sun animation and filter both none. One FX scene, no duplicate scene after reload.
- Native Windows cutout retained computed left=384.467px in the docked viewport. Physical maximize and restore clicks work with new chrome; existing window controls not repositioned.
- Eco: corona computed display none. Motion disabled: cv-paused true. Temporary runtime changes restored; plugin settings compare equal to the original snapshot.
- Theme with FX disabled: zero scenes, cv-active false; app chrome and note remain styled. Reenable reloads revised CSS successfully.
- Graph Guard enabled temporarily: graphSafe true, zero scene instances, raf=0. Returned to note/empty tab and restored original graph preference.
- Stable Markdown atmosphere opacity .44; meteor animation none, so keyframes no longer override the dimming.
- Fresh static CSS review found one opacity/keyframe conflict; corrected by removing meteor pulsing on Markdown. No other important new issues reported.

## Limits
No measured FPS/GPU claim. No runtime testing of reduced-motion OS preference, mobile, RTL, other OS/Obsidian versions or multiple DPI setups. Existing saved user fonts/settings retained. Native graph simulation cost is unchanged. No pixel-exact baseline or clean-vault install/uninstall suite.

## Installation
Updated the active vault's theme CSS/manifest and plugin CSS/main.js/manifest. The FX plugin must be reloaded to pick up CSS updates; this was done in the running instance. No extra service, dependency, external asset, or setting is required. Backups are local in `.debug-native/cinematic-before/` and are not part of the repository commit.


## Superseding visual correction - 2026-10-31
Matthew rejected the copper/orange, restrained styling as too simple and insufficiently red. The corrective pass uses saturated red throughout the recent theme/FX section, stronger tab bevel/glow and sidebar selections, fuller smoke/embers, brighter red eclipse bloom, and the original cropped composition. Markdown atmosphere is now .70 (.50 while editing), canvas opacity 1, smoke .91/.39 times saved energy/aura. These values supersede the original .44/.30 treatment above. No saved preferences, particle counts, native titlebar cutout or plugin logic changed. CSS parse/whitespace checks and live Windows preview performed again. No new performance claim.
