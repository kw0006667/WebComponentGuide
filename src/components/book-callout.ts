import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('book-callout')
export class BookCallout extends LitElement {
  @property({ type: String }) variant = 'info'
  @property({ type: String }) title = ''

  static styles = css`
    :host { display: block; margin: 1.25rem 0; }

    .callout {
      border-radius: 14px;
      border: 1px solid var(--callout-border, var(--color-border));
      background: var(--callout-bg, var(--color-bg-elevated));
      padding: 1rem 1.2rem;
      color: var(--color-text);
    }

    .title {
      font-weight: 700;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .content {
      line-height: 1.8;
      font-size: 0.93rem;
      color: var(--color-text-secondary);
    }

    ::slotted(p:first-child),
    ::slotted(ul:first-child),
    ::slotted(ol:first-child) { margin-top: 0; }

    :host([variant='tip']) .callout {
      --callout-bg: color-mix(in srgb, var(--color-success) 10%, var(--color-bg-elevated));
      --callout-border: color-mix(in srgb, var(--color-success) 35%, transparent);
    }
    :host([variant='warning']) .callout {
      --callout-bg: color-mix(in srgb, var(--color-warning) 10%, var(--color-bg-elevated));
      --callout-border: color-mix(in srgb, var(--color-warning) 40%, transparent);
    }
    :host([variant='info']) .callout {
      --callout-bg: color-mix(in srgb, var(--color-accent) 8%, var(--color-bg-elevated));
      --callout-border: color-mix(in srgb, var(--color-accent) 30%, transparent);
    }
    :host([variant='danger']) .callout {
      --callout-bg: color-mix(in srgb, var(--color-danger) 10%, var(--color-bg-elevated));
      --callout-border: color-mix(in srgb, var(--color-danger) 35%, transparent);
    }
  `

  private _icon() {
    const icons: Record<string, string> = {
      tip: '💡', warning: '⚠️', info: 'ℹ️', danger: '🚨',
    }
    return icons[this.variant] ?? 'ℹ️'
  }

  render() {
    return html`
      <div class="callout ${this.variant}">
        ${this.title
          ? html`<div class="title"><span>${this._icon()}</span>${this.title}</div>`
          : null}
        <div class="content"><slot></slot></div>
      </div>
    `
  }
}
