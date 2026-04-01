import { LitElement, css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import type { SectionMeta } from '../types.js'

@customElement('sections-panel')
export class SectionsPanel extends LitElement {
  @property({ attribute: false }) sections: readonly SectionMeta[] = []
  @property({ type: Number }) chapterId = 0
  @state() private activeSlug = ''

  private _observer: IntersectionObserver | null = null

  static styles = css`
    :host {
      display: block;
      padding: 0 0.5rem;
    }

    .panel-label {
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--color-text-muted);
      padding: 0 0.5rem 0.6rem;
      margin-bottom: 0.25rem;
    }

    nav { display: flex; flex-direction: column; gap: 1px; }

    a {
      display: block;
      padding: 0.35rem 0.5rem;
      font-size: 0.8rem;
      line-height: 1.4;
      color: var(--color-text-muted);
      border-radius: var(--radius-sm);
      text-decoration: none;
      border-left: 2px solid transparent;
      transition: color var(--transition), background var(--transition), border-color var(--transition);
    }
    a:hover {
      color: var(--color-text);
      background: var(--color-bg-hover);
      text-decoration: none;
    }
    a.active {
      color: var(--color-accent);
      border-left-color: var(--color-accent);
      background: var(--color-accent-soft);
    }
  `

  updated(changed: Map<string, unknown>) {
    if (changed.has('chapterId') || changed.has('sections')) {
      this._setupObserver()
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this._observer?.disconnect()
  }

  private _setupObserver() {
    this._observer?.disconnect()
    if (!this.sections.length) return

    // Wait for content to render in the main area
    requestAnimationFrame(() => {
      const entries: Record<string, number> = {}
      this._observer = new IntersectionObserver(
        (obs) => {
          for (const e of obs) {
            entries[e.target.id] = e.intersectionRatio
          }
          const best = Object.entries(entries).sort((a, b) => b[1] - a[1])[0]
          if (best && best[1] > 0) this.activeSlug = best[0]
        },
        { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.5, 1] },
      )

      for (const sec of this.sections) {
        const el = document.getElementById(sec.slug)
        if (el) this._observer!.observe(el)
      }
    })
  }

  render() {
    if (!this.sections.length) return html``
    return html`
      <div class="panel-label">本章目錄</div>
      <nav>
        ${this.sections.map(
          (s) => html`
            <a
              href="#ch${String(this.chapterId).padStart(2, '0')}-${s.slug}"
              class=${s.slug === this.activeSlug ? 'active' : ''}
              @click=${(e: Event) => this._onClick(e, s.slug)}
            >${s.title}</a>
          `,
        )}
      </nav>
    `
  }

  private _onClick(e: Event, slug: string) {
    e.preventDefault()
    const el = document.getElementById(slug)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      this.activeSlug = slug
    }
  }
}
