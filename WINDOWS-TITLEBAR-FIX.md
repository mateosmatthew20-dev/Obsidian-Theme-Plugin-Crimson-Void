# Windows window-control fix — 2026-10-31

## Confirmed cause
On Windows Obsidian 1.14.5, the hidden-frame tab-header container is a native Electron drag region. Obsidian's `.workspace-tabs.mod-top-right-space .workspace-tab-header-container::after` creates a full-height, right-aligned `no-drag` cutout of `--frame-right-space` width.

The theme's decorative `body.theme-dark .mod-root .workspace-tab-header-container::after` adds `left: 0`. Combined with native `right: 0` and a fixed width, this overconstrains the pseudo-element: in the observed LTR window, left wins. The cutout appears at the left of the header instead of beneath the controls. DOM hit testing still returns button SVG descendants, but Electron treats the affected coordinates as draggable and suppresses normal pointer input.

Live measurement with DevTools docked: header x=343.987, width=510.460 CSS px; pseudo left=0, width=125.993, height=38.888. Correcting only left to auto produces computed left=384.467, restoring the right-side cutout. `pointer-events: none` was left unchanged: it was not the cause in this reproduction.

## Change
Replace commit 440a927's forced z-index/pointer overrides with a Windows, dark-theme, hidden-frame, non-fullscreen selector setting only `left: auto` on that native pseudo-element. Native control rectangles remain identical (43.97185 by 38.991 CSS px at the observed zoom); native titlebar z-index returns to 30.

No palette, tab, sidebar, animation, plugin or control geometry declarations changed. No new titlebar or hit-target enlargement. The reserved pseudo-element returns to its native location; it must not be removed as a decorative overlay.

## History reviewed
3fa7d67 through 440a927 include control geometry/position experiments, enlarged invisible hit targets, removal of the native pseudo-element (f7ba184/90ffd35), their revert (c088293), and elevation (440a927). The current forced elevation did not fix the incorrect drag exclusion. Do not reapply those experiments.

## Actual validation
- Running Windows Obsidian 1.14.5, Crimson Void theme and FX enabled, hidden frame, LTR, fractional effective devicePixelRatio about 0.91287.
- A/B test: physical maximize click succeeds with only `left: auto`; removing the probe restores failure at the same coordinates.
- Final installed CSS (probe disconnected, forced elevation removed): physical maximize near upper-left button corner, restore, and minimize work. Pointerover and pointerdown delivered to controls.
- Close near lower-left button edge: hover highlight, pointerover, pointerdown and click delivered. A temporary capture listener prevented the actual close to preserve the workspace; that listener was then removed.
- CSS parsed recursively with tinycss2: zero rule/declaration parse errors in theme and plugin styles. `git diff --check` passes; plugin files unchanged.
- Visual review of running chrome; no redesign. Not a pixel-diff guarantee.

## Remaining coverage
Other Obsidian/Electron versions, RTL, multiple displays/DPI settings, native-frame, fullscreen, popout windows, macOS/Linux and mobile were not runtime tested. The fix selector excludes other platforms, fullscreen and native-frame mode. No exhaustive pixel-level visual or performance regression suite was run.

Electron drag regions differ from DOM hit testing: https://www.electronjs.org/docs/latest/tutorial/custom-window-interactions
