import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { parts, chapters } from '../data/index.js'
import type { RouteState, SectionMeta, Theme } from '../types.js'

// Import all sub-components
import './book-code-block.js'
import './book-callout.js'
import './theme-toggle.js'
import './nav-sidebar.js'
import './chapter-viewer.js'
import './sections-panel.js'

const HASH_PATTERN = /^ch(\d{1,2})(?:-(.+))?$/

@customElement('app-shell')
export class AppShell extends LitElement {
  @state() private _route: RouteState = { type: 'home' }
  @state() private _theme: Theme = 'light'
  @state() private _drawerOpen = false
  @state() private _sections: readonly SectionMeta[] = []
  @state() private _homeExpandedParts: Set<number> = new Set()

  // Use light DOM — layout CSS is global
  override createRenderRoot() { return this }

  connectedCallback() {
    super.connectedCallback()
    this._initTheme()
    this._handleHash()
    window.addEventListener('hashchange', this._onHashChange)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    window.removeEventListener('hashchange', this._onHashChange)
  }

  private _initTheme() {
    const saved = localStorage.getItem('theme') as Theme | null
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    this._applyTheme(saved ?? preferred)
  }

  private _applyTheme(t: Theme) {
    this._theme = t
    document.documentElement.dataset['theme'] = t
    localStorage.setItem('theme', t)
    // Sync Prism stylesheets
    const light = document.getElementById('prism-light') as HTMLLinkElement | null
    const dark  = document.getElementById('prism-dark')  as HTMLLinkElement | null
    if (light) light.disabled = t === 'dark'
    if (dark)  dark.disabled  = t === 'light'
  }

  private _onHashChange = () => this._handleHash()

  private _handleHash() {
    const hash = location.hash.slice(1)
    if (!hash) {
      this._route = { type: 'home' }
      this._sections = []
      return
    }
    const m = hash.match(HASH_PATTERN)
    if (!m) {
      this._route = { type: 'home' }
      return
    }
    const id = Number(m[1])
    const section = m[2] ?? null
    if (!chapters.some((c) => c.id === id)) {
      this._route = { type: 'home' }
      return
    }
    this._route = { type: 'chapter', chapterId: id, sectionSlug: section }
  }

  private _navigate(id: number) {
    location.hash = `#ch${String(id).padStart(2, '0')}`
    this._drawerOpen = false
  }

  private _onThemeChange(e: Event) {
    const { theme } = (e as CustomEvent<{ theme: Theme }>).detail
    this._applyTheme(theme)
  }

  private _onChapterLoaded(e: Event) {
    const { metadata } = (e as CustomEvent).detail
    this._sections = metadata.sections ?? []
  }

  private _onNavNavigate(e: Event) {
    const { chapterId } = (e as CustomEvent<{ chapterId: number }>).detail
    this._navigate(chapterId)
  }

  render() {
    const isHome = this._route.type === 'home'
    const chId = this._route.type === 'chapter' ? this._route.chapterId : null

    return html`
      <!-- Top Bar -->
      <header class="topbar">
        <button
          class="hamburger"
          aria-label="開啟目錄"
          aria-expanded="${this._drawerOpen}"
          @click=${() => { this._drawerOpen = !this._drawerOpen }}
        >
          <span></span><span></span><span></span>
        </button>
        <a class="topbar-title" href="#" @click=${(e: Event) => { e.preventDefault(); location.hash = '' }}>
          Web Components 指南
        </a>
        <div class="topbar-right">
          <theme-toggle
            .theme=${this._theme}
            @theme-change=${this._onThemeChange}
          ></theme-toggle>
        </div>
      </header>

      <!-- Mobile Overlay -->
      ${this._drawerOpen
        ? html`<div
            class="overlay"
            @click=${() => { this._drawerOpen = false }}
          ></div>`
        : null}

      <!-- Layout -->
      <div class="layout">
        <!-- Left Sidebar -->
        <aside class="sidebar ${this._drawerOpen ? 'drawer-open' : ''}">
          <nav-sidebar
            .parts=${parts}
            .chapters=${chapters}
            .activeChapterId=${chId}
            .sections=${this._sections}
            @navigate=${this._onNavNavigate}
          ></nav-sidebar>
        </aside>

        <!-- Main Content -->
        <main class="content" @chapter-loaded=${this._onChapterLoaded}>
          ${isHome
            ? this._renderHome()
            : html`<chapter-viewer .chapterId=${chId}></chapter-viewer>`}
        </main>

        <!-- Right Sections Panel (desktop only) -->
        ${!isHome && this._sections.length
          ? html`<aside class="sections-aside">
              <sections-panel
                .sections=${this._sections}
                .chapterId=${chId ?? 0}
              ></sections-panel>
            </aside>`
          : null}
      </div>
    `
  }

