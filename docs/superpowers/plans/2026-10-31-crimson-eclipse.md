# Crimson Eclipse Implementation Plan

> Execute inline with the executing-plans skill. Approved by Matthew on 2026-10-31, explicitly including the sidebar and top bar.

**Goal:** Dramatic cinematic scarlet/black chrome and a more composed eclipse atmosphere, retaining readability and native interaction.
**Architecture:** Refine existing CSS surfaces and existing FX layers. No new renderer, dependencies, external assets, or persistent settings migration. Theme owns app chrome; plugin owns local atmosphere and its own settings UI.
**Spec:** Approved conversation brief: richer black surfaces, crisp scarlet edges, stronger active tabs, consistent menus/type, molten eclipse rim, layered smoke, sparse embers, quieter reading surfaces, bounded effects and graph guard.

## Constraints and review focus
- Preserve the native Windows no-drag cutout fix and all button geometry.
- Preserve user fonts, saved settings and graph safety.
- Reduced motion, paused effects and eco quality must remain respected.
- Empty tabs can be dramatic; markdown stays readable; narrow panes must not overflow.
- Do not put theme CSS in plugin styles.

## Task 1 — chrome
- [x] Record live baseline; implement focused final CSS section in theme.css for top strip, tabs, ribbon, sidebar selections, menus and settings. Avoid header pseudo-elements, transforms and new stacking contexts.
- [x] Parse CSS and verify native control geometry/physical clicks, sidebar navigation and narrow layouts in live Obsidian.

## Task 2 — atmosphere
- [x] Refine existing eclipse sun/corona/hot-rim gradients with shared geometry and existing placement variables; tone down markdown FX with CSS. Style plugin settings using existing classes. Preserve renderer and saved settings.
- [x] Verify empty tab, markdown, settings, motion pause and eco behavior. Check plugin-disabled theme and graph guard. Compare screenshots.

## Task 3 — delivery
- [x] Parse both CSS files, run JavaScript syntax check and whitespace checks; review final diff for scope and accidental assets/settings.
- [x] Record validation and limitations, update vault, commit and push approved repository changes.

## Execution ledger
Ruling: use the dedicated task checkout on a feature branch; no additional worktree or user setup is needed. Visual CSS changes are verified by rendering and interaction, rather than tests that merely assert style text. No main.js behavior change planned.

Validation evidence: ../../../../CINEMATIC-VALIDATION.md. Review finding (Markdown meteor opacity overridden by animation) corrected and confirmed live with animationName none.
