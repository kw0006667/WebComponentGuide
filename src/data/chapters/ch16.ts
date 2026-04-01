export const metadata = {
  id: 16,
  part: 3,
  title: '原生 vs. Lit：模式對照翻譯手冊',
  tags: ['Lit', '實用技巧'] as string[],
  sections: [
    { slug: 'ch16-s01', title: '每個原生寫法對應的 Lit 版本 — 完整並排對照' },
    { slug: 'ch16-s02', title: '遷移指南：從原生升級到 Lit 而不破壞對外 API' },
    { slug: 'ch16-s03', title: '維持原生的時機（Micro-frontend、零依賴函式庫等）' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 16 · 第三部：Lit Framework — 更精簡、更慣用的寫法</div>
  <h1>原生 vs. Lit：模式對照翻譯手冊</h1>
  <p>本章是一本實用的對照手冊。無論你是要將原生 Web Components 遷移到 Lit，還是要理解 Lit 的某個模式在原生世界中對應什麼，這裡都有清晰的並排對照。最後一節也誠實地討論了什麼情況下你應該繼續使用原生而非 Lit。</p>
  <div class="chapter-tags">
    <span class="tag tag-lit">Lit</span>
    <span class="tag tag-tip">實用技巧</span>
  </div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch16-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">每個原生寫法對應的 Lit 版本 — 完整並排對照</span>
    </a>
    <a class="catalog-item" href="#ch16-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">遷移指南：從原生升級到 Lit 而不破壞對外 API</span>
    </a>
    <a class="catalog-item" href="#ch16-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">維持原生的時機（Micro-frontend、零依賴函式庫等）</span>
    </a>
  </div>
</div>

<h2 id="ch16-s01">每個原生寫法對應的 Lit 版本 — 完整並排對照</h2>

<p>以下整理了 10 個最常見的開發模式，每個模式都有原生和 Lit 的完整對照。</p>

<h3>模式 1：元件定義與 Shadow DOM</h3>

<book-code-block language="typescript" label="模式 1：元件定義（原生 vs Lit）">
// ── 原生 ──────────────────────────────────────────────────
class NativeButton extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }
  connectedCallback() {
    this.shadowRoot!.innerHTML = \`
      &lt;style&gt;button { background: blue; color: white; }&lt;/style&gt;
      &lt;button&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/button&gt;
    \`
  }
}
customElements.define('native-button', NativeButton)

// ── Lit ───────────────────────────────────────────────────
import { LitElement, html, css } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('lit-button')
class LitButton extends LitElement {
  // Shadow DOM 自動建立（open 模式）
  // styles 使用 Constructable Stylesheets（所有實例共享）
  static override styles = css\`button { background: blue; color: white; }\`

  override render() {
    return html\`&lt;button&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/button&gt;\`
  }
}
</book-code-block>

<h3>模式 2：Reactive Property（帶 Attribute 同步）</h3>

<book-code-block language="typescript" label="模式 2：Reactive Property（原生 vs Lit）">
// ── 原生 ──────────────────────────────────────────────────
class NativeProgress extends HTMLElement {
  static observedAttributes = ['value', 'max']

  private _value = 0
  private _max = 100

  get value() { return this._value }
  set value(v: number) {
    this._value = v
    this.setAttribute('value', String(v))  // reflect
    this.updateDOM()
  }

  get max() { return this._max }
  set max(v: number) {
    this._max = v
    this.setAttribute('max', String(v))
    this.updateDOM()
  }

  attributeChangedCallback(name: string, _: string | null, newVal: string | null) {
    if (name === 'value') this._value = Number(newVal)
    if (name === 'max') this._max = Number(newVal)
    this.updateDOM()
  }

  connectedCallback() { this.attachShadow({ mode: 'open' }); this.updateDOM() }

  private updateDOM() {
    if (!this.shadowRoot) return
    const pct = Math.min((this._value / this._max) * 100, 100)
    this.shadowRoot.innerHTML = \`&lt;div style="width:\${pct}%; background:blue; height:8px;"&gt;&lt;/div&gt;\`
  }
}
customElements.define('native-progress', NativeProgress)

// ── Lit ───────────────────────────────────────────────────
import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('lit-progress')
class LitProgress extends LitElement {
  static override styles = css\`
    .bar { height: 8px; background: blue; transition: width 0.3s; }
  \`

  // @property 自動處理：attribute 同步、setter 觸發更新、reflect
  @property({ type: Number, reflect: true }) value = 0
  @property({ type: Number, reflect: true }) max = 100

  override render() {
    const pct = Math.min((this.value / this.max) * 100, 100)
    return html\`&lt;div class="bar" style="width: \${pct}%"&gt;&lt;/div&gt;\`
  }
}
</book-code-block>

<h3>模式 3：事件綁定</h3>

<book-code-block language="typescript" label="模式 3：事件綁定（原生 vs Lit）">
// ── 原生 ──────────────────────────────────────────────────
// 需要手動管理 listener 的新增和移除，避免記憶體洩漏
class NativeInput extends HTMLElement {
  private handleInput: ((e: Event) =&gt; void) | null = null

  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = '&lt;input /&gt;'
    const input = shadow.querySelector('input')!

    this.handleInput = (e: Event) =&gt; {
      const val = (e.target as HTMLInputElement).value
      this.dispatchEvent(new CustomEvent('change', {
        detail: { value: val }, bubbles: true, composed: true,
      }))
    }
    input.addEventListener('input', this.handleInput)
  }

  disconnectedCallback() {
    const input = this.shadowRoot?.querySelector('input')
    if (this.handleInput) {
      input?.removeEventListener('input', this.handleInput)
    }
  }
}

// ── Lit ───────────────────────────────────────────────────
import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('lit-input')
class LitInput extends LitElement {
  // Lit 在元件更新時自動管理事件監聽器
  // @event syntax：@click, @input, @change 等
  private handleInput(e: Event) {
    const val = (e.target as HTMLInputElement).value
    this.dispatchEvent(new CustomEvent('change', {
      detail: { value: val }, bubbles: true, composed: true,
    }))
  }

  override render() {
    // 不需要手動 removeEventListener，Lit 自動處理
    return html\`&lt;input @input=\${this.handleInput} /&gt;\`
  }
}
</book-code-block>

<h3>模式 4：條件渲染</h3>

<book-code-block language="typescript" label="模式 4：條件渲染（原生 vs Lit）">
// ── 原生 ──────────────────────────────────────────────────
// 每次狀態變更都需要手動重建部分 DOM
class NativeAlert extends HTMLElement {
  private _visible = false

  get visible() { return this._visible }
  set visible(v: boolean) {
    this._visible = v
    this.render()
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' })
    this.render()
  }

  private render() {
    if (!this.shadowRoot) return
    if (this._visible) {
      this.shadowRoot.innerHTML = \`
        &lt;div class="alert"&gt;
          &lt;slot&gt;&lt;/slot&gt;
          &lt;button class="close"&gt;&amp;times;&lt;/button&gt;
        &lt;/div&gt;
      \`
      this.shadowRoot.querySelector('.close')?.addEventListener('click', () =&gt; {
        this._visible = false
        this.render()
      })
    } else {
      this.shadowRoot.innerHTML = ''
    }
  }
}

// ── Lit ───────────────────────────────────────────────────
import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('lit-alert')
class LitAlert extends LitElement {
  @property({ type: Boolean, reflect: true }) visible = false

  override render() {
    // 使用 JavaScript 三元表達式進行條件渲染
    // null / undefined 渲染為空
    return this.visible
      ? html\`
          &lt;div class="alert"&gt;
            &lt;slot&gt;&lt;/slot&gt;
            &lt;button class="close" @click=\${() =&gt; { this.visible = false }}&gt;
              &amp;times;
            &lt;/button&gt;
          &lt;/div&gt;
        \`
      : null
  }
}
</book-code-block>

<h3>模式 5：列表渲染</h3>

<book-code-block language="typescript" label="模式 5：列表渲染（原生 vs Lit）">
// ── 原生 ──────────────────────────────────────────────────
class NativeList extends HTMLElement {
  private _items: string[] = []

  set items(val: string[]) {
    this._items = val
    this.render()
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' })
    this.render()
  }

  private render() {
    if (!this.shadowRoot) return
    // 每次更新重建所有 li，效率低且會丟失 DOM 狀態
    this.shadowRoot.innerHTML = [
      '&lt;ul&gt;',
      ...this._items.map(item =&gt; '&lt;li&gt;' + item + '&lt;/li&gt;'),
      '&lt;/ul&gt;',
    ].join('')
  }
}

// ── Lit ───────────────────────────────────────────────────
import { LitElement, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { repeat } from 'lit/directives/repeat.js'

interface ListItem { id: string; label: string }

@customElement('lit-list')
class LitList extends LitElement {
  @property({ attribute: false }) items: ListItem[] = []

  override render() {
    return html\`
      &lt;ul&gt;
        \${repeat(
          this.items,
          item =&gt; item.id,
          item =&gt; html\`&lt;li&gt;\${item.label}&lt;/li&gt;\`
        )}
      &lt;/ul&gt;
    \`
  }
}
</book-code-block>

<h3>模式 6–10：快速對照表</h3>

<table>
  <thead>
    <tr>
      <th>模式</th>
      <th>原生寫法</th>
      <th>Lit 寫法</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>存取 Shadow DOM 元素</td>
      <td><code>this.shadowRoot.querySelector('input')</code></td>
      <td><code>@query('input') input!: HTMLInputElement</code></td>
    </tr>
    <tr>
      <td>共用樣式（多實例）</td>
      <td>每個實例插入 <code>&lt;style&gt;</code>，手動建立 CSSStyleSheet</td>
      <td><code>static styles = css\`...\`</code>（自動 Constructable Stylesheets）</td>
    </tr>
    <tr>
      <td>生命週期（首次掛載後）</td>
      <td><code>connectedCallback()</code> + DOM 查詢</td>
      <td><code>firstUpdated()</code>（保證 DOM 已渲染）</td>
    </tr>
    <tr>
      <td>私有響應式狀態</td>
      <td>手動 setter + 呼叫 <code>this.render()</code></td>
      <td><code>@state() private _count = 0</code></td>
    </tr>
    <tr>
      <td>Attribute 的 Boolean 型別</td>
      <td><code>this.hasAttribute('disabled')</code> / <code>this.toggleAttribute()</code></td>
      <td><code>@property({ type: Boolean, reflect: true }) disabled = false</code></td>
    </tr>
  </tbody>
</table>

<h2 id="ch16-s02">遷移指南：從原生升級到 Lit 而不破壞對外 API</h2>

<p>從原生遷移到 Lit 的最大優勢是：元件的對外 API（HTML attribute、property、event 名稱）可以完全保持不變，對使用者來說是透明的升級。</p>

<book-code-block language="typescript" label="遷移策略：保持對外 API 不變">
// ── 原始版本（原生 Web Component）──────────────────────────
// 假設這個元件已被廣泛使用，HTML 中有很多這樣的用法：
// &lt;app-tag variant="primary" closable&gt;標籤文字&lt;/app-tag&gt;
// el.variant = 'success'
// el.addEventListener('close', handler)

// 原生版本的公開 API：
// Attributes: variant (string), closable (boolean)
// Events: 'close' (不帶 detail)

class NativeAppTag extends HTMLElement {
  static observedAttributes = ['variant', 'closable']
  // ... 原生實作 ...
}
customElements.define('app-tag', NativeAppTag)

// ── 遷移後（Lit 版本）——對外 API 完全相同 ──────────────────
import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'

// 重要：使用相同的元素名稱 'app-tag'
@customElement('app-tag')
class LitAppTag extends LitElement {
  static override styles = css\`
    :host { display: inline-flex; align-items: center; gap: 4px; }
    .tag {
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    :host([variant="primary"]) .tag { background: #dbeafe; color: #1d4ed8; }
    :host([variant="success"]) .tag { background: #dcfce7; color: #166534; }
    :host([variant="danger"]) .tag  { background: #fee2e2; color: #991b1b; }
    .close { background: none; border: none; cursor: pointer; padding: 0 2px; }
  \`

  // 保持相同的 attribute 名稱：variant、closable
  @property({ reflect: true }) variant: 'primary' | 'success' | 'danger' = 'primary'
  @property({ type: Boolean, reflect: true }) closable = false

  override render() {
    return html\`
      &lt;span class="tag"&gt;
        &lt;slot&gt;&lt;/slot&gt;
        \${this.closable
          ? html\`
              &lt;button class="close"
                @click=\${this.handleClose}
                aria-label="移除標籤"
              &gt;
                &amp;times;
              &lt;/button&gt;
            \`
          : null
        }
      &lt;/span&gt;
    \`
  }

  // 保持相同的事件名稱：'close'
  private handleClose() {
    this.dispatchEvent(new CustomEvent('close', {
      bubbles: true,
      composed: true,
    }))
  }
}

// 遷移後，所有既有的 HTML 和 JavaScript 程式碼繼續運作：
// &lt;app-tag variant="success" closable&gt;已完成&lt;/app-tag&gt;  ✅ 正常
// document.querySelector('app-tag').variant = 'danger'  ✅ 正常
// tag.addEventListener('close', () =&gt; tag.remove())     ✅ 正常
</book-code-block>

<h3>遷移步驟</h3>

<table>
  <thead>
    <tr><th>步驟</th><th>說明</th><th>注意事項</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>1. 安裝 Lit</td>
      <td><code>npm install lit</code></td>
      <td>確認 tsconfig 的 experimentalDecorators 設定</td>
    </tr>
    <tr>
      <td>2. 繼承 LitElement</td>
      <td>從 <code>HTMLElement</code> 改為 <code>LitElement</code></td>
      <td>LitElement 內部會自動呼叫 <code>attachShadow</code></td>
    </tr>
    <tr>
      <td>3. 轉換 attributes</td>
      <td>用 <code>@property</code> 取代 observedAttributes + setter/getter</td>
      <td>保持相同的 attribute 名稱</td>
    </tr>
    <tr>
      <td>4. 轉換 render</td>
      <td>把 innerHTML 賦值改為 <code>render()</code> 回傳 html tag</td>
      <td>事件綁定語法從 onclick 改為 @click</td>
    </tr>
    <tr>
      <td>5. 轉換樣式</td>
      <td>把內嵌 <code>&lt;style&gt;</code> 改為 <code>static styles = css\`...\`</code></td>
      <td>無需手動建立 CSSStyleSheet</td>
    </tr>
    <tr>
      <td>6. 測試</td>
      <td>執行既有的 E2E 測試，確認對外 API 行為不變</td>
      <td>若有 render 時序依賴，注意 Lit 的非同步更新</td>
    </tr>
  </tbody>
</table>

<h2 id="ch16-s03">維持原生的時機（Micro-frontend、零依賴函式庫等）</h2>

<p>Lit 不是萬能解藥。以下是你應該認真考慮繼續使用原生 Web Components 的情境：</p>

<h3>何時選擇原生 Web Components</h3>

<table>
  <thead>
    <tr>
      <th>情境</th>
      <th>原因</th>
      <th>Lit 的問題</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>零依賴函式庫</td>
      <td>函式庫的 bundle 大小是核心指標</td>
      <td>Lit runtime 約 5KB，強加給所有使用者</td>
    </tr>
    <tr>
      <td>Micro-frontend 邊界元件</td>
      <td>多個團隊各自升級 Lit 版本可能衝突</td>
      <td>若不同版本 Lit 被同時載入，可能有行為差異</td>
    </tr>
    <tr>
      <td>只有一個靜態、無狀態的元件</td>
      <td>5KB overhead 的 ROI 太低</td>
      <td>過度設計</td>
    </tr>
    <tr>
      <td>需要完全控制 update 時序</td>
      <td>某些極端效能優化需要同步更新</td>
      <td>Lit 的更新是非同步的（microtask），難以介入</td>
    </tr>
    <tr>
      <td>嵌入第三方環境，無法控制 CSP</td>
      <td>Constructable Stylesheets 在某些 CSP 設定下可能被阻擋</td>
      <td>需要額外配置</td>
    </tr>
  </tbody>
</table>

<h3>混合策略：部分使用 Lit</h3>

<book-code-block language="typescript" label="混合策略：原生與 Lit 共存">
// 零依賴的「葉節點」元件使用原生
// 這個元件會被第三方嵌入，必須零依賴
class EmbeddableWidget extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = \`
      &lt;style&gt;:host { all: initial; display: block; }&lt;/style&gt;
      &lt;div&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/div&gt;
    \`
  }
}
customElements.define('embeddable-widget', EmbeddableWidget)

// 複雜的「應用層」元件使用 Lit
// 這些元件只在你自己的應用中使用，5KB overhead 是值得的
import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('app-dashboard')
class AppDashboard extends LitElement {
  // 複雜的狀態管理、Context、Controller...
  override render() {
    return html\`
      &lt;!-- 在 Lit 元件中使用原生元件完全沒問題 --&gt;
      &lt;embeddable-widget&gt;...&lt;/embeddable-widget&gt;
    \`
  }
}

// 決策問題：
// - 這個元件會被第三方使用嗎？   → 考慮原生
// - 這個元件有複雜的動態 UI 嗎？  → 考慮 Lit
// - 這個元件是 Design System 的一部分嗎？→ Lit 是好選擇（runtime 共享）
// - 這個元件需要在多個框架中運作？ → 原生（最廣泛相容）
</book-code-block>

<book-callout variant="tip" title="最終建議">
  <p>對於大多數應用程式和元件庫，Lit 是正確的選擇。但如果你在設計一個對外發布的、需要被各種環境嵌入的 SDK 級元件，請認真評估原生 Web Components——它的「零依賴」特性在嚴苛的環境中是無可替代的優勢。</p>
</book-callout>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>從原生遷移到 Lit 時，保持相同的 attribute 名稱、property 名稱和事件名稱，使用者不需要修改任何程式碼；而在零依賴函式庫、Micro-frontend 邊界和嵌入式 Widget 等場景，原生 Web Components 的「零依賴」特性依然是無可替代的優勢。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch15">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">Lit Labs 與周邊生態系</span>
    </a>
    <a class="footer-link" href="#ch17">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">大規模狀態管理</span>
    </a>
  </div>
</div>
`
