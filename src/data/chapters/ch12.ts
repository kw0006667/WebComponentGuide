export const metadata = {
  id: 12,
  part: 3,
  title: 'Lit Decorators 與 Reactive Properties',
  tags: ['Lit', '面試重點'] as string[],
  sections: [
    { slug: 'ch12-s01', title: '@customElement、@property、@state — 各自產生了什麼程式碼' },
    { slug: 'ch12-s02', title: '@property 選項：type、reflect、attribute、converter 詳解' },
    { slug: 'ch12-s03', title: '@query、@queryAll、@queryAssignedElements 的使用情境' },
    { slug: 'ch12-s04', title: '生命週期 Hook：willUpdate、update、updated、firstUpdated' },
    { slug: 'ch12-s05', title: '常見錯誤：直接修改陣列或物件卻沒有觸發更新' },
    { slug: 'ch12-s06', title: 'TypeScript Strict Mode 與 Decorators 的相容性處理' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 12 · 第三部：Lit Framework — 更精簡、更慣用的寫法</div>
  <h1>Lit Decorators 與 Reactive Properties</h1>
  <p>Lit 的 Decorator 是其最具表達力的特性之一。一個 <code>@property</code> 取代了原生版本的 observedAttributes、attributeChangedCallback、getter 和 setter，大幅降低了樣板程式碼。本章深入拆解每個 Decorator 的實際作用，讓你掌握它們的能力邊界。</p>
  <div class="chapter-tags">
    <span class="tag tag-lit">Lit</span>
    <span class="tag tag-interview">面試重點</span>
  </div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch12-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">@customElement、@property、@state — 各自產生了什麼程式碼</span>
    </a>
    <a class="catalog-item" href="#ch12-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">@property 選項：type、reflect、attribute、converter 詳解</span>
    </a>
    <a class="catalog-item" href="#ch12-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">@query、@queryAll、@queryAssignedElements 的使用情境</span>
    </a>
    <a class="catalog-item" href="#ch12-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">生命週期 Hook：willUpdate、update、updated、firstUpdated</span>
    </a>
    <a class="catalog-item" href="#ch12-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">常見錯誤：直接修改陣列或物件卻沒有觸發更新</span>
    </a>
    <a class="catalog-item" href="#ch12-s06">
      <span class="catalog-item-num">06</span>
      <span class="catalog-item-title">TypeScript Strict Mode 與 Decorators 的相容性處理</span>
    </a>
  </div>
</div>

<h2 id="ch12-s01">@customElement、@property、@state — 各自產生了什麼程式碼</h2>

<p>理解 Decorator 背後生成了什麼程式碼，是避免誤用的最好方法。以下展示每個常用 Decorator 的「去糖化」（desugared）版本。</p>

<h3>@customElement 的展開</h3>

<book-code-block language="typescript" label="@customElement 展開對照">
// ── 使用 Decorator ──────────────────────────────────────────
import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('my-element')
class MyElement extends LitElement {
  override render() { return html\`&lt;p&gt;Hello&lt;/p&gt;\` }
}

// ── 等效的展開版本 ───────────────────────────────────────────
class MyElementExpanded extends LitElement {
  override render() { return html\`&lt;p&gt;Hello&lt;/p&gt;\` }
}
customElements.define('my-element', MyElementExpanded)
// @customElement 僅僅是 customElements.define() 的語法糖
</book-code-block>

<h3>@property 的展開</h3>

<book-code-block language="typescript" label="@property 展開對照">
// ── 使用 Decorator ──────────────────────────────────────────
import { LitElement } from 'lit'
import { property } from 'lit/decorators.js'

class WithProperty extends LitElement {
  @property({ type: Number, reflect: true }) count = 0
}

// ── 等效的展開版本（簡化）───────────────────────────────────
class WithPropertyExpanded extends LitElement {
  // 1. 加入 static properties 宣告，告訴 Lit 這是 reactive property
  static override properties = {
    count: { type: Number, reflect: true },
  }

  // 2. 在 static properties 中的宣告會讓 Lit 自動：
  //    a. 將 'count' attribute 加入 observedAttributes
  //    b. 在 attribute 變更時呼叫 fromAttribute(val, Number) 轉換
  //    c. 在 property 變更時用 reflect:true 將值寫回 attribute
  //    d. 呼叫 requestUpdate() 觸發重新渲染

  // 3. Lit 在 LitElement 基礎類別中使用 Proxy 或 accessor 實現響應式
  declare count: number
}
</book-code-block>

<h3>@state 與 @property 的差異</h3>

<book-code-block language="typescript" label="@state 對照 @property">
import { LitElement, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

@customElement('state-vs-property')
class StateVsProperty extends LitElement {
  // @property：
  // - 對外公開為 HTML attribute（小寫）
  // - 外部可透過 el.value = 'x' 設定
  // - 若加 reflect: true，也會同步到 attribute
  @property({ type: String }) value = ''

  // @state：
  // - 等同於 @property({ state: true })
  // - 不建立 attribute，純 JavaScript property
  // - 不對外暴露，不出現在 HTML 中
  // - 變更同樣觸發重新渲染
  @state() private _internalCount = 0
  @state() private _isExpanded = false

  override render() {
    return html\`
      &lt;div&gt;
        &lt;input .value=\${this.value} /&gt;
        &lt;span&gt;\${this._internalCount}&lt;/span&gt;
      &lt;/div&gt;
    \`
  }
}
</book-code-block>

<h2 id="ch12-s02">@property 選項：type、reflect、attribute、converter 詳解</h2>

<p><code>@property</code> 的選項物件控制了 Attribute ↔ Property 的轉換行為。</p>

<table>
  <thead>
    <tr><th>選項</th><th>預設值</th><th>說明</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><code>type</code></td>
      <td><code>String</code></td>
      <td>Attribute 到 Property 的轉換型別（String、Number、Boolean、Array、Object）</td>
    </tr>
    <tr>
      <td><code>reflect</code></td>
      <td><code>false</code></td>
      <td>Property 變更時是否同步回 attribute（讓 CSS 選擇器可以用）</td>
    </tr>
    <tr>
      <td><code>attribute</code></td>
      <td>屬性名稱的 kebab-case</td>
      <td>自訂 HTML attribute 名稱，例如 <code>attribute: 'data-id'</code></td>
    </tr>
    <tr>
      <td><code>converter</code></td>
      <td>內建型別轉換器</td>
      <td>完全自訂 fromAttribute 和 toAttribute 的轉換邏輯</td>
    </tr>
    <tr>
      <td><code>hasChanged</code></td>
      <td>嚴格不等於（!==）</td>
      <td>自訂判斷「值是否變更」的函式，用於複雜物件的比較</td>
    </tr>
  </tbody>
</table>

<book-code-block language="typescript" label="@property 各選項的實際使用">
import { LitElement, html, PropertyValues } from 'lit'
import { customElement, property } from 'lit/decorators.js'

// 自訂 Converter：處理日期 attribute
const dateConverter = {
  fromAttribute(value: string | null): Date | null {
    if (!value) return null
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  },
  toAttribute(value: Date | null): string | null {
    return value ? value.toISOString().split('T')[0] : null
  },
}

@customElement('event-card')
class EventCard extends LitElement {
  // type: Number — attribute "max-items" 自動轉換為數字
  @property({ type: Number, attribute: 'max-items' }) maxItems = 10

  // reflect: true — 讓 CSS :host([loading]) 選擇器可用
  @property({ type: Boolean, reflect: true }) loading = false

  // converter — 完全自訂的 attribute ↔ property 轉換
  @property({ converter: dateConverter, reflect: true })
  eventDate: Date | null = null

  // hasChanged — 物件比較：只有 id 不同才視為變更
  @property({
    hasChanged(newVal: { id: string }, oldVal: { id: string }) {
      return newVal?.id !== oldVal?.id
    },
  })
  selectedItem: { id: string; name: string } | null = null

  override render() {
    return html\`
      &lt;div ?hidden=\${this.loading}&gt;
        &lt;p&gt;Event date: \${this.eventDate?.toLocaleDateString() ?? 'N/A'}&lt;/p&gt;
        &lt;p&gt;Max: \${this.maxItems}&lt;/p&gt;
      &lt;/div&gt;
    \`
  }
}
</book-code-block>

<h2 id="ch12-s03">@query、@queryAll、@queryAssignedElements 的使用情境</h2>

<p>這三個 Decorator 簡化了 Shadow DOM 內元素的存取，本質上是 <code>shadowRoot.querySelector</code> 的語法糖。</p>

<book-code-block language="typescript" label="query Decorators 完整範例">
import { LitElement, html, css } from 'lit'
import { customElement, query, queryAll, queryAssignedElements } from 'lit/decorators.js'

@customElement('form-component')
class FormComponent extends LitElement {
  static override styles = css\`
    :host { display: block; }
    input { display: block; margin-bottom: 8px; }
  \`

  // @query：等同於 this.shadowRoot.querySelector('input')
  // cache: true 表示只查詢一次並快取（元素不會動態新增/移除時使用）
  @query('input[name="email"]', true)
  private emailInput!: HTMLInputElement

  // @queryAll：等同於 this.shadowRoot.querySelectorAll('.field')
  // 回傳 NodeList，可以用 for...of 迭代
  @queryAll('.field')
  private allFields!: NodeListOf&lt;HTMLInputElement&gt;

  // @queryAssignedElements：取得投影到指定 slot 的元素
  // slot: 'actions' 表示具名 slot，flatten: true 包含巢狀 slot 的內容
  @queryAssignedElements({ slot: 'actions', flatten: true })
  private actionButtons!: Array&lt;HTMLElement&gt;

  // @queryAssignedElements 不帶參數：取得預設 slot 的元素
  @queryAssignedElements()
  private defaultSlotElements!: Array&lt;HTMLElement&gt;

  override firstUpdated() {
    // 在首次渲染後可以安全地存取 @query 的元素
    this.emailInput.focus()

    console.log('所有輸入欄位：', this.allFields)
    console.log('Action 按鈕：', this.actionButtons)
  }

  private validate(): boolean {
    let isValid = true
    for (const field of this.allFields) {
      if (!field.value) {
        field.setCustomValidity('此欄位為必填')
        isValid = false
      } else {
        field.setCustomValidity('')
      }
    }
    return isValid
  }

  override render() {
    return html\`
      &lt;form @submit=\${this.handleSubmit}&gt;
        &lt;input class="field" name="email" type="email" placeholder="Email" /&gt;
        &lt;input class="field" name="name" type="text" placeholder="姓名" /&gt;
        &lt;div&gt;
          &lt;slot name="actions"&gt;
            &lt;button type="submit"&gt;送出&lt;/button&gt;
          &lt;/slot&gt;
        &lt;/div&gt;
        &lt;slot&gt;&lt;/slot&gt;
      &lt;/form&gt;
    \`
  }

  private handleSubmit = (e: Event) => {
    e.preventDefault()
    if (this.validate()) {
      this.dispatchEvent(new CustomEvent('form-submit', {
        detail: { email: this.emailInput.value },
        bubbles: true, composed: true,
      }))
    }
  }
}
</book-code-block>

<book-callout variant="warning" title="@query 的 cache 選項陷阱">
  <p>當 <code>cache: true</code> 時，Decorator 只查詢 DOM 一次並存儲結果。如果元素可能在後續渲染中被動態新增或移除（例如 <code>?hidden</code> 指令或條件渲染切換 DOM），就不應該使用 cache，否則會存取到 <code>null</code> 或已移除的元素。</p>
</book-callout>

<h2 id="ch12-s04">生命週期 Hook：willUpdate、update、updated、firstUpdated</h2>

<p>Lit 的生命週期 Hook 各有明確的適用情境，選錯 Hook 可能導致無限更新迴圈或錯誤的時序問題。</p>

<table>
  <thead>
    <tr>
      <th>Hook</th>
      <th>執行時機</th>
      <th>可修改 reactive property？</th>
      <th>適用情境</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>willUpdate()</code></td>
      <td>render() 之前，同步</td>
      <td>是（不會觸發額外更新）</td>
      <td>衍生計算值、預處理資料</td>
    </tr>
    <tr>
      <td><code>update()</code></td>
      <td>render() 執行時，同步</td>
      <td>不建議</td>
      <td>覆寫時需呼叫 super.update()</td>
    </tr>
    <tr>
      <td><code>firstUpdated()</code></td>
      <td>首次渲染到 DOM 後</td>
      <td>是（觸發額外更新）</td>
      <td>初始化 DOM、第三方函式庫</td>
    </tr>
    <tr>
      <td><code>updated()</code></td>
      <td>每次渲染到 DOM 後</td>
      <td>謹慎使用（可能無限循環）</td>
      <td>根據 DOM 狀態觸發副作用</td>
    </tr>
  </tbody>
</table>

<book-code-block language="typescript" label="生命週期 Hook 正確使用模式">
import { LitElement, html, PropertyValues } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

@customElement('lifecycle-demo')
class LifecycleDemo extends LitElement {
  @property({ type: Array }) items: string[] = []
  @property({ type: String }) filter = ''

  // 衍生狀態：不需要作為 @state，因為它是純計算值
  private _filteredItems: string[] = []
  private _itemCount = 0

  // willUpdate：在每次渲染前計算衍生值
  // 在這裡修改 this 的屬性不會觸發額外的更新週期
  override willUpdate(changed: PropertyValues&lt;this&gt;) {
    if (changed.has('items') || changed.has('filter')) {
      this._filteredItems = this.items.filter(item =>
        item.toLowerCase().includes(this.filter.toLowerCase())
      )
      this._itemCount = this._filteredItems.length
    }
  }

  override render() {
    return html\`
      &lt;p&gt;顯示 \${this._itemCount} 個結果&lt;/p&gt;
      &lt;ul&gt;
        \${this._filteredItems.map(item => html\`&lt;li&gt;\${item}&lt;/li&gt;\`)}
      &lt;/ul&gt;
    \`
  }

  // firstUpdated：只執行一次，適合初始化邏輯
  override firstUpdated() {
    // 安全地存取 Shadow DOM 元素
    const list = this.shadowRoot!.querySelector('ul')
    list?.setAttribute('role', 'listbox')
  }

  // updated：每次更新後執行，謹慎使用以避免無限迴圈
  override updated(changed: PropertyValues&lt;this&gt;) {
    // 正確做法：只在特定 property 變更時執行，且不修改會觸發更新的 property
    if (changed.has('items') &amp;&amp; this.items.length &gt; 0) {
      // 滾動到列表頂部（DOM 副作用，不是狀態更新）
      this.shadowRoot?.querySelector('ul')?.scrollTo({ top: 0 })
    }

    // 危險做法（會導致無限迴圈）：
    // this.someProperty = newValue  // 如果沒有 guard 條件，這會觸發新一輪的 updated
  }
}
</book-code-block>

<h2 id="ch12-s05">常見錯誤：直接修改陣列或物件卻沒有觸發更新</h2>

<p>這是 Lit（以及所有基於值比較的響應式系統）最常見的 bug 來源。Lit 使用 <code>!==</code> 來判斷 property 是否變更，直接修改陣列或物件不會改變其引用（reference），因此 Lit 不會偵測到變更。</p>

<book-code-block language="typescript" label="陣列與物件的正確更新模式">
import { LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'

@customElement('mutation-demo')
class MutationDemo extends LitElement {
  @state() private items: string[] = ['Apple', 'Banana']
  @state() private user = { name: 'Alice', age: 30 }

  // ❌ 錯誤：直接 push 不會觸發更新
  private wrongAddItem(item: string) {
    this.items.push(item)  // items 的引用沒有改變，Lit 認為 items === items，不更新
  }

  // ✅ 正確：建立新陣列
  private correctAddItem(item: string) {
    this.items = [...this.items, item]  // 新的陣列引用，觸發更新
  }

  // ❌ 錯誤：直接修改物件屬性
  private wrongUpdateName(name: string) {
    this.user.name = name  // user 引用未變，不更新
  }

  // ✅ 正確：建立新物件（Spread 運算符）
  private correctUpdateName(name: string) {
    this.user = { ...this.user, name }  // 新的物件引用，觸發更新
  }

  // ✅ 也可以呼叫 this.requestUpdate() 強制觸發（但較不優雅）
  private forceUpdate(item: string) {
    this.items.push(item)
    this.requestUpdate('items')  // 手動告訴 Lit 'items' 已變更
  }

  // ✅ 進階：自訂 hasChanged 讓深度比較成為可能
  // （在 @property/​@state 的選項中設定 hasChanged）

  override render() {
    return html\`
      &lt;ul&gt;\${this.items.map(i => html\`&lt;li&gt;\${i}&lt;/li&gt;\`)}&lt;/ul&gt;
      &lt;button @click=\${() => this.correctAddItem('Cherry')}&gt;新增&lt;/button&gt;
      &lt;p&gt;\${this.user.name}, \${this.user.age}&lt;/p&gt;
      &lt;button @click=\${() => this.correctUpdateName('Bob')}&gt;改名&lt;/button&gt;
    \`
  }
}
</book-code-block>

<book-callout variant="warning" title="Immer.js 與 Lit 的搭配">
  <p>如果你的狀態非常深層且頻繁修改，可以搭配 Immer.js 的 <code>produce()</code> 函式：它讓你用「可變」的語法寫不可變的更新，並自動回傳新的引用。例如 <code>this.items = produce(this.items, draft => { draft.push(item) })</code>。</p>
</book-callout>

<h2 id="ch12-s06">TypeScript Strict Mode 與 Decorators 的相容性處理</h2>

<p>Lit 支援兩種 Decorator 規格：TC39 Stage 3 Decorators（新版，TypeScript 5.0+ 預設支援）和 Legacy Decorators（舊版，需要 <code>experimentalDecorators: true</code>）。兩者的語法相同，但底層行為和 tsconfig 設定不同。</p>

<book-code-block language="json" label="tsconfig.json — 兩種 Decorator 模式的設定">
// ── 方案 A：TC39 Stage 3 Decorators（推薦，TypeScript 5.0+）
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "useDefineForClassFields": true,
    "experimentalDecorators": false  // 預設就是 false，不需要設定
    // 不需要 emitDecoratorMetadata
  }
}

// ── 方案 B：Legacy Decorators（TypeScript 4.x 或 Lit 3.x 之前）
{
  "compilerOptions": {
    "target": "ES2021",
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "strict": true,
    "experimentalDecorators": true,   // 必須開啟
    "useDefineForClassFields": false   // Legacy decorators 需要設為 false！
    // 注意：useDefineForClassFields: false 會改變 class fields 的語義
  }
}
</book-code-block>

<book-code-block language="typescript" label="Strict Mode 下的 @property 型別宣告問題與解法">
import { LitElement, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

// 問題：strict mode 下，TypeScript 要求 class fields 必須初始化
// 但我們不一定想給初始值（例如從外部傳入的必要 property）

@customElement('strict-element')
class StrictElement extends LitElement {
  // ❌ strict mode 下會報錯：Property 'userId' has no initializer
  // @property() userId: string

  // ✅ 解法 1：給初始值
  @property() userId: string = ''

  // ✅ 解法 2：使用 ! 斷言（告訴 TS 我保證它會被設定）
  @property() requiredProp!: string

  // ✅ 解法 3：允許 undefined（最型別安全的做法）
  @property() optionalProp: string | undefined

  // @state 同理
  @state() private _data: Record&lt;string, unknown&gt; | null = null

  override render() {
    if (!this.userId) {
      return html\`&lt;p&gt;請提供 user-id attribute&lt;/p&gt;\`
    }
    return html\`&lt;p&gt;User: \${this.userId}&lt;/p&gt;\`
  }
}

// TypeScript 宣告擴充：讓 HTML 中使用時有型別提示
declare global {
  interface HTMLElementTagNameMap {
    'strict-element': StrictElement
  }
}
</book-code-block>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>Lit Decorator 是程式碼產生器，<code>@property</code> 為你建立完整的 attribute/property 同步機制，<code>@state</code> 管理私有響應式狀態，而直接修改陣列或物件不會觸發更新——永遠要建立新的引用。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch11">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">用一章理解 Lit — 核心思維模型</span>
    </a>
    <a class="footer-link" href="#ch13">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">Lit Directives — 擴展 Template 引擎</span>
    </a>
  </div>
</div>
`