  private _renderHome() {
    const totalSections = chapters.reduce((s, c) => s + c.sections.length, 0)
    const tagMap: Record<string, string> = {
      'TypeScript': 'tag-core',
      'Web Components': 'tag-tip',
      'Lit Framework': 'tag-lit',
      '面試準備': 'tag-interview',
    }

    return html`
      <div class="home">
        <div class="home-header">
          <div class="home-book-label">📖 技術書籍</div>
          <h1 class="home-title">Web Components：從零到生產環境</h1>
          <p class="home-subtitle">給前端工程師的完整指南 — TypeScript 優先、兼顧 Lit Framework、面試導向</p>
          <div class="home-tags">
            ${Object.entries(tagMap).map(([label, cls]) => html`
              <span class="tag ${cls}">${label}</span>
            `)}
          </div>
        </div>

        <!-- Stats -->
        <div class="home-stats">
          <div class="stat-card"><div class="stat-num">7</div><div class="stat-label">大部分</div></div>
          <div class="stat-card"><div class="stat-num">32</div><div class="stat-label">章節</div></div>
          <div class="stat-card"><div class="stat-num">${totalSections}+</div><div class="stat-label">小節</div></div>
          <div class="stat-card"><div class="stat-num">40+</div><div class="stat-label">程式碼範例</div></div>
        </div>

        <!-- TOC -->
        <div class="home-toc">
          ${parts.map((p) => {
            const pChapters = chapters.filter((c) => c.part === p.id)
            const open = this._homeExpandedParts.has(p.id)
            return html`
              <div class="toc-part p${p.id}">
                <button
                  class="toc-part-header"
                  @click=${() => {
                    const s = new Set(this._homeExpandedParts)
                    if (s.has(p.id)) s.delete(p.id)
                    else s.add(p.id)
                    this._homeExpandedParts = s
                  }}
                >
                  <span class="toc-part-num">第${p.id}部</span>
                  <span class="toc-part-title">${p.label.replace(/^第.部：/, '')}</span>
                  <span class="toc-part-range">${p.range} · ${p.level}</span>
                  <span class="toc-caret ${open ? 'open' : ''}">▶</span>
                </button>
                ${open
                  ? html`<div class="toc-chapters">
                      ${pChapters.map((ch) => html`
                        <a
                          class="toc-chapter"
                          href="#ch${String(ch.id).padStart(2, '0')}"
                          @click=${(e: Event) => { e.preventDefault(); this._navigate(ch.id) }}
                        >
                          <span class="toc-ch-num">${String(ch.id).padStart(2, '0')}</span>
                          <span class="toc-ch-title">${ch.title}</span>
                          ${ch.tags.length
                            ? html`<span class="toc-ch-tags">
                                ${ch.tags.slice(0, 2).map((t) => html`
                                  <span class="tag ${this._tagClass(t)} sm">${this._tagLabel(t)}</span>
                                `)}
                              </span>`
                            : null}
                        </a>
                      `)}
                    </div>`
                  : null}
              </div>
            `
          })}
        </div>
      </div>
    `
  }

  private _tagClass(tag: string): string {
    const m: Record<string, string> = {
      '實用技巧': 'tag-tip', '面試重點': 'tag-interview',
      '進階': 'tag-advanced', '專案實作': 'tag-project', 'Lit': 'tag-lit',
    }
    return m[tag] ?? 'tag-core'
  }

  private _tagLabel(tag: string): string {
    const m: Record<string, string> = {
      '實用技巧': '技巧', '面試重點': '面試', '進階': '進階', '專案實作': '專案', 'Lit': 'Lit',
    }
    return m[tag] ?? tag
  }
}
