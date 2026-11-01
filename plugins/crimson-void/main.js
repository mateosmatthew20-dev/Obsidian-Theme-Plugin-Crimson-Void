'use strict';

/* Crimson Void FX 8.1 — local-only Obsidian plugin. No remote assets or services. */
const { Plugin, PluginSettingTab, Setting, Notice } = require('obsidian');

const DEFAULTS = Object.freeze({
  enabled: true,
  theme: 'eclipse',
  scope: 'all',
  intensity: 90,
  speed: 1,
  motion: true,
  particles: true,
  quality: 'balanced',
  pointerGlow: true,
  focusDim: true,
  texture: true,
  clouds: true,
  aura: 94,
  readability: 26,
  orbit: 'upper-right',
  emptyTabs: true,
  graphViews: true,
  graphSparks: true,
  graphAura: 80,
  pauseInactive: true,
  graphGuard: true,
  graphGuardVersion: 1,
});

const THEMES = Object.freeze({
  rift: { name: 'Red Rift', sub: 'Scarlet fracture / energized void', accent: '#ff2626', highlight: '#ffd2d2', rgb: '255, 38, 38', deep: '165, 8, 8', base: '#070405', swatch: 'rift' },
  eclipse: { name: 'Crimson Eclipse', sub: 'Black sun / molten rimlight', accent: '#ff2020', highlight: '#ffe3e3', rgb: '255, 32, 32', deep: '120, 6, 6', base: '#050304', swatch: 'eclipse' },
  storm: { name: 'Bloodstorm', sub: 'Embers / burning overcast', accent: '#ff2a1a', highlight: '#ffd8cf', rgb: '255, 42, 26', deep: '150, 14, 8', base: '#050304', swatch: 'storm' },
  noir: { name: 'Velvet Red', sub: 'Premium black / restrained glow', accent: '#ff3a3a', highlight: '#ffd6d6', rgb: '255, 58, 58', deep: '110, 10, 10', base: '#080607', swatch: 'noir' },
});

const QUALITY = {
  eco: { count: 14, fps: 24, dpr: 1 },
  balanced: { count: 30, fps: 30, dpr: 1.5 },
  ultra: { count: 56, fps: 45, dpr: 1.75 },
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const rand = (min, max) => min + Math.random() * (max - min);
const TAU = Math.PI * 2;

// Cache a soft 2D glow once per palette. This replaces per-dot shadowBlur,
// which was the largest recurring cost in the old particle renderer.
const PARTICLE_SPRITES = new Map();
function glowSprite(rgb) {
  if (PARTICLE_SPRITES.has(rgb)) return PARTICLE_SPRITES.get(rgb);
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d', {alpha: true});
  if (ctx) {
    const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 31);
    glow.addColorStop(0, 'rgba(255,244,238,1)');
    glow.addColorStop(.11, `rgba(${rgb},1)`);
    glow.addColorStop(.31, `rgba(${rgb},.56)`);
    glow.addColorStop(.72, `rgba(${rgb},.14)`);
    glow.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 64, 64);
  }
  PARTICLE_SPRITES.set(rgb, canvas);
  return canvas;
}

