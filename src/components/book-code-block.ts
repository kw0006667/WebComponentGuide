import { LitElement, css, html, unsafeCSS } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-javascript'
import { registerLitHighlighting } from '../lib/lit-prism'

registerLitHighlighting()

// Token colors are defined as CSS custom properties in tokens.css.
// CSS variables cross Shadow DOM boundaries, so :root / html[data-theme='dark']
// definitions in the global stylesheet apply here automatically.
const tokenStyles = unsafeCSS(`
  .token.comment,
  .token.prolog,
  .token.doctype,
  .token.cdata         { color: var(--prism-comment); font-style: italic; }

  .token.keyword,
  .token.control,
  .token.rule,
  .token.statement,
  .token.important,
  .token.module        { color: var(--prism-keyword); font-weight: 500; }

  .token.string,
  .token.template-string,
  .token.attr-value    { color: var(--prism-string); }

  .token.number,
  .token.hexcode,
  .token.unit          { color: var(--prism-number); }

  .token.boolean,
  .token.null,
  .token.undefined     { color: var(--prism-boolean); font-style: italic; }

  .token.function,
  .token.function-name { color: var(--prism-function); }

  .token.class-name    { color: var(--prism-class-name); }

  .token.operator,
  .token.entity,
  .token.url           { color: var(--prism-operator); }

  .token.punctuation   { color: var(--prism-punctuation); }

  .token.property,
  .token.variable      { color: var(--prism-property); }

  .token.regex         { color: var(--prism-regex); }

  .token.builtin       { color: var(--prism-builtin); }

  .token.tag           { color: var(--prism-tag); }

  .token.attr-name     { color: var(--prism-attr-name); }

  .token.parameter     { color: var(--prism-parameter); }

  .token.type,
  .token.type-declaration,
  .token.generic-function { color: var(--prism-type); }

  .token.deleted       { background: rgba(220, 38, 38, 0.12); color: var(--color-danger); }
  .token.inserted      { background: rgba(26, 158, 110, 0.12); color: var(--color-success); }
  .token.bold          { font-weight: 700; }
  .token.italic        { font-style: italic; }

  /* Lit tagged template literals */
  .token.template-tag  { color: var(--prism-function); font-weight: 500; }
`)

@customElement('book-code-block')
export class BookCodeBlock extends LitElement {
  @property({ type: String }) language = 'typescript'
  @property({ type: String }) label = 'TypeScript'
  @state() private code = ''
  @state() private copied = false

  static styles = [
    tokenStyles,
    css`
      :host { display: block; margin: 1.4rem 0; }

      .frame {
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid var(--color-border);
        background: var(--color-code-surface);
        box-shadow: var(--shadow-soft);
      }

      .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.65rem 1rem;
        border-bottom: 1px solid var(--color-border);
        background: color-mix(in srgb, var(--color-panel) 90%, transparent);
        color: var(--color-text-secondary);
        font-family: var(--font-mono);
        font-size: 0.72rem;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }

      .dots { display: flex; gap: 5px; }
      .dot {
        width: 10px; height: 10px;
        border-radius: 50%;
        background: var(--color-border);
      }

      button {
        border: 1px solid var(--color-border);
        background: transparent;
        color: inherit;
        border-radius: 999px;
        padding: 0.28rem 0.65rem;
        cursor: pointer;
        font-family: inherit;
        font-size: inherit;
        transition: background 150ms ease, border-color 150ms ease, transform 150ms ease;
      }
      button:hover {
        background: var(--color-bg-hover);
        border-color: var(--color-accent);
        transform: translateY(-1px);
      }

      pre {
        margin: 0;
        padding: 1.1rem 1.25rem;
        overflow-x: auto;
        font-family: var(--font-mono);
        font-size: 0.88rem;
        line-height: 1.75;
        background: transparent;
      }

      code { font-family: inherit; color: var(--color-text); }
    `,
  ]

  connectedCallback(): void {
    super.connectedCallback()
    const raw = this.textContent ?? ''
    this.code = raw.replace(/^\n+|\s+$/g, '')
    this.textContent = ''
  }

  private get _highlighted(): string {
    const grammar = Prism.languages[this.language]
    if (!grammar) return this._escapeHtml(this.code)
    return Prism.highlight(this.code, grammar, this.language)
  }

  private _escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  private async _copy() {
    await navigator.clipboard.writeText(this.code)
    this.copied = true
    setTimeout(() => { this.copied = false }, 1800)
  }

  render() {
    return html`
      <div class="frame">
        <div class="toolbar">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="dots">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
            <span>${this.label}</span>
          </div>
          <button type="button" @click=${this._copy}>
            ${this.copied ? '✓ 已複製' : '複製程式碼'}
          </button>
        </div>
        <pre><code class="language-${this.language}">${unsafeHTML(this._highlighted)}</code></pre>
      </div>
    `
  }
}
