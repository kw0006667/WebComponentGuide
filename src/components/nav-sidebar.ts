import { LitElement, css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import type { ChapterMeta, PartMeta, SectionMeta } from '../types.js'

@customElement('nav-sidebar')
export class NavSidebar extends LitElement {
  @property({ attribute: false }) parts: readonly PartMeta[] = []
  @property({ attribute: false }) chapters: readonly ChapterMeta[] = []
  @property({ attribute: false }) sections: readonly SectionMeta[] = []
  @property({ type: Number }) activeChapterId: number | null = null

  @state() private _openParts: Set<number> = new Set([1])
  @state() private _activeSlug = ''

  private _observer: IntersectionObserver | null = null

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow-y: auto;
      padding: 1rem 0;
      background: var(--color-bg-sidebar);
    }

    .nav-title {
      padding: 0 1rem 1rem;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--color-text-muted);
      border-bottom: 1px solid var(--color-border-secondary);
      margin-bottom: 0.5rem;
    }

    .part-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 0.55rem 1rem;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
      color: var(--color-text);
      font-family: var(--font-sans);
      font-size: 0.82rem;
      font-weight: 600;
      transition: background var(--transition);
    }
    .part-btn:hover { background: var(--color-bg-hover); }

    .part-badge {
      display: inline-block;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 1px 7px;
      border-radius: 99px;
      margin-right: auto;
    }

    /* Part colors */
    .p1 .part-badge { background: var(--part-1-bg); color: var(--part-1-text); }
    .p2 .part-badge { background: var(--part-2-bg); color: var(--part-2-text); }
    .p3 .part-badge { background: var(--part-3-bg); color: var(--part-3-text); }
    .p4 .part-badge { background: var(--part-4-bg); color: var(--part-4-text); }
    .p5 .part-badge { background: var(--part-5-bg); color: var(--part-5-text); }
    .p6 .part-badge { background: var(--part-6-bg); color: var(--part-6-text); }
    .p7 .part-badge { background: var(--part-7-bg); color: var(--part-7-text); }

    .part-label { flex: 1; line-height: 1.3; }

    .caret {
      font-size: 0.65rem;
      color: var(--color-text-muted);
      transition: transform 200ms ease;
      flex-shrink: 0;
    }
    .caret.open { transform: rotate(90deg); }

    .chapters { padding: 0; }

    .chapter-link {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 0.45rem 1rem 0.45rem 1.6rem;
      text-decoration: none;
      color: var(--color-text-secondary);
      font-size: 0.82rem;
      line-height: 1.4;
      transition: background var(--transition), color var(--transition);
      border-left: 2px solid transparent;
    }
    .chapter-link:hover {
      background: var(--color-bg-hover);
      color: var(--color-text);
      text-decoration: none;
    }
    .chapter-link.active {
      background: var(--color-accent-soft);
      color: var(--color-accent);
      border-left-color: var(--color-accent);
      font-weight: 500;
    }

    .ch-num {
      font-size: 0.68rem;
      color: var(--color-text-muted);
      min-width: 22px;
      font-variant-numeric: tabular-nums;
      padding-top: 1px;
    }

    .ch-tags { display: flex; gap: 3px; margin-left: auto; flex-shrink: 0; padding-top: 1px; }

    .badge {
      font-size: 0.6rem;
      padding: 1px 5px;
      border-radius: 99px;
      font-weight: 600;
      white-space: nowrap;
    }
    .b-tip      { background: var(--tag-tip-bg);       color: var(--tag-tip-text); }
    .b-inter    { background: var(--tag-interview-bg);  color: var(--tag-interview-text); }
    .b-adv      { background: var(--tag-advanced-bg);   color: var(--tag-advanced-text); }
    .b-proj     { background: var(--tag-project-bg);    color: var(--tag-project-text); }
    .b-lit      { background: var(--tag-lit-bg);        color: var(--tag-lit-text); }

    .part-section { margin-bottom: 2px; }

    /* Inline sections — only visible when the desktop right panel is hidden */
    .inline-sections {
      display: none;
      flex-direction: column;
      gap: 1px;
      margin: 0.15rem 0 0.35rem 2.6rem;
      padding-left: 0.75rem;
      border-left: 2px solid var(--color-border-secondary);
    }
    @media (max-width: 1480px) {
      .inline-sections { display: flex; }
    }

    .section-link {
      display: block;
      padding: 0.28rem 0.4rem;
      font-size: 0.78rem;
      line-height: 1.4;
      color: var(--color-text-muted);
      text-decoration: none;
      border-radius: var(--radius-sm);
      transition: color var(--transition), background var(--transition);
    }
    .section-link:hover {
      color: var(--color-text);
      background: var(--color-bg-hover);
      text-decoration: none;
    }
    .section-link.active {
      color: var(--color-accent);
      background: var(--color-accent-soft);
    }
  `

  updated(changed: Map<string, unknown>) {
    if (changed.has('sections') || changed.has('activeChapterId')) {
      this._setupObserver()
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this._observer?.disconnect()
  }

  private _setupObserver() {
    this._observer?.disconnect()
    this._activeSlug = ''
    if (!this.sections.length) return

    requestAnimationFrame(() => {
      const ratios: Record<string, number> = {}
      this._observer = new IntersectionObserver(
        (entries) => {
          for (const e of entries) ratios[e.target.id] = e.intersectionRatio
          const best = Object.entries(ratios).sort((a, b) => b[1] - a[1])[0]
          if (best && best[1] > 0) this._activeSlug = best[0]
        },
        { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.5, 1] },
      )
      for (const sec of this.sections) {
        const el = document.getElementById(sec.slug)
        if (el) this._observer!.observe(el)
      }
    })
  }

  private _togglePart(id: number) {
    const s = new Set(this._openParts)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    this._openParts = s
  }

  private _chaptersForPart(partId: number) {
    return this.chapters.filter((c) => c.part === partId)
  }

  private _badgeClass(tag: string): string {
    const map: Record<string, string> = {
      '實用技巧': 'b-tip',
      '面試重點': 'b-inter',
      '進階': 'b-adv',
      '專案實作': 'b-proj',
      'Lit': 'b-lit',
    }
    return map[tag] ?? ''
  }

  private _badgeLabel(tag: string): string {
    const map: Record<string, string> = {
      '實用技巧': '技巧',
      '面試重點': '面試',
      '進階': '進階',
      '專案實作': '專案',
      'Lit': 'Lit',
    }
    return map[tag] ?? tag
  }

  render() {
    return html`
      <div class="nav-title">Web Components 指南</div>
      ${this.parts.map((p) => {
        const open = this._openParts.has(p.id)
        const chs = this._chaptersForPart(p.id)
        return html`
          <div class="part-section p${p.id}">
            <button class="part-btn" @click=${() => this._togglePart(p.id)}>
              <span class="part-badge">第${p.id}部</span>
              <span class="part-label">${p.label.replace(/^第.部：/, '')}</span>
              <span class="caret ${open ? 'open' : ''}">▶</span>
            </button>
            ${open
              ? html`<div class="chapters">
                  ${chs.map((ch) => html`
                    <a
                      class="chapter-link ${ch.id === this.activeChapterId ? 'active' : ''}"
                      href="#ch${String(ch.id).padStart(2, '0')}"
                      @click=${(e: Event) => this._onChapterClick(e, ch.id)}
                    >
                      <span class="ch-num">${String(ch.id).padStart(2, '0')}</span>
                      <span style="flex:1">${ch.title}</span>
                      ${ch.tags.length
                        ? html`<span class="ch-tags">
                            ${ch.tags.slice(0, 2).map((t) => html`
                              <span class="badge ${this._badgeClass(t)}">${this._badgeLabel(t)}</span>
                            `)}
                          </span>`
                        : null}
                    </a>
                    ${ch.id === this.activeChapterId && this.sections.length
                      ? html`<div class="inline-sections">
                          ${this.sections.map((s) => html`
                            <a
                              class="section-link ${s.slug === this._activeSlug ? 'active' : ''}"
                              href="#ch${String(ch.id).padStart(2, '0')}-${s.slug}"
                              @click=${(e: Event) => this._onSectionClick(e, s.slug)}
                            >${s.title}</a>
                          `)}
                        </div>`
                      : null}
                  `)}
                </div>`
              : null}
          </div>
        `
      })}
    `
  }

  private _onChapterClick(e: Event, id: number) {
    e.preventDefault()
    this.dispatchEvent(new CustomEvent('navigate', {
      detail: { chapterId: id },
      bubbles: true,
      composed: true,
    }))
  }

  private _onSectionClick(e: Event, slug: string) {
    e.preventDefault()
    document.getElementById(slug)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