// Each supported viewport gets an isolated transparent particle layer.
// Resize is strictly bounded and drawing pauses while the app is hidden.
class AtmosphereField {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.width = 0;
    this.height = 0;
    this.dpr = 0;
    this.dust = [];
    this.visible = true;
    this.flows = Array.from({ length: 6 }, (_, index) => ({
      phase: rand(0, TAU), y: (index + 0.5) / 6,
      offset: rand(0.03, 0.14), frequency: rand(0.7, 1.6),
    }));
  }

  resize(quality) {
    if (!this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.round(rect.width), h = Math.round(rect.height);
    if (w < 2 || h < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, quality.dpr);
    if (w !== this.width || h !== this.height || dpr !== this.dpr) {
      const wx = this.width ? w / this.width : 1;
      const hy = this.height ? h / this.height : 1;
      for (const dot of this.dust) { dot.x *= wx; dot.y *= hy; }
      this.width = w; this.height = h; this.dpr = dpr;
      this.canvas.width = Math.ceil(w * dpr);
      this.canvas.height = Math.ceil(h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    while (this.dust.length < quality.count) this.dust.push(this.newDot());
    if (this.dust.length > quality.count) this.dust.length = quality.count;
  }

  newDot() {
    return {
      x: rand(0, this.width), y: rand(0, this.height),
      r: rand(.6, 1.8), v: rand(9, 34),
      drift: rand(-9, 9), phase: rand(0, TAU),
      alpha: rand(.24, .83), streak: Math.random() < .22,
    };
  }

  draw(now, dt, settings, colors) {
    const ctx = this.ctx;
    if (!ctx || this.width < 2) return;
    const { width: w, height: h } = this;
    const intensity = settings.intensity / 100;
    const t = now * .001 * settings.speed;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Moving, hair-thin filaments. They create visible organic motion without
    // a WebGL shader or large CPU/GPU allocation. Disabled in low-power mode.
    if (settings.quality !== 'eco' && settings.theme !== 'noir') {
      const isRift = settings.theme === 'rift';
      const n = settings.theme === 'storm' ? 2 : 4;
      for (let index = 0; index < n; index++) {
        const flow = this.flows[index];
        const length = Math.max(w, h);
        const startX = isRift ? w * (.70 + index * .035) : -w * .12;
        const startY = isRift ? -h * .10 : h * flow.y;
        ctx.beginPath();
        const steps = 34;
        for (let s = 0; s <= steps; s++) {
          const a = s / steps;
          let x, y;
          if (isRift) {
            x = startX - a * w * .42 + Math.sin(a * 9 * flow.frequency + t * .6 + flow.phase) * length * .012;
            y = startY + a * h * 1.25;
          } else {
            x = -w * .06 + a * w * 1.12;
            y = startY + Math.sin(a * 7 * flow.frequency + t * .38 + flow.phase) * h * flow.offset;
          }
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const opacity = (settings.theme === 'storm' ? .11 : .17) * intensity * (.5 + .5 * Math.sin(t * .7 + index));
        ctx.lineWidth = index % 2 ? .9 : 1.4;
        ctx.shadowBlur = 16;
        ctx.shadowColor = colors.accent;
        ctx.strokeStyle = `rgba(${colors.rgb},${opacity.toFixed(3)})`;
        ctx.stroke();
      }
    }

    // Reusable glow sprites preserve the hot-white core and full-size scarlet
    // bloom without recalculating a Gaussian shadow for every ember.
    ctx.shadowBlur = 0;
    const sprite = glowSprite(colors.rgb);
    const storm = settings.theme === 'storm';
    const noir = settings.theme === 'noir';
    ctx.strokeStyle = colors.highlight;
    for (const dot of this.dust) {
      const speed = dot.v * dt * settings.speed;
      dot.y += storm ? speed * 2.1 : -speed * (noir ? .42 : 1);
      dot.x += (Math.sin(t * .72 + dot.phase) * dot.drift + (storm ? -dot.v * .45 : 0)) * dt;
      if (dot.y < -30 || dot.y > h + 30 || dot.x < -30 || dot.x > w + 30) {
        dot.y = storm ? -12 : h + 12;
        dot.x = rand(0, w);
      }
      const flicker = .68 + .32 * Math.sin(t * 1.4 + dot.phase);
      const alpha = dot.alpha * intensity * flicker * (noir ? .42 : .85);
      ctx.globalAlpha = alpha;
      const size = 15 + dot.r * 7;
      ctx.drawImage(sprite, dot.x - size / 2, dot.y - size / 2, size, size);
      if (dot.streak || storm) {
        ctx.lineWidth = Math.max(.5, dot.r * .65);
        ctx.beginPath();
        ctx.moveTo(dot.x + (storm ? 6 : 1), dot.y - (storm ? 20 : 11));
        ctx.lineTo(dot.x, dot.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  clear() { this.ctx?.clearRect(0, 0, this.width, this.height); }
  destroy() { this.clear(); this.dust.length = 0; this.canvas.width = 0; this.canvas.height = 0; }
}

class CrimsonSettings extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
  display() {
    const { containerEl: root, plugin } = this;
    root.empty();
    root.addClass('cv-settings');

    const hero = root.createDiv({ cls: 'cv-config-hero' });
    hero.createDiv({ cls: 'cv-overline', text: 'CRIMSON / VOID    —    ECLIPSE EDITION / 8.1' });
    hero.createEl('h2', { text: 'Make the entire vault feel alive.' });
    hero.createEl('p', { text: 'Eclipse-lit editor, atmospheric empty tabs and a scarlet network graph. Visual layers never edit your notes or intercept your graph interactions.' });

    const banner = hero.createDiv({ cls: 'cv-config-banner' });
    const visual = banner.createDiv({ cls: 'cv-config-visual' });
    visual.createDiv({ cls: 'cv-mini-halo' });
    visual.createDiv({ cls: 'cv-mini-cut' });
    visual.createDiv({ cls: 'cv-mini-glimmer' });
    const annotation = banner.createDiv({ cls: 'cv-config-annotation' });
    annotation.createDiv({ cls: 'cv-config-label', text: 'CURRENT ATMOSPHERE' });
    const selected = annotation.createDiv({ cls: 'cv-config-name', text: THEMES[plugin.settings.theme].name });
    banner.dataset.scene = plugin.settings.theme;

    new Setting(root)
      .setName('Enable atmosphere effects')
      .setDesc('Disable the animated scenes without changing the installed theme.')
      .addToggle(c => c.setValue(plugin.settings.enabled).onChange(v => plugin.change('enabled', v)));

    root.createEl('h3', { cls: 'cv-section-title', text: '01  /  Choose your world' });
    const cards = root.createDiv({ cls: 'cv-scene-grid' });
    for (const [id, info] of Object.entries(THEMES)) {
      const card = cards.createEl('button', { cls: 'cv-scene-choice', attr: { type: 'button', 'aria-pressed': String(plugin.settings.theme === id) } });
      card.dataset.scene = id;
      const thumb = card.createDiv({ cls: 'cv-scene-thumb' });
      thumb.createDiv({ cls: 'cv-scene-thumb-orb' });
      thumb.createDiv({ cls: 'cv-scene-thumb-line' });
      card.createDiv({ cls: 'cv-scene-name', text: info.name });
      card.createDiv({ cls: 'cv-scene-sub', text: info.sub });
      card.addEventListener('click', async () => {
        await plugin.change('theme', id);
        for (const el of cards.querySelectorAll('.cv-scene-choice')) el.setAttribute('aria-pressed', String(el.dataset.scene === id));
        banner.dataset.scene = id;
        selected.setText(info.name);
      });
    }

    root.createEl('h3', { cls: 'cv-section-title', text: '02  /  Tune the atmosphere' });
    new Setting(root).setName('Atmosphere intensity').setDesc('Brightness of the eclipse, beams, aura, and particles behind your notes.')
      .addSlider(c => c.setLimits(0, 100, 1).setDynamicTooltip().setValue(plugin.settings.intensity).onChange(v => plugin.change('intensity', v)));
    new Setting(root).setName('Animation speed').setDesc('Slower for an ambient feel; faster for a dramatic scene.')
      .addSlider(c => c.setLimits(.3, 2, .05).setDynamicTooltip().setValue(plugin.settings.speed).onChange(v => plugin.change('speed', v)));
    new Setting(root).setName('Animated atmosphere').setDesc('Pause clouds, rift waves, light sweeps, and particles.')
      .addToggle(c => c.setValue(plugin.settings.motion).onChange(v => plugin.change('motion', v)));
    new Setting(root).setName('Floating sparks and energy filaments').setDesc('Optional canvas particles; independent from the CSS atmosphere.')
      .addToggle(c => c.setValue(plugin.settings.particles).onChange(v => plugin.change('particles', v)));
    new Setting(root).setName('Pointer glow').setDesc('Soft environmental light follows the cursor. No clicks intercepted.')
      .addToggle(c => c.setValue(plugin.settings.pointerGlow).onChange(v => plugin.change('pointerGlow', v)));
    new Setting(root).setName('Volumetric crimson clouds').setDesc('Layered local smoke texture; no web requests or external assets.')
      .addToggle(c => c.setValue(plugin.settings.clouds).onChange(v => plugin.change('clouds', v)));
    new Setting(root).setName('Aura strength').setDesc('Controls the red haze, corona bloom and ambient depth independently of sparks.')
      .addSlider(c => c.setLimits(0, 100, 1).setDynamicTooltip().setValue(plugin.settings.aura).onChange(v => plugin.change('aura', v)));
    new Setting(root).setName('Reading protection').setDesc('Darkens the note center without turning down the red atmosphere at the edges.')
      .addSlider(c => c.setLimits(0, 75, 1).setDynamicTooltip().setValue(plugin.settings.readability).onChange(v => plugin.change('readability', v)));
    new Setting(root).setName('Eclipse placement').setDesc('Move the eclipse to fit your writing layout and monitor size.')
      .addDropdown(c => c.addOption('upper-right', 'Upper right · Mockup match')
        .addOption('far-right', 'Far right · More writing room')
        .addOption('center-right', 'Center-right · Maximum aura')
        .setValue(plugin.settings.orbit).onChange(v => plugin.change('orbit', v)));
    new Setting(root).setName('Fine film texture').setDesc('Adds subtle grain for a cinematic rather than flat background.')
      .addToggle(c => c.setValue(plugin.settings.texture).onChange(v => plugin.change('texture', v)));

    root.createEl('h3', { cls: 'cv-section-title', text: '03  /  Beyond your notes' });
    new Setting(root).setName('Graph Performance Guard · recommended')
      .setDesc('When a large Graph View is visible, suspend every FX layer and animation loop automatically. Native graph colors and the installed theme remain. Full FX return after leaving Graph View.')
      .addToggle(c => c.setValue(plugin.settings.graphGuard).onChange(v => plugin.change('graphGuard', v)));
    new Setting(root).setName('Atmosphere on new tabs').setDesc('Use the same living scene behind the native empty-tab screen and its controls.')
      .addToggle(c => c.setValue(plugin.settings.emptyTabs).onChange(v => plugin.change('emptyTabs', v)));
    new Setting(root).setName('Atmosphere on native graph views').setDesc('Experimental! Animated overlays may overwhelm large graph views. Only applies while Graph Performance Guard is OFF. Not recommended for large vaults.')
      .addToggle(c => c.setValue(plugin.settings.graphViews).onChange(v => plugin.change('graphViews', v)));
    new Setting(root).setName('Graph ember particles').setDesc('Experimental; only with graph atmosphere enabled and Graph Performance Guard off.')
      .addToggle(c => c.setValue(plugin.settings.graphSparks).onChange(v => plugin.change('graphSparks', v)));
    new Setting(root).setName('Graph aura strength').setDesc('Experimental graph overlay only. Ignored while Graph Performance Guard is enabled.')
      .addSlider(c => c.setLimits(0, 100, 1).setDynamicTooltip().setValue(plugin.settings.graphAura).onChange(v => plugin.change('graphAura', v)));

    root.createEl('h3', { cls: 'cv-section-title', text: '04  /  Workspace & performance' });
    new Setting(root).setName('Apply to notes').setDesc('Use everywhere or only notes with cssclasses: [crimson-void] (legacy galaxy-note also works).')
      .addDropdown(c => c.addOption('all', 'All Markdown notes').addOption('tagged', 'Only crimson-void notes')
        .setValue(plugin.settings.scope).onChange(v => plugin.change('scope', v)));
    new Setting(root).setName('Visual quality').setDesc('Eco: 24 FPS / 14 sparks. Balanced: 30 FPS / 30 sparks. Ultra: 45 FPS / 56 sparks. CSS effects can still use GPU.')
      .addDropdown(c => c.addOption('eco', 'Eco · Battery friendly').addOption('balanced', 'Balanced · Recommended')
        .addOption('ultra', 'Ultra · Maximum detail').setValue(plugin.settings.quality).onChange(v => plugin.change('quality', v)));
    new Setting(root).setName('Focus-aware brightness').setDesc('Subtly dims the atmosphere while typing, so text stays easy to read.')
      .addToggle(c => c.setValue(plugin.settings.focusDim).onChange(v => plugin.change('focusDim', v)));
    new Setting(root).setName('Smart visibility optimization')
      .setDesc('Pauses all particles and decorative animations in hidden or inactive panes. Does not reduce effects in visible panes.')
      .addToggle(c => c.setValue(plugin.settings.pauseInactive).onChange(v => plugin.change('pauseInactive', v)));

    const footer = root.createDiv({ cls: 'cv-config-footer' });
    footer.createDiv({ text: 'BUILT FOR DARK MODE. FULLY LOCAL. NO TELEMETRY.' });
    footer.createEl('p', { text: 'Reduced-motion preferences override animation. Notes are never modified. Install the Crimson Void theme for matching tabs, sidebar, and UI; turn off older CSS snippets to avoid conflicts.' });
  }
}

module.exports = class CrimsonVoid extends Plugin {
  async onload() {
    const persisted = (await this.loadData()) || {};
    this.settings = { ...DEFAULTS, ...persisted };
    // v8 safety migration. Previous versions defaulted to graph overlays enabled
    // and could stall Obsidian's renderer on large graphs. Once per upgrade,
    // choose safe defaults even if old preferences had graph effects enabled.
    if (!persisted.graphGuardVersion) {
      this.settings.graphGuard = true;
      this.settings.graphViews = false;
      this.settings.graphSparks = false;
      this.settings.graphGuardVersion = 1;
      await this.saveData(this.settings);
    }
    // Migrate the previous plugin's preset names without changing its plugin ID.
    if (!persisted.theme && persisted.preset) {
      this.settings.theme = ({ aurora: 'rift', bloodmoon: 'eclipse', velvet: 'noir' })[persisted.preset] || 'rift';
    }
    if (!THEMES[this.settings.theme]) this.settings.theme = DEFAULTS.theme;
    if (!['all', 'tagged'].includes(this.settings.scope)) this.settings.scope = 'all';
    if (!QUALITY[this.settings.quality]) this.settings.quality = 'balanced';
    this.settings.intensity = clamp(Number(this.settings.intensity) || 0, 0, 100);
    this.settings.speed = clamp(Number(this.settings.speed) || 1, .3, 2);
    this.settings.aura = clamp(Number(this.settings.aura) || 0, 0, 100);
    this.settings.readability = clamp(Number(this.settings.readability) || 0, 0, 75);
    this.settings.graphAura = clamp(Number(this.settings.graphAura ?? 80) || 0, 0, 100);
    for (const key of ['emptyTabs', 'graphViews', 'graphSparks']) this.settings[key] = this.settings[key] !== false;
    if (!['upper-right','far-right','center-right'].includes(this.settings.orbit)) this.settings.orbit = 'upper-right';

    this.effects = new Map();
    this.graphSafe = false;
    this.raf = 0;
    this.lastTick = 0;
    this.syncTimer = 0;
    this.saveTimer = 0;
    this.activeHover = null;
    this.pendingPointer = null;
    this.pointerRaf = 0;
    this.lastDark = document.body.classList.contains('theme-dark');
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.onReduceChange = () => this.apply();
    if (this.reduced.addEventListener) this.reduced.addEventListener('change', this.onReduceChange);
    else this.reduced.addListener?.(this.onReduceChange);

    // Track visibility on layout changes, not by reading every pane rectangle
    // on every animation frame. Offscreen panes keep their static scene.
    this.intersectionObserver = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      for (const entry of entries) {
        const effect = this.effects.get(entry.target);
        if (!effect) continue;
        effect.visible = entry.isIntersecting && entry.intersectionRect.width >= 2 && entry.intersectionRect.height >= 2;
        effect.field.visible = effect.visible;
        entry.target.classList.toggle('cv-surface-idle', !effect.visible && this.settings.pauseInactive);
      }
      this.refreshLoop();
    }, {threshold: 0});

    this.resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(entries => {
      for (const item of entries) {
        const effect = this.effects.get(item.target);
        if (effect) effect.field.resize(QUALITY[this.settings.quality]);
      }
      this.refreshLoop();
    });

    this.addSettingTab(new CrimsonSettings(this.app, this));
    this.addRibbonIcon('aperture', 'Toggle Crimson Void FX', () => this.toggle());
    this.addCommand({ id: 'toggle-effects', name: 'Toggle Crimson Void FX', callback: () => this.toggle() });
    this.addCommand({ id: 'cycle-atmosphere', name: 'Cycle atmospheric scene', callback: async () => {
      const keys = Object.keys(THEMES);
      const next = keys[(keys.indexOf(this.settings.theme) + 1) % keys.length];
      await this.change('theme', next);
      new Notice(`Crimson Void · ${THEMES[next].name}`);
    } });
    this.addCommand({ id: 'toggle-motion', name: 'Pause or resume motion', callback: async () => {
      await this.change('motion', !this.settings.motion);
      new Notice(`Crimson Void motion ${this.settings.motion ? 'resumed' : 'paused'}`);
    } });
    this.addCommand({ id: 'toggle-focus', name: 'Toggle focus-aware dimming', callback: async () => {
      await this.change('focusDim', !this.settings.focusDim);
      new Notice(`Focus dimming ${this.settings.focusDim ? 'enabled' : 'disabled'}`);
    } });

    this.addCommand({ id: 'toggle-empty-atmosphere', name: 'Toggle atmosphere in new tabs', callback: () => this.change('emptyTabs', !this.settings.emptyTabs) });
    this.addCommand({ id: 'toggle-graph-atmosphere', name: 'Toggle graph atmosphere', callback: () => this.change('graphViews', !this.settings.graphViews) });

    this.registerDomEvent(document, 'visibilitychange', () => this.apply());
    this.registerDomEvent(window, 'resize', () => this.resizeAll());
    this.registerDomEvent(document, 'pointermove', event => this.trackPointer(event), { passive: true });
    this.registerDomEvent(document, 'focusin', event => this.setFocus(event, true));
    this.registerDomEvent(document, 'focusout', event => this.setFocus(event, false));

    this.registerEvent(this.app.workspace.on('layout-change', () => this.scheduleSync()));
    this.registerEvent(this.app.workspace.on('active-leaf-change', leaf => {
      // Immediate protection when a graph tab becomes active, before its heavy
      // native layout/renderer finishes initialising.
      if (this.settings.graphGuard && this.isGraphLeaf(leaf)) this.enterGraphSafety();
      this.scheduleSync();
    }));
    this.registerEvent(this.app.workspace.on('file-open', () => this.scheduleSync()));
    this.registerEvent(this.app.metadataCache.on('changed', () => {
      if (this.settings.scope === 'tagged') this.scheduleSync();
    }));

    this.bodyObserver = new MutationObserver(() => {
      const dark = document.body.classList.contains('theme-dark');
      if (dark !== this.lastDark) {
        this.lastDark = dark;
        this.apply();
      }
    });
    this.bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    this.layoutObserver = new MutationObserver(records => {
      // Graph canvases can trigger intensive UI updates. While guarded, only
      // official workspace events are allowed to restart layout sync.
      if (this.graphSafe) return;
      // Check only structural changes, never per-character CodeMirror updates.
      for (const record of records) {
        if (record.type !== 'childList') continue;
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.matches('.workspace-leaf-content, .view-content, .markdown-preview-view, .markdown-source-view, .empty-state, .graph-view') ||
              node.querySelector('.workspace-leaf-content, .view-content, .markdown-preview-view, .markdown-source-view, .empty-state, .graph-view')) {
            this.scheduleSync(); return;
          }
        }
      }
    });
    this.layoutObserver.observe(this.app.workspace.containerEl, { childList: true, subtree: true });
    this.app.workspace.onLayoutReady(() => this.apply());
  }

  async change(key, value) {
    this.settings[key] = value;
    this.apply();
    // Debounce heavy writes from dragged sliders; last value always wins.
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = 0;
      void this.saveData(this.settings);
    }, 220);
  }

  async toggle() {
    await this.change('enabled', !this.settings.enabled);
    new Notice(`Crimson Void FX ${this.settings.enabled ? 'enabled' : 'disabled'}`);
  }

  isActive() { return this.settings.enabled && document.body.classList.contains('theme-dark'); }
  canAnimate() { return this.isActive() && !this.graphSafe && this.settings.motion && !this.reduced.matches && !document.hidden; }

  isGraphLeaf(leaf) {
    if (!leaf) return false;
    const type = leaf.getViewState?.()?.type || leaf.view?.getViewType?.();
    return type === 'graph' || type === 'localgraph';
  }

  hasVisibleGraph() {
    if (!this.settings.graphGuard || !this.isActive()) return false;
    // A graph being opened into a tab is already considered busy; do not wait
    // for its native canvas and controls to finish mounting.
    if (this.isGraphLeaf(this.app.workspace.activeLeaf)) return true;
    for (const type of ['graph', 'localgraph']) {
      for (const leaf of this.app.workspace.getLeavesOfType(type)) {
        const root = leaf.view?.containerEl;
        if (!root || !root.isConnected) continue;
        const pane = root.closest('.workspace-leaf') || root;
        // Read visibility only when the workspace changes, never per frame.
        const rect = pane.getBoundingClientRect();
        if (rect.width > 1 && rect.height > 1 &&
            getComputedStyle(pane).visibility !== 'hidden') return true;
      }
    }
    return false;
  }

  enterGraphSafety() {
    if (this.graphSafe) return;
    this.graphSafe = true;
    document.body.classList.add('cv-graph-safe', 'cv-paused');
    // Remove GPU-composited FX surfaces completely. CSS pauses alone are not
    // sufficient when a huge WebGL/canvas graph is repeatedly redrawn.
    this.stop(true);
    if (this.pointerRaf) cancelAnimationFrame(this.pointerRaf);
    this.pointerRaf = 0;
    this.pendingPointer = null;
    for (const content of [...this.effects.keys()]) this.detach(content);
  }

  apply() {
    const active = this.isActive();
    const protectGraph = active && this.hasVisibleGraph();
    if (protectGraph) this.enterGraphSafety();
    else this.graphSafe = false;
    const body = document.body;
    const colors = THEMES[this.settings.theme];
    const strength = clamp(this.settings.intensity / 100, 0, 1);
    body.classList.toggle('cv-active', active);
    body.classList.toggle('cv-paused', !this.canAnimate());
    body.classList.toggle('cv-graph-safe', active && this.graphSafe);
    body.classList.toggle('cv-with-pointer', active && this.settings.pointerGlow && this.canAnimate());
    body.classList.toggle('cv-with-grain', active && this.settings.texture);
    body.classList.toggle('cv-with-clouds', active && this.settings.clouds);
    body.classList.toggle('cv-focus-dim', active && this.settings.focusDim);
    body.classList.toggle('cv-graph-aura', active && this.settings.graphViews);
    body.dataset.cvScene = this.settings.theme;
    body.dataset.cvQuality = this.settings.quality;
    body.dataset.cvOrbit = this.settings.orbit;
    body.style.setProperty('--cv-accent', colors.accent);
    body.style.setProperty('--cv-highlight', colors.highlight);
    body.style.setProperty('--cv-rgb', colors.rgb);
    body.style.setProperty('--cv-shadow-rgb', colors.deep);
    body.style.setProperty('--cv-base', colors.base);
    body.style.setProperty('--cv-energy', String(strength));
    body.style.setProperty('--cv-aura-level', String(clamp(this.settings.aura/100,0,1)));
    body.style.setProperty('--cv-graph-aura-level', String(clamp(this.settings.graphAura/100,0,1)));
    body.style.setProperty('--cv-ink-protect', String(clamp(this.settings.readability/100,0,.75)));
    body.style.setProperty('--cv-glow', `rgba(${colors.rgb}, ${(strength * .37).toFixed(3)})`);
    body.style.setProperty('--cv-dim', `rgba(${colors.deep}, ${(strength * .52).toFixed(3)})`);
    body.style.setProperty('--cv-line', `rgba(${colors.rgb}, ${(strength * .26).toFixed(3)})`);
    body.style.setProperty('--cv-slow', `${(26 / this.settings.speed).toFixed(2)}s`);
    body.style.setProperty('--cv-fast', `${(12 / this.settings.speed).toFixed(2)}s`);
    this.sync();
    for (const [content, effect] of this.effects) {
      content.classList.toggle('cv-surface-idle', !!this.settings.pauseInactive && !effect.visible);
    }
    this.refreshLoop();
  }

  eligible(leaf, content) {
    if (this.settings.scope === 'all') return true;
    const file = leaf.view.file;
    const metadata = file && this.app.metadataCache.getFileCache(file)?.frontmatter;
    const classes = metadata?.cssclasses || metadata?.cssclass || [];
    if (Array.isArray(classes) && (classes.includes('crimson-void') || classes.includes('galaxy-note'))) return true;
    if (typeof classes === 'string' && classes.split(/[\s,\[\]]+/).some(v => v === 'galaxy-note' || v === 'crimson-void')) return true;
    return Boolean(content.querySelector('.galaxy-note, .crimson-void'));
  }

  sync() {
    const seen = new Set();
    if (this.isActive() && !this.graphSafe) {
      const targets = [{ kind: 'markdown', type: 'markdown', enabled: true },
        { kind: 'empty', type: 'empty', enabled: this.settings.emptyTabs },
        { kind: 'graph', type: 'graph', enabled: this.settings.graphViews },
        { kind: 'graph', type: 'localgraph', enabled: this.settings.graphViews }];
      for (const target of targets) {
        if (!target.enabled || (target.kind === 'graph' && this.settings.graphGuard)) continue;
        for (const leaf of this.app.workspace.getLeavesOfType(target.type)) {
          const container = leaf.view.containerEl;
          if (!container) continue;
          // Empty-tab content can differ across Obsidian versions. Keep the
          // fallback INSIDE the leaf so we never position over a global toolbar.
          const content = container.querySelector('.view-content') ||
            (target.kind === 'empty' ? container.querySelector('.empty-state') : null) ||
            (target.kind === 'graph' ? container.querySelector('.graph-view') : null);
          if (!content || !content.isConnected) continue;
          if (target.kind === 'markdown' && !this.eligible(leaf, content)) continue;
          seen.add(content);
          const existing = this.effects.get(content);
          if (existing && existing.kind !== target.kind) this.detach(content);
          if (!this.effects.has(content)) this.attach(content, target.kind);
          // ResizeObserver is responsible for measurement after initial attach.
          // Avoid triggering layout for every existing pane during synchronization.
        }
      }
    }
    for (const content of [...this.effects.keys()]) {
      if (!seen.has(content) || !content.isConnected) this.detach(content);
    }
  }

  attach(content, kind = 'markdown') {
    const layer = document.createElement('div');
    layer.className = 'cv-scene';
    layer.setAttribute('aria-hidden', 'true');
    for (const cls of ['cv-backdrop', 'cv-aura cv-aura-a', 'cv-aura cv-aura-b', 'cv-nebula', 'cv-nebula-alt', 'cv-sun',
      'cv-corona', 'cv-hot-rim', 'cv-meteors', 'cv-fissure', 'cv-fissure-light', 'cv-volume-light', 'cv-grain', 'cv-vignette', 'cv-ink-shield', 'cv-constellation-grid', 'cv-arc-rings', 'cv-shockwave', 'cv-corner-light']) {
      const el = document.createElement('div'); el.className = cls; layer.appendChild(el);
    }
    const canvas = document.createElement('canvas');
    canvas.className = 'cv-canvas';
    layer.appendChild(canvas);
    const cursor = document.createElement('div');
    cursor.className = 'cv-cursor';
    layer.appendChild(cursor);
    content.prepend(layer);
    content.classList.add('cv-enhanced', `cv-surface--${kind}`);
    content.setAttribute('data-cv-surface', kind);
    const field = new AtmosphereField(canvas);
    this.effects.set(content, { layer, cursor, field, kind, visible: true });
    this.intersectionObserver?.observe(content);
    this.resizeObserver?.observe(content);
    field.resize(QUALITY[this.settings.quality]);
  }

  detach(content) {
    const effect = this.effects.get(content);
    if (!effect) return;
    this.resizeObserver?.unobserve(content);
    this.intersectionObserver?.unobserve(content);
    effect.field.destroy();
    effect.layer.remove();
    content.classList.remove('cv-enhanced', 'cv-hovered', 'cv-editor-focused', 'cv-surface--markdown', 'cv-surface--empty', 'cv-surface--graph', 'cv-surface-idle');
    content.removeAttribute('data-cv-surface');
    if (this.activeHover === content) this.activeHover = null;
    this.effects.delete(content);
    this.refreshLoop();
  }

  scheduleSync() {
    if (this.syncTimer) return;
    this.syncTimer = setTimeout(() => {
      this.syncTimer = 0;
      const graphNow = this.isActive() && this.hasVisibleGraph();
      if (graphNow !== this.graphSafe) this.apply();
      else { this.sync(); this.refreshLoop(); }
    }, 120);
  }

  resizeAll() {
    for (const effect of this.effects.values()) effect.field.resize(QUALITY[this.settings.quality]);
  }

  trackPointer(event) {
    if (!this.settings.pointerGlow || !this.canAnimate()) return;
    // Mouse devices can deliver hundreds of events per frame. Coalesce them.
    this.pendingPointer = { target: event.target, x: event.clientX, y: event.clientY };
    if (!this.pointerRaf) this.pointerRaf = requestAnimationFrame(() => this.flushPointer());
  }

  flushPointer() {
    this.pointerRaf = 0;
    const pointer = this.pendingPointer;
    this.pendingPointer = null;
    if (!pointer || !this.canAnimate() || !this.settings.pointerGlow) return;
    const target = pointer.target;
    const content = target instanceof Element ? target.closest('.cv-enhanced') : null;
    if (this.activeHover && this.activeHover !== content) this.activeHover.classList.remove('cv-hovered');
    this.activeHover = content;
    if (!content) return;
    const effect = this.effects.get(content);
    if (!effect || (this.settings.pauseInactive && !effect.visible)) return;
    const bounds = content.getBoundingClientRect();
    effect.cursor.style.setProperty('--cv-mx', `${pointer.x - bounds.left}px`);
    effect.cursor.style.setProperty('--cv-my', `${pointer.y - bounds.top}px`);
    content.classList.add('cv-hovered');
  }

  setFocus(event, focused) {
    if (!this.settings.focusDim) return;
    const editor = event.target instanceof Element ? event.target.closest('.cm-editor') : null;
    if (!editor) return;
    const content = editor.closest('.view-content.cv-enhanced');
    if (content) content.classList.toggle('cv-editor-focused', focused);
  }

  drawableEffects() {
    const out = [];
    for (const [content, effect] of this.effects) {
      if (!content.isConnected || (effect.kind === 'graph' && !this.settings.graphSparks)) continue;
      if (this.settings.pauseInactive && !effect.visible) continue;
      if (effect.field.width < 2 || effect.field.height < 2) continue;
      out.push(effect);
    }
    return out;
  }

  refreshLoop() {
    if (!this.canAnimate() || !this.settings.particles || this.settings.intensity <= 0 || !this.drawableEffects().length) {
      this.stop(true);
      return;
    }
    this.start();
  }

  start() {
    if (this.raf || !this.canAnimate() || !this.settings.particles) return;
    this.raf = requestAnimationFrame(t => this.tick(t));
  }

  tick(t) {
    this.raf = 0;
    if (!this.canAnimate() || !this.settings.particles) return;
    const quality = QUALITY[this.settings.quality];
    const visible = this.drawableEffects();
    if (!visible.length) { this.stop(false); return; }
    const elapsed = this.lastTick ? t - this.lastTick : 1000 / quality.fps;
    if (elapsed >= (1000 / quality.fps) - 1) {
      const dt = Math.min(elapsed, 70) / 1000;
      this.lastTick = t;
      // Never render hidden panes. Limit simultaneous costly draw calls.
      for (const effect of visible.slice(0, 3)) {
        effect.field.draw(t, dt, this.settings, THEMES[this.settings.theme]);
      }
    }
    this.start();
  }

  stop(clear) {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.lastTick = 0;
    if (clear) for (const effect of this.effects.values()) effect.field.clear();
  }

  onunload() {
    this.stop(true);
    if (this.syncTimer) clearTimeout(this.syncTimer);
    if (this.saveTimer) { clearTimeout(this.saveTimer); void this.saveData(this.settings); }
    this.bodyObserver?.disconnect();
    this.layoutObserver?.disconnect();
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    if (this.pointerRaf) cancelAnimationFrame(this.pointerRaf);
    this.pointerRaf = 0;
    this.pendingPointer = null;
    if (this.reduced?.removeEventListener) this.reduced.removeEventListener('change', this.onReduceChange);
    else this.reduced?.removeListener?.(this.onReduceChange);
    for (const content of [...this.effects.keys()]) this.detach(content);
    const body = document.body;
    body.classList.remove('cv-graph-safe', 'cv-active', 'cv-paused', 'cv-with-pointer', 'cv-with-grain', 'cv-with-clouds', 'cv-focus-dim', 'cv-graph-aura');
    delete body.dataset.cvScene;
    delete body.dataset.cvQuality;
    delete body.dataset.cvOrbit;
    for (const prop of ['--cv-accent', '--cv-highlight', '--cv-rgb', '--cv-shadow-rgb', '--cv-base', '--cv-energy',
      '--cv-glow', '--cv-dim', '--cv-line', '--cv-slow', '--cv-fast', '--cv-aura-level', '--cv-ink-protect', '--cv-graph-aura-level']) body.style.removeProperty(prop);
  }
};
