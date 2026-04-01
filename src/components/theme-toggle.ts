import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { Theme } from '../types.js'

@customElement('theme-toggle')
export class ThemeToggle extends LitElement {
  @property({ type: String }) theme: Theme = 'light'

  static styles = css`
    :host { display: inline-flex; }

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: background var(--transition), color var(--transition), border-color var(--transition);
    }
    button:hover {
      background: var(--color-bg-hover);
      color: var(--color-text);
      border-color: var(--color-border-strong);
    }

    svg { width: 16px; height: 16px; stroke: currentColor; fill: none; stroke-width: 2; }
  `

  private _toggle() {
    this.dispatchEvent(new CustomEvent<{ theme: Theme }>('theme-change', {
      detail: { theme: this.theme === 'light' ? 'dark' : 'light' },
      bubbles: true,
      composed: true,
    }))
  }

  render() {
    const isDark = this.theme === 'dark'
    return html`
      <button
        type="button"
        aria-label="${isDark ? '切換到亮色模式' : '切換到深色模式'}"
        title="${isDark ? '切換到亮色模式' : '切換到深色模式'}"
        @click=${this._toggle}
      >
        ${isDark
          ? html`<!-- sun icon -->
              <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>`
          : html`<!-- moon icon -->
              <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>`}
      </button>
    `
  }
}
