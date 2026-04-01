export const metadata = {
  id: 11,
  part: 3,
  title: '用一章理解 Lit — 核心思維模型',
  tags: ['Lit'] as string[],
  sections: [
    { slug: 'ch11-s01', title: 'Lit 在原生 Web Components 之上加了什麼，又沒有改變什麼' },
    { slug: 'ch11-s02', title: 'LitElement、html、css — 九成時間只需要這三個' },
    { slug: 'ch11-s03', title: '響應式更新週期：requestUpdate → performUpdate → render' },
    { slug: 'ch11-s04', title: '原生 vs. Lit：同一個 Button Component 的兩種寫法並排對照' },
    { slug: 'ch11-s05', title: 'Lit 值得引入的情境，以及不適合的情境' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 11 · 第三部：Lit Framework — 更精簡、更慣用的寫法</div>
  <h1>用一章理解 Lit — 核心思維模型</h1>
  <p>Lit 不是一個取代 Web Components 的框架，它是一層薄薄的抽象，讓你用更少的程式碼做到同樣的事。理解 Lit 加了什麼、沒改變什麼，才能真正駕馭它。本章從思維模型出發，帶你建立對 Lit 的完整直覺。</p>
  <div class="chapter-tags">
    <span class="tag tag-lit">Lit</span>
  </div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch11-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">Lit 在原生 Web Components 之上加了什麼，又沒有改變什麼</span>
    </a>
    <a class="catalog-item" href="#ch11-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">LitElement、html、css — 九成時間只需要這三個</span>
    </a>
    <a class="catalog-item" href="#ch11-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">響應式更新週期：requestUpdate → performUpdate → render</span>
    </a>
    <a class="catalog-item" href="#ch11-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">原生 vs. Lit：同一個 Button Component 的兩種寫法並排對照</span>
    </a>
    <a class="catalog-item" href="#ch11-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">Lit 值得引入的情境，以及不適合的情境</span>
    </a>
  </div>
</div>

<h2 id="ch11-s01">Lit 在原生 Web Components 之上加了什麼，又沒有改變什麼</h2>

<p>在評估是否引入 Lit 之前，必須先搞清楚它在原生 Web Components 的架構上做了哪些事。Lit 的核心設計原則是「不改變瀏覽器的既有行為，只幫你少寫樣板程式碼」。</p>

<h3>Lit 新增的能力</h3>

<table>
  <thead>
    <tr><th>原生需要手動處理</th><th>Lit 自動處理</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>手動呼叫 <code>attachShadow()</code></td>
      <td>LitElement 預設自動建立 open Shadow Root</td>
    </tr>
    <tr>
      <td>手動管理 <code>innerHTML</code> 或 DOM 更新</td>
      <td><code>render()</code> 方法 + <code>html</code> tag 處理高效 DOM 更新</td>
    </tr>
    <tr>
      <td>手動在 setter 中呼叫更新函式</td>
      <td><code>@property</code> / <code>@state</code> Decorator 自動觸發重新渲染</td>
    </tr>
    <tr>
      <td>手動批次更新（Promise microtask）</td>
      <td>更新週期自動批次，一個 tick 內多次狀態變更只渲染一次</td>
    </tr>
    <tr>
      <td>手動插入 <code>&lt;style&gt;</code> 標籤</td>
      <td><code>static styles</code> 使用 Constructable Stylesheets 自動共享</td>
    </tr>
    <tr>
      <td>手動實作 Reactive Controller 協議</td>
      <td>內建 <code>addController</code> / 生命週期驅動</td>
    </tr>
  </tbody>
</table>

<h3>Lit 沒有改變的事</h3>

<p>Lit 不改變任何 Web Components 的基礎行為：元件仍然是原生的 Custom Element，Shadow DOM 仍然是瀏覽器原生的封裝機制，Slots 仍然按 HTML 規格運作，Custom Events 的工作方式完全一樣。這意味著用 Lit 寫的元件在 React、Vue、Angular 或純 HTML 中的使用方式完全相同。</p>

<h2 id="ch11-s02">LitElement、html、css — 九成時間只需要這三個</h2>

<p>Lit 的 API 表面非常小。你會用到的核心匯出只有三個：<code>LitElement</code>（基礎類別）、<code>html</code>（Template Literal tag）、和 <code>css</code>（樣式 Template Literal tag）。</p>

<book-code-block language="typescript" label="LitElement 基礎結構">
import { LitElement, html, css } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

@customElement('my-counter')
export class MyCounter extends LitElement {
  // static styles 使用 Constructable Stylesheets，在所有實例間共享
  static override styles = css\`
    :host {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: sans-serif;
    }
    button {
      background: var(--counter-btn-bg, #3b82f6);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 12px;
      cursor: pointer;
      font-size: 1rem;
    }
    button:hover { filter: brightness(1.1); }
    .count {
      min-width: 2ch;
      text-align: center;
      font-size: 1.5rem;
      font-weight: 700;
    }
  \`

  // @property：對外公開，支援 attribute 反射
  @property({ type: Number }) initialValue = 0

  // @state：元件私有狀態，不對外暴露
  @state() private count = 0

  override connectedCallback() {
    super.connectedCallback()
    this.count = this.initialValue
  }

  override render() {
    // html tag 是一個 Tagged Template Literal
    // 它建立 TemplateResult，Lit 用它進行高效的 DOM 差異更新
    return html\`
      &lt;button @click=\${this.decrement}&gt;−&lt;/button&gt;
      &lt;span class="count"&gt;\${this.count}&lt;/span&gt;
      &lt;button @click=\${this.increment}&gt;+&lt;/button&gt;
    \`
  }

  private increment = () => { this.count++ }
  private decrement = () => { this.count-- }
}
</book-code-block>

<book-callout variant="tip" title="html tag 的效能秘密">
  <p>Lit 的 <code>html</code> tag 第一次執行時會解析 Template 的靜態結構，之後的更新只替換動態綁定的部分（binding），而不會重建整個 DOM 樹。這就是所謂的「Sticky Binding」——靜態結構只建立一次，動態值持續更新到相同的 DOM 節點上。</p>
</book-callout>

<h2 id="ch11-s03">響應式更新週期：requestUpdate → performUpdate → render</h2>

<p>理解 Lit 的更新週期是預測元件行為、避免無限迴圈的關鍵。整個週期分為三個主要階段，並且所有更新都是非同步的（在下一個 microtask 執行）。</p>

<book-code-block language="typescript" label="更新週期：各階段的執行時機">
import { LitElement, html, css, PropertyValues } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('update-demo')
class UpdateDemo extends LitElement {
  @property({ type: String }) name = ''
  @property({ type: Number }) count = 0

  // ── 更新前 ──────────────────────────────────────────────────
  // willUpdate：在 render 之前同步執行，適合根據 props 衍生計算值
  // changedProperties 包含本次更新中所有變更的 property 及其舊值
  override willUpdate(changedProperties: PropertyValues&lt;this&gt;) {
    if (changedProperties.has('name') || changedProperties.has('count')) {
      // 在這裡更新衍生狀態，不會觸發額外的更新週期
      // 因為 willUpdate 在更新週期內同步執行
      this._label = \`\${this.name}: \${this.count}\`
    }
  }
  private _label = ''

  // ── 渲染 ────────────────────────────────────────────────────
  override render() {
    return html\`&lt;p&gt;\${this._label}&lt;/p&gt;\`
  }

  // ── 更新後（首次）───────────────────────────────────────────
  // firstUpdated：元件首次渲染到 DOM 後執行一次
  // 適合初始化需要 DOM 的邏輯（查詢元素、初始化第三方函式庫）
  override firstUpdated() {
    const p = this.shadowRoot!.querySelector('p')
    console.log('首次渲染完成，DOM 元素：', p)
  }

  // ── 每次更新後 ───────────────────────────────────────────────
  // updated：每次更新後執行，包含首次
  // 適合觀察副作用（測量 DOM 尺寸、觸發動畫）
  override updated(changedProperties: PropertyValues&lt;this&gt;) {
    if (changedProperties.has('count')) {
      const oldCount = changedProperties.get('count') as number
      console.log(\`count 從 \${oldCount} 變更為 \${this.count}\`)
    }
  }
}
</book-code-block>

<h3>更新週期流程圖</h3>

<book-code-block language="text" label="Lit 更新週期（文字圖）">
property/state 變更
    │
    ▼
requestUpdate()   ← 標記需要更新，若已在佇列中則略過
    │
    ▼
[等待 microtask / Promise.resolve()]
    │
    ▼
performUpdate()   ← 實際執行更新
    │
    ├─→ shouldUpdate(changedProps)  ← 回傳 false 可中止本次更新
    │
    ├─→ willUpdate(changedProps)    ← 同步、更新前的準備工作
    │
    ├─→ update(changedProps)        ← 呼叫 render() 並提交 DOM
    │       └─→ render()           ← 回傳 TemplateResult
    │
    ├─→ firstUpdated(changedProps)  ← 僅第一次
    │
    └─→ updated(changedProps)       ← 每次更新後
            │
            └─→ updateComplete Promise 解析
</book-code-block>

<h2 id="ch11-s04">原生 vs. Lit：同一個 Button Component 的兩種寫法並排對照</h2>

<p>最好的學習方式是對照。以下是完全相同功能的 <code>&lt;app-button&gt;</code>，用原生 Web Components 和 Lit 各實作一遍：</p>

<h3>原生 Web Components 實作</h3>

<book-code-block language="typescript" label="原生 Web Components：AppButton">
// 原生版本：約 80 行
class NativeAppButton extends HTMLElement {
  static observedAttributes = ['variant', 'disabled', 'size']

  private _variant: 'primary' | 'outline' | 'ghost' = 'primary'
  private _shadow: ShadowRoot

  constructor() {
    super()
    this._shadow = this.attachShadow({ mode: 'open' })
  }

  get variant() { return this._variant }
  set variant(val: 'primary' | 'outline' | 'ghost') {
    this._variant = val
    this.render()
  }

  get disabled(): boolean { return this.hasAttribute('disabled') }
  set disabled(val: boolean) { this.toggleAttribute('disabled', val) }

  attributeChangedCallback(
    _name: string, _old: string | null, _new: string | null
  ) {
    if (_name === 'variant' && _new) {
      this._variant = _new as typeof this._variant
    }
    this.render()
  }

  connectedCallback() { this.render() }

  private render() {
    this._shadow.innerHTML = [
      '&lt;style&gt;',
      '  :host { display: inline-flex; }',
      '  button { padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 1rem; }',
      '  :host([variant="primary"]) button { background: #3b82f6; color: white; border: none; }',
      '  :host([variant="outline"]) button { background: transparent; border: 2px solid #3b82f6; color: #3b82f6; }',
      '  :host([variant="ghost"]) button { background: transparent; border: none; color: #3b82f6; }',
      '  :host([disabled]) button { opacity: 0.5; cursor: not-allowed; }',
      '&lt;/style&gt;',
      '&lt;button',
      '  part="button"',
      this.disabled ? ' disabled' : '',
      '&gt;',
      '&lt;slot&gt;&lt;/slot&gt;',
      '&lt;/button&gt;',
    ].join('')
  }
}
customElements.define('native-app-button', NativeAppButton)
</book-code-block>

<h3>Lit 實作</h3>

<book-code-block language="typescript" label="Lit 版本：AppButton（等效功能，更精簡）">
// Lit 版本：約 35 行（減少了約 55%）
import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('lit-app-button')
class LitAppButton extends LitElement {
  static override styles = css\`
    :host { display: inline-flex; }
    button { padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 1rem; }
    :host([variant="primary"]) button { background: #3b82f6; color: white; border: none; }
    :host([variant="outline"]) button { background: transparent; border: 2px solid #3b82f6; color: #3b82f6; }
    :host([variant="ghost"]) button { background: transparent; border: none; color: #3b82f6; }
    :host([disabled]) button { opacity: 0.5; cursor: not-allowed; }
  \`

  // @property 自動處理：attribute 同步、setter 觸發更新、reflect 雙向反射
  @property({ reflect: true }) variant: 'primary' | 'outline' | 'ghost' = 'primary'
  @property({ type: Boolean, reflect: true }) disabled = false

  override render() {
    return html\`
      &lt;button part="button" ?disabled=\${this.disabled}&gt;
        &lt;slot&gt;&lt;/slot&gt;
      &lt;/button&gt;
    \`
  }
}
</book-code-block>

<h3>差異分析</h3>

<table>
  <thead>
    <tr><th>面向</th><th>原生版本</th><th>Lit 版本</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>程式碼行數</td>
      <td>~80 行</td>
      <td>~35 行</td>
    </tr>
    <tr>
      <td>Attribute/Property 同步</td>
      <td>手動 getter/setter + attributeChangedCallback</td>
      <td><code>@property</code> 自動處理</td>
    </tr>
    <tr>
      <td>DOM 更新</td>
      <td>每次手動呼叫 render()，重建全部 innerHTML</td>
      <td>自動批次，只更新 binding 部分</td>
    </tr>
    <tr>
      <td>樣式共享</td>
      <td>每個實例有獨立 &lt;style&gt; 標籤</td>
      <td>Constructable Stylesheets 自動共享</td>
    </tr>
    <tr>
      <td>Bundle 大小</td>
      <td>0 bytes（純原生）</td>
      <td>~5KB gzip（Lit runtime）</td>
    </tr>
    <tr>
      <td>瀏覽器相容性</td>
      <td>完全原生</td>
      <td>同原生（Lit 不 polyfill 任何 API）</td>
    </tr>
  </tbody>
</table>

<h2 id="ch11-s05">Lit 值得引入的情境，以及不適合的情境</h2>

<p>Lit 帶來約 5KB 的 gzip 壓縮後的執行時成本。這個成本在不同情境下有截然不同的投資報酬率：</p>

<h3>適合引入 Lit 的情境</h3>

<table>
  <thead>
    <tr><th>情境</th><th>原因</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>元件庫（5 個以上元件）</td>
      <td>5KB 的 Lit runtime 由所有元件共享，邊際成本為 0</td>
    </tr>
    <tr>
      <td>有複雜動態模板的元件</td>
      <td>避免手動管理 innerHTML 的效能與安全問題</td>
    </tr>
    <tr>
      <td>需要 Reactive Properties 的元件</td>
      <td>@property / @state 大幅減少樣板程式碼</td>
    </tr>
    <tr>
      <td>需要 SSR 的專案</td>
      <td>@lit-labs/ssr 提供完整的伺服器端渲染支援</td>
    </tr>
    <tr>
      <td>大型跨框架設計系統</td>
      <td>完整生態系（Context、Task、Virtualizer 等）</td>
    </tr>
  </tbody>
</table>

<h3>不適合引入 Lit 的情境</h3>

<table>
  <thead>
    <tr><th>情境</th><th>更好的選擇</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>單一的、靜態的葉節點元件</td>
      <td>原生 Custom Element，5KB 開銷不合算</td>
    </tr>
    <tr>
      <td>嚴格零依賴的函式庫</td>
      <td>原生 Web Components</td>
    </tr>
    <tr>
      <td>Micro-frontend 邊界元件</td>
      <td>原生元件確保沒有版本衝突風險</td>
    </tr>
    <tr>
      <td>只需要 HTML 封裝，不需要行為</td>
      <td>純 HTML 自訂元素 + CSS Part</td>
    </tr>
  </tbody>
</table>

<book-callout variant="tip" title="最實際的決策依據">
  <p>決定是否用 Lit 的最簡單問題：「我的專案中有超過一個有狀態的元件嗎？」如果是，Lit runtime 的 5KB 成本會被多個元件分攤，而你節省的開發時間和避免的 bug 遠超過這個成本。</p>
</book-callout>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>Lit = 原生 Web Components + 自動批次更新 + 高效 Template 渲染 + Decorator 語法糖；它讓你用更少程式碼做到同樣的事，而底層的瀏覽器機制完全沒有改變。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch10">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">Web Components 的樣式架構設計</span>
    </a>
    <a class="footer-link" href="#ch12">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">Lit Decorators 與 Reactive Properties</span>
    </a>
  </div>
</div>
`
