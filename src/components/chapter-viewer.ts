import { LitElement, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-javascript'
import type { ChapterModule } from '../types.js'

@customElement('chapter-viewer')
export class ChapterViewer extends LitElement {
  @property({ type: Number }) chapterId: number | null = null
  @state() private _html = ''
  @state() private _loading = false
  @state() private _error = ''
  private _lastId: number | null = null

  // Use light DOM so content.css typography applies directly
  override createRenderRoot() { return this }

  updated(changed: Map<string, unknown>) {
    if (changed.has('chapterId') && this.chapterId !== this._lastId) {
      void this._load(this.chapterId)
    }
  }

  private async _load(id: number | null) {
    if (id === null) {
      this._html = ''
      this._lastId = null
      return
    }

    this._loading = true
    this._error = ''
    this._lastId = id

    try {
      const padded = String(id).padStart(2, '0')
      const mod = await import(`../data/chapters/ch${padded}.ts`) as ChapterModule
      this._html = mod.content

      // Fire event so app-shell can update sections panel
      this.dispatchEvent(new CustomEvent('chapter-loaded', {
        detail: { metadata: mod.metadata },
        bubbles: true,
        composed: true,
      }))

      // Let Lit re-render, then highlight code
      await this.updateComplete
      this._highlightCode()
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'auto' })
    } catch (err) {
      this._error = `無法載入第 ${id} 章。請確認章節內容已建立。`
      console.error(err)
    } finally {
      this._loading = false
    }
  }

  private _highlightCode() {
    // book-code-block highlights internally via Prism.highlight().
    // Plain <pre><code> blocks in light DOM get highlighted here.
    this.querySelectorAll('pre code').forEach((el) => {
      Prism.highlightElement(el)
    })
  }

  render() {
    if (this._loading) {
      return html`<div class="loading-state" style="
        display:flex;align-items:center;justify-content:center;
        min-height:300px;color:var(--color-text-muted);font-size:0.9rem;
      ">載入中…</div>`
    }
    if (this._error) {
      return html`<div class="error-state" style="
        display:flex;align-items:center;justify-content:center;
        min-height:300px;color:var(--color-danger);font-size:0.9rem;
        text-align:center;padding:2rem;
      ">${this._error}</div>`
    }
    return html`${unsafeHTML(this._html)}`
  }
}
