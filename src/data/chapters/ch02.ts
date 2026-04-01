export const metadata = {
  id: 2,
  part: 1,
  title: 'Custom Elements — 定義你自己的 HTML 標籤',
  tags: ['實用技巧'] as string[],
  sections: [
    { slug: 'ch02-s01', title: 'customElements.define() 與 registry 的運作方式' },
    { slug: 'ch02-s02', title: 'Autonomous custom elements 與 Customized built-ins 的差異' },
    { slug: 'ch02-s03', title: 'Element 生命週期：constructor、connectedCallback、disconnectedCallback、adoptedCallback' },
    { slug: 'ch02-s04', title: 'Attributes 與 Properties 的差異 — 最常被誤解的核心概念' },
    { slug: 'ch02-s05', title: 'observedAttributes 與 attributeChangedCallback 的使用方式' },
    { slug: 'ch02-s06', title: 'Upgrade 時機點與 :defined CSS 偽類別' },
    { slug: 'ch02-s07', title: '常見錯誤：在 constructor 裡存取 DOM' },
    { slug: 'ch02-s08', title: 'TypeScript：替 Custom Element class 加上型別定義' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 02 · 第一部：基礎篇 — Web 平台的原生能力</div>
  <h1>Custom Elements — 定義你自己的 HTML 標籤</h1>
  <p>Custom Elements 是 Web Components 的核心入口。透過繼承 HTMLElement 並呼叫 customElements.define()，你能讓瀏覽器認識全新的 HTML 標籤，賦予它完整的生命週期、Attribute 監聽和 TypeScript 型別安全。本章深入每一個細節，特別是開發者最常犯錯的 Attribute vs Property 混淆問題。</p>
  <div class="chapter-tags"><span class="tag tag-tip">實用技巧</span></div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch02-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">customElements.define() 與 registry</span>
    </a>
    <a class="catalog-item" href="#ch02-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">Autonomous vs Customized Built-ins</span>
    </a>
    <a class="catalog-item" href="#ch02-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">Element 生命週期</span>
    </a>
    <a class="catalog-item" href="#ch02-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">Attributes 與 Properties 的差異</span>
    </a>
    <a class="catalog-item" href="#ch02-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">observedAttributes 與 attributeChangedCallback</span>
    </a>
    <a class="catalog-item" href="#ch02-s06">
      <span class="catalog-item-num">06</span>
      <span class="catalog-item-title">Upgrade 時機點與 :defined</span>
    </a>
    <a class="catalog-item" href="#ch02-s07">
      <span class="catalog-item-num">07</span>
      <span class="catalog-item-title">常見錯誤：在 constructor 裡存取 DOM</span>
    </a>
    <a class="catalog-item" href="#ch02-s08">
      <span class="catalog-item-num">08</span>
      <span class="catalog-item-title">TypeScript 型別定義</span>
    </a>
  </div>
</div>

<h2 id="ch02-s01">customElements.define() 與 registry 的運作方式</h2>

<p>每個瀏覽器頁面（Window）都有一個全域的 <code>CustomElementRegistry</code> 物件，透過 <code>window.customElements</code> 存取。這個 registry 維護了一張「自訂標籤名稱 → Class」的對應表。當瀏覽器解析 HTML 遇到未知標籤時，會查詢這張表，決定用哪個 class 實例化該元素。</p>

<p>自訂標籤名稱有一個強制規定：必須包含至少一個連字號（hyphen）。這個設計是為了避免與現有或未來的 HTML 標準標籤衝突——原生標籤（如 <code>&lt;div&gt;</code>、<code>&lt;article&gt;</code>）都不含連字號。因此 <code>my-button</code>、<code>ui-card</code>、<code>x-icon</code> 都是合法的名稱，而 <code>mybutton</code> 或 <code>button2</code> 則不合法。</p>

<book-code-block language="typescript" label="Registry 的完整 API">
// ── 基本定義 ──
class MyButton extends HTMLElement {
  connectedCallback() {
    this.textContent = 'Click me'
  }
}

// 第一個參數：標籤名稱（必須含連字號）
// 第二個參數：繼承 HTMLElement 的 class
customElements.define('my-button', MyButton)

// ── 查詢 Registry ──
// 根據標籤名稱查詢對應的 class
const ButtonClass = customElements.get('my-button')
console.log(ButtonClass === MyButton) // true

// 根據 class 查詢對應的標籤名稱（反向查詢）
const tagName = customElements.getName(MyButton)
console.log(tagName) // 'my-button'

// 檢查元素是否已定義（但更推薦用 whenDefined）
const isDefined = customElements.get('my-button') !== undefined
console.log(isDefined) // true

// ── 等待定義完成 ──
// whenDefined() 回傳 Promise，在元素被定義後 resolve
// 非常適合等待非同步載入的元件
async function waitForButton() {
  const ButtonCls = await customElements.whenDefined('my-button')
  const btn = document.querySelector('my-button')
  console.log(btn instanceof ButtonCls) // true
}

// ── 防止重複定義 ──
function safeDefine(name: string, ctor: CustomElementConstructor) {
  if (!customElements.get(name)) {
    customElements.define(name, ctor)
  } else {
    console.warn(\`Custom element "\${name}" is already defined.\`)
  }
}

safeDefine('my-button', MyButton) // 不會拋出錯誤

// ── Scoped Custom Element Registry（未來功能）──
// 目前仍在標準化中，允許為特定 Shadow Root 定義私有 registry
// const registry = new CustomElementRegistry()
// registry.define('my-button', MyButton)
// element.attachShadow({ mode: 'open', customElements: registry })
</book-code-block>

<h3>優點</h3>
<ul>
  <li>全域 registry 確保每個標籤名稱只有一個對應 class，避免版本衝突</li>
  <li><code>whenDefined()</code> 支援非同步元件載入，適合 code splitting 場景</li>
  <li>可以在任何時間點定義元素，瀏覽器會自動 upgrade 頁面上已存在的同名元素</li>
</ul>

<h3>缺點 / 注意事項</h3>
<ul>
  <li>一個標籤名稱只能被 define 一次，重複呼叫會拋出 <code>NotSupportedError</code></li>
  <li>Scoped Registry 目前尚未被所有瀏覽器支援，無法在同一頁面中對同一標籤名稱使用不同 class</li>
</ul>

<h2 id="ch02-s02">Autonomous custom elements 與 Customized built-ins 的差異</h2>

<p>Custom Elements 有兩種形式，代表兩種截然不同的使用策略。理解它們的差異，對於設計跨瀏覽器相容的元件至關重要。</p>

<p><strong>Autonomous Custom Elements（自主自訂元素）</strong>是繼承自 <code>HTMLElement</code> 的全新元素。它們的 HTML 標籤是一個全新的名稱，沒有任何內建的語意或行為。這是最常見也是最推薦的形式。</p>

<p><strong>Customized Built-in Elements（自訂內建元素）</strong>則是繼承自具體的 HTML 元素（如 <code>HTMLButtonElement</code>），並使用 <code>is</code> attribute 來啟用。這讓你能擴展原生元素的語意和無障礙行為，但代價是瀏覽器相容性問題。</p>

<book-code-block language="typescript" label="兩種 Custom Element 形式對比">
// ── Autonomous Custom Element ──
// 繼承 HTMLElement，定義全新標籤
class FancyButton extends HTMLElement {
  static get observedAttributes() { return ['disabled', 'variant'] }

  connectedCallback() {
    // 需要自己實作無障礙性（ARIA 等）
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'button')
    }
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0')
    }
    this.render()
  }

  private render() {
    const disabled = this.hasAttribute('disabled')
    const variant = this.getAttribute('variant') || 'primary'
    this.style.opacity = disabled ? '0.5' : '1'
    this.style.pointerEvents = disabled ? 'none' : 'auto'
    this.className = \`fancy-btn fancy-btn--\${variant}\`
  }
}

customElements.define('fancy-button', FancyButton)
// HTML: &lt;fancy-button variant="primary"&gt;Click&lt;/fancy-button&gt;

// ── Customized Built-in Element ──
// 繼承 HTMLButtonElement，保留原生 button 的語意
class FancyBuiltinButton extends HTMLButtonElement {
  connectedCallback() {
    // 繼承了 HTMLButtonElement 的全部行為：
    // - 原生 disabled 支援
    // - form 提交
    // - 鍵盤焦點
    // - ARIA role="button" 自動具備
    this.classList.add('fancy-btn')

    const variant = this.getAttribute('data-variant') || 'primary'
    this.classList.add(\`fancy-btn--\${variant}\`)
  }
}

// 第三個參數 extends 指定繼承的原生標籤
customElements.define('fancy-builtin-button', FancyBuiltinButton, { extends: 'button' })
// HTML: &lt;button is="fancy-builtin-button" data-variant="secondary"&gt;Click&lt;/button&gt;

// ── 型別聲明（需要兩種不同的型別）──
declare global {
  interface HTMLElementTagNameMap {
    'fancy-button': FancyButton
  }
  // Customized built-in 沒有對應的 HTMLElementTagNameMap key，
  // 因為它仍然使用原生標籤名稱
}
</book-code-block>

<div class="table-wrapper">
  <table>
    <thead>
      <tr>
        <th>比較項目</th>
        <th>Autonomous Custom Element</th>
        <th>Customized Built-in</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>繼承自</td>
        <td>HTMLElement</td>
        <td>具體元素（如 HTMLButtonElement）</td>
      </tr>
      <tr>
        <td>HTML 用法</td>
        <td>&lt;my-button&gt;</td>
        <td>&lt;button is="my-button"&gt;</td>
      </tr>
      <tr>
        <td>原生語意</td>
        <td>需自行添加 ARIA</td>
        <td>自動繼承</td>
      </tr>
      <tr>
        <td>Safari 支援</td>
        <td>✅ 完整支援</td>
        <td>❌ 不支援（需 Polyfill）</td>
      </tr>
      <tr>
        <td>推薦程度</td>
        <td>⭐⭐⭐⭐⭐ 優先使用</td>
        <td>⭐⭐ 謹慎使用</td>
      </tr>
    </tbody>
  </table>
</div>

<book-callout variant="warning" title="Safari 相容性警告">
  <p>Customized Built-ins 在 Safari 中完全不被支援（WebKit 團隊認為設計有問題，拒絕實作）。如果你的專案需要支援 Safari，請使用 Autonomous Custom Elements，並手動添加必要的 ARIA 屬性來確保無障礙性。</p>
</book-callout>

<h2 id="ch02-s03">Element 生命週期：constructor、connectedCallback、disconnectedCallback、adoptedCallback</h2>

<p>Custom Element 的生命週期是理解整個框架運作的基礎。每個回呼函式（callback）在特定時機被瀏覽器呼叫，正確使用它們能讓你的元件在各種場景下都能穩健運作。</p>

<h3>生命週期順序（文字示意圖）</h3>
<pre class="code-diagram">
建立元素
    │
    ▼
constructor()          ← 初始化 class 屬性、設定預設值
    │                    注意：此時不能存取子節點或 attributes！
    ▼
─── 元素插入 DOM ───
    │
    ▼
connectedCallback()    ← 每次插入 DOM 時觸發（可能多次）
    │                    在這裡讀取 attributes、建立 Shadow DOM、
    │                    加入 event listeners
    │
    ├── [元素被移動到其他 document] ──→ adoptedCallback()
    │
    ▼
─── 元素移出 DOM ───
    │
    ▼
disconnectedCallback() ← 每次從 DOM 移除時觸發
                         在這裡清理 event listeners、
                         取消 setInterval/setTimeout、
                         停止 IntersectionObserver 等

[attribute 改變] ──→ attributeChangedCallback(name, oldVal, newVal)
</pre>

<book-code-block language="typescript" label="完整生命週期 class 實作">
class LifecycleDemo extends HTMLElement {
  // 靜態屬性：宣告要監聽的 attributes
  static get observedAttributes(): string[] {
    return ['label', 'count', 'disabled']
  }

  // 私有屬性，僅用於 class 內部狀態
  private intervalId: number | null = null
  private _count = 0

  // ── constructor ──
  // 規則：只能在這裡設定 class 屬性初始值
  // 規則：可以 attachShadow()
  // 規則：不能讀取 attributes（尚未解析）
  // 規則：不能存取子節點
  constructor() {
    super() // 必須是第一行！
    console.log('constructor: 元素被建立')

    // ✅ 可以在這裡 attachShadow
    this.attachShadow({ mode: 'open' })

    // ✅ 可以設定 class 屬性
    this._count = 0
    this.intervalId = null

    // ❌ 不要在這裡讀取 attribute：
    // const label = this.getAttribute('label') // 可能是 null
  }

  // ── connectedCallback ──
  // 每次元素被插入任何 document 的 DOM 時觸發
  // 注意：可能被多次呼叫（元素被移動時）
  connectedCallback() {
    console.log('connectedCallback: 元素插入 DOM')

    // ✅ 現在可以安全讀取 attributes
    const label = this.getAttribute('label') || 'Default Label'
    this._count = parseInt(this.getAttribute('count') || '0', 10)

    // ✅ 建立初始 UI
    this.render()

    // ✅ 設定 timer，記得在 disconnectedCallback 清除
    this.intervalId = window.setInterval(() =&gt; {
      this._count++
      this.render()
    }, 1000)
  }

  // ── disconnectedCallback ──
  // 元素從 DOM 移除時觸發
  // 重要：清理所有副作用，避免記憶體洩漏
  disconnectedCallback() {
    console.log('disconnectedCallback: 元素從 DOM 移除')

    // ✅ 清除 timer
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    // ✅ 清除 event listeners（使用 AbortController 更方便）
    // ✅ 停止 fetch、WebSocket 連線等
  }

  // ── adoptedCallback ──
  // 元素被移動到另一個 document（iframe 等）時觸發
  // 在一般應用中很少用到
  adoptedCallback() {
    console.log('adoptedCallback: 元素被移動到另一個 document')
    this.render()
  }

  // ── attributeChangedCallback ──
  // 當 observedAttributes 中列出的 attribute 改變時觸發
  // 包括初始解析 HTML 時的設定
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    console.log(\`attributeChangedCallback: \${name} 從 "\${oldValue}" 改為 "\${newValue}"\`)

    switch (name) {
      case 'label':
        this.render()
        break
      case 'count':
        this._count = parseInt(newValue || '0', 10)
        this.render()
        break
      case 'disabled':
        this.render()
        break
    }
  }

  private render() {
    if (!this.shadowRoot) return
    const label = this.getAttribute('label') || 'Counter'
    const disabled = this.hasAttribute('disabled')

    this.shadowRoot.innerHTML = \`
      &lt;style&gt;
        :host { display: inline-block; font-family: sans-serif; }
        .wrapper { padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .label { color: #6b7280; font-size: 0.875em; }
        .count { font-size: 2em; font-weight: bold; color: \${disabled ? '#d1d5db' : '#4f46e5'}; }
      &lt;/style&gt;
      &lt;div class="wrapper"&gt;
        &lt;div class="label"&gt;\${label}&lt;/div&gt;
        &lt;div class="count"&gt;\${this._count}&lt;/div&gt;
      &lt;/div&gt;
    \`
  }
}

customElements.define('lifecycle-demo', LifecycleDemo)
</book-code-block>

<h2 id="ch02-s04">Attributes 與 Properties 的差異 — 最常被誤解的核心概念</h2>

<p>這是 Custom Elements 開發中最容易混淆的概念，也是面試中最常考的知識點。許多 bug 都源自於對 Attribute 和 Property 的誤解。</p>

<p><strong>Attribute（屬性）</strong>是 HTML 標記語言的概念，存在於 DOM 元素的 attributes 集合中，值永遠是字串（string），透過 <code>getAttribute()</code>/<code>setAttribute()</code> 讀寫。當你在 HTML 中寫 <code>&lt;my-input value="hello"&gt;</code>，<code>value="hello"</code> 就是一個 attribute。</p>

<p><strong>Property（屬性）</strong>是 JavaScript 物件的概念，存在於 JS 物件上，可以是任意型別（string、number、boolean、array、object 等），透過 <code>element.value</code> 直接讀寫。</p>

<book-code-block language="typescript" label="Attribute vs Property 完整對比">
class UserProfile extends HTMLElement {
  // ── Property：JS 世界的資料 ──
  // 可以是任意型別
  private _user: { name: string; age: number } | null = null
  private _tags: string[] = []
  private _active = false

  // ── Attribute Reflection Pattern ──
  // Property 的 getter/setter 同步反映到 Attribute

  // 字串型 property（簡單的 attribute reflection）
  get name(): string {
    return this.getAttribute('name') || ''
  }
  set name(value: string) {
    this.setAttribute('name', value)
    // setAttribute 會觸發 attributeChangedCallback
  }

  // 布林型 property（Boolean Attribute 慣例）
  // HTML 中 &lt;my-elem disabled&gt; 代表 true，沒有 disabled 代表 false
  get disabled(): boolean {
    return this.hasAttribute('disabled')
  }
  set disabled(value: boolean) {
    if (value) {
      this.setAttribute('disabled', '')  // Boolean attribute：有就是 true
    } else {
      this.removeAttribute('disabled')   // 移除代表 false
    }
  }

  // 數字型 property
  get count(): number {
    return parseInt(this.getAttribute('count') || '0', 10)
  }
  set count(value: number) {
    this.setAttribute('count', String(value))
  }

  // 物件/陣列型 property ── 不應對應到 attribute！
  // 原因：attribute 只能是字串，物件序列化為字串沒有意義
  get user(): { name: string; age: number } | null {
    return this._user
  }
  set user(value: { name: string; age: number } | null) {
    this._user = value
    this.render() // 直接觸發重渲染，不透過 attribute
  }

  get tags(): string[] {
    return this._tags
  }
  set tags(value: string[]) {
    this._tags = value
    this.render()
  }

  connectedCallback() {
    this.render()
  }

  private render() {
    this.textContent = \`
      Name: \${this.name},
      Active: \${this.disabled ? 'No' : 'Yes'},
      User: \${this._user ? JSON.stringify(this._user) : 'none'}
    \`
  }
}

customElements.define('user-profile', UserProfile)

// ── 使用示範 ──
const profile = document.querySelector('user-profile') as UserProfile

// 從 HTML attribute 設定（字串）
// &lt;user-profile name="Alice" count="5" disabled&gt;&lt;/user-profile&gt;

// 從 JavaScript property 設定（可以是物件）
profile.user = { name: 'Alice', age: 30 }   // ✅ 物件型，用 property
profile.tags = ['admin', 'editor']           // ✅ 陣列型，用 property
profile.name = 'Bob'                          // ✅ 字串型，反映到 attribute
profile.disabled = true                       // ✅ 布林型，反映到 attribute

// ── 常見錯誤 ──
// ❌ 不要用 setAttribute 傳遞物件
// profile.setAttribute('user', JSON.stringify({ name: 'Alice' }))
// 這樣在框架（React/Vue）中使用時會有問題，且型別不安全
</book-code-block>

<div class="table-wrapper">
  <table>
    <thead>
      <tr>
        <th>特性</th>
        <th>Attribute</th>
        <th>Property</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>存在位置</td>
        <td>HTML DOM attributes 集合</td>
        <td>JavaScript 物件</td>
      </tr>
      <tr>
        <td>型別</td>
        <td>永遠是 string（或 null）</td>
        <td>任意型別</td>
      </tr>
      <tr>
        <td>讀取方式</td>
        <td>getAttribute('name')</td>
        <td>element.name</td>
      </tr>
      <tr>
        <td>寫入方式</td>
        <td>setAttribute('name', '...')</td>
        <td>element.name = value</td>
      </tr>
      <tr>
        <td>HTML 模板中設定</td>
        <td>可以（&lt;elem attr="val"&gt;）</td>
        <td>需要 JS（elem.prop = val）</td>
      </tr>
      <tr>
        <td>適合傳遞的資料</td>
        <td>字串、數字、布林（簡單值）</td>
        <td>物件、陣列、函式</td>
      </tr>
    </tbody>
  </table>
</div>

<h2 id="ch02-s05">observedAttributes 與 attributeChangedCallback 的使用方式</h2>

<p>並非所有 attribute 的變化都會觸發 <code>attributeChangedCallback</code>——你必須透過靜態 getter <code>observedAttributes</code> 宣告你想監聽的 attribute 清單。這是一個效能設計：如果所有 attribute 改變都觸發回呼，會造成大量不必要的計算。</p>

<book-code-block language="typescript" label="observedAttributes 的正確使用模式">
class RangeSlider extends HTMLElement {
  // ── 宣告要監聽的 attributes ──
  // 必須是靜態 getter，回傳字串陣列
  static get observedAttributes(): string[] {
    return ['min', 'max', 'value', 'step', 'disabled']
  }

  // 私有的 backing store
  private _min = 0
  private _max = 100
  private _value = 50
  private _step = 1

  // ── attributeChangedCallback 的三個參數 ──
  // name: 改變的 attribute 名稱
  // oldValue: 改變前的值（初次設定時為 null）
  // newValue: 改變後的值（移除 attribute 時為 null）
  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    // 如果值沒有真正改變，不需要重渲染
    if (oldValue === newValue) return

    switch (name) {
      case 'min':
        this._min = parseFloat(newValue ?? '0')
        break
      case 'max':
        this._max = parseFloat(newValue ?? '100')
        break
      case 'value':
        this._value = parseFloat(newValue ?? '0')
        // 確保 value 在 min/max 範圍內
        this._value = Math.max(this._min, Math.min(this._max, this._value))
        break
      case 'step':
        this._step = parseFloat(newValue ?? '1')
        break
      case 'disabled':
        // 更新 ARIA 狀態
        this.setAttribute('aria-disabled', newValue !== null ? 'true' : 'false')
        break
    }

    // 注意：這裡的 this.shadowRoot 在 constructor 裡就應建立
    if (this.isConnected) {
      this.render()
    }
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' })
    }
    this.render()
  }

  private render() {
    if (!this.shadowRoot) return
    const disabled = this.hasAttribute('disabled')

    this.shadowRoot.innerHTML = \`
      &lt;style&gt;
        :host { display: block; }
        input[type="range"] { width: 100%; }
        input:disabled { opacity: 0.5; }
      &lt;/style&gt;
      &lt;input
        type="range"
        min="\${this._min}"
        max="\${this._max}"
        value="\${this._value}"
        step="\${this._step}"
        \${disabled ? 'disabled' : ''}
        aria-valuemin="\${this._min}"
        aria-valuemax="\${this._max}"
        aria-valuenow="\${this._value}"
      /&gt;
    \`

    // 重新加上 event listener（因為 innerHTML 重建了 DOM）
    const input = this.shadowRoot.querySelector('input')
    input?.addEventListener('input', (e) =&gt; {
      const target = e.target as HTMLInputElement
      this._value = parseFloat(target.value)
      // 更新 attribute 以保持同步（可選）
      this.setAttribute('value', String(this._value))
      // 發出自訂事件
      this.dispatchEvent(new CustomEvent('change', {
        detail: { value: this._value },
        bubbles: true,
        composed: true  // 讓事件穿越 Shadow Boundary
      }))
    })
  }
}

customElements.define('range-slider', RangeSlider)
</book-code-block>

<book-callout variant="warning" title="重要：attributeChangedCallback 的觸發時機">
  <p>在 HTML 解析時，<code>attributeChangedCallback</code> 會在 <code>constructor</code> 之後、<code>connectedCallback</code> 之前就被觸發——此時元素還沒有連接到 DOM。因此在 <code>attributeChangedCallback</code> 裡呼叫 <code>render()</code> 前，務必檢查 <code>this.isConnected</code> 或 <code>this.shadowRoot</code> 是否存在。</p>
</book-callout>

<h2 id="ch02-s06">Upgrade 時機點與 :defined CSS 偽類別</h2>

<p>「Upgrade」是 Custom Elements 一個重要的概念：當 HTML 被解析時，瀏覽器可能在對應的 JS class 尚未載入之前就建立了元素節點。這些節點以 <code>HTMLElement</code> 的形式存在，等到 <code>customElements.define()</code> 被呼叫後，它們才會被「升級（upgraded）」為對應的自訂 class 實例。</p>

<book-code-block language="typescript" label="Upgrade 的完整控制">
// ── 確認升級狀態 ──
const el = document.querySelector('my-widget')

// 升級前：instanceof HTMLElement，不是 MyWidget
// 升級後：instanceof MyWidget（也 instanceof HTMLElement）
function checkUpgrade() {
  // @ts-ignore
  const MyWidget = customElements.get('my-widget')
  if (MyWidget) {
    console.log(el instanceof MyWidget) // 升級後為 true
  }
}

// ── 強制升級特定元素 ──
// 如果你用 document.createElement 建立了元素，然後才呼叫 define，
// 你可以用 customElements.upgrade() 強制立即升級
const earlyElement = document.createElement('my-widget')
// earlyElement 目前還是 HTMLElement

// 假設稍後才定義：
class MyWidget extends HTMLElement {
  connectedCallback() { this.textContent = 'I am upgraded!' }
}
customElements.define('my-widget', MyWidget)

// 顯式升級（通常不需要，define 後會自動升級已在 DOM 中的元素）
customElements.upgrade(earlyElement)
console.log(earlyElement instanceof MyWidget) // true

// ── :defined 偽類別 CSS 實作 ──
// 在 CSS 中根據升級狀態改變樣式
// CSS 寫法（在 &lt;style&gt; 或 CSS 檔案中）：
//
// /* 未升級時的 fallback 樣式，避免 FOUC（Flash of Unstyled Content）*/
// my-widget:not(:defined) {
//   visibility: hidden;
//   min-height: 100px;
//   background: #f3f4f6;
//   border-radius: 8px;
//   animation: pulse 1.5s ease-in-out infinite;
// }
//
// /* 升級完成後的正式樣式 */
// my-widget:defined {
//   visibility: visible;
//   animation: none;
// }

// ── JavaScript 版本：等待升級 ──
async function initApp() {
  // 等待關鍵元件升級完成再執行初始化邏輯
  await customElements.whenDefined('my-widget')

  const widget = document.querySelector('my-widget') as MyWidget
  // 現在可以安全呼叫自訂方法
  widget.connectedCallback()
}
</book-code-block>

<h2 id="ch02-s07">常見錯誤：在 constructor 裡存取 DOM</h2>

<p>這是 Custom Elements 開發中最常見的錯誤之一。瀏覽器規範明確指出：<strong>在 <code>constructor</code> 中不能讀取或修改元素的子節點（children）和大部分 attributes</strong>。違反這個規則會在某些情況下觸發 <code>DOMException</code>，或導致難以追蹤的 bug。</p>

<book-code-block language="typescript" label="Constructor 的正確與錯誤用法">
class ProblematicElement extends HTMLElement {
  constructor() {
    super()

    // ❌ 錯誤 1：讀取 attribute
    // 在 parser 解析時，attribute 尚未被設定到元素上
    const label = this.getAttribute('label') // 可能回傳 null，即使 HTML 有設定

    // ❌ 錯誤 2：存取子節點
    // constructor 被呼叫時，子節點尚未解析完成
    const children = this.children // length 可能為 0
    const firstChild = this.querySelector('span') // null

    // ❌ 錯誤 3：使用 innerHTML 直接操作 Light DOM
    this.innerHTML = '&lt;span&gt;hello&lt;/span&gt;' // 會拋出 DOMException

    // ❌ 錯誤 4：appendChild 到 this
    const span = document.createElement('span')
    this.appendChild(span) // 某些情況下會失敗
  }
}

// ── 正確做法 ──
class CorrectElement extends HTMLElement {
  private shadow: ShadowRoot
  private initialized = false

  constructor() {
    super()

    // ✅ 可以 attachShadow
    this.shadow = this.attachShadow({ mode: 'open' })

    // ✅ 可以在 Shadow Root 中建立初始 DOM 結構
    // （但不要去讀 attributes 來決定內容）
    const template = document.createElement('div')
    template.className = 'wrapper'
    this.shadow.appendChild(template)

    // ✅ 可以設定 class 屬性的預設值
    this.initialized = false
  }

  connectedCallback() {
    // ✅ 在這裡讀取 attributes，絕對安全
    const label = this.getAttribute('label') || 'Default'

    // ✅ 在這裡存取子節點
    const slottedChildren = this.children

    // ✅ 在這裡設定 innerHTML（Shadow Root）
    this.shadow.innerHTML = \`
      &lt;style&gt;:host { display: block; }&lt;/style&gt;
      &lt;div class="label"&gt;\${label}&lt;/div&gt;
      &lt;slot&gt;&lt;/slot&gt;
    \`

    this.initialized = true
  }
}

customElements.define('correct-element', CorrectElement)
</book-code-block>

<book-callout variant="tip" title="記憶口訣">
  <p><strong>constructor 只做三件事：</strong>呼叫 super()、附加 Shadow Root（attachShadow）、設定 class 屬性初始值。所有需要讀取 DOM、attributes 或子節點的邏輯，都放到 connectedCallback 裡。</p>
</book-callout>

<h2 id="ch02-s08">TypeScript：替 Custom Element class 加上型別定義</h2>

<p>TypeScript 對 Custom Elements 的支援需要一點額外配置。透過 <code>HTMLElementTagNameMap</code> 的 Declaration Merging，你可以讓 <code>querySelector('my-button')</code> 回傳正確的型別，而不是泛用的 <code>Element</code>。</p>

<book-code-block language="typescript" label="完整的 TypeScript Custom Element 型別定義">
// ── 完整的 TypeScript Custom Element 範例 ──

interface DialogOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}

class MyDialog extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['open', 'title', 'size']
  }

  private shadow: ShadowRoot
  private _options: DialogOptions = { title: '', message: '' }
  private _onConfirm: (() =&gt; void) | null = null
  private _onCancel: (() =&gt; void) | null = null

  // ── Public API（有完整型別）──
  get isOpen(): boolean {
    return this.hasAttribute('open')
  }

  get title(): string {
    return this.getAttribute('title') || ''
  }
  set title(value: string) {
    this.setAttribute('title', value)
  }

  get size(): 'small' | 'medium' | 'large' {
    const val = this.getAttribute('size')
    if (val === 'small' || val === 'large') return val
    return 'medium'
  }
  set size(value: 'small' | 'medium' | 'large') {
    this.setAttribute('size', value)
  }

  // ── 方法 API ──
  show(options?: Partial&lt;DialogOptions&gt;): Promise&lt;boolean&gt; {
    if (options) {
      this._options = { ...this._options, ...options }
    }
    this.setAttribute('open', '')
    this.render()

    // 回傳 Promise，在使用者確認或取消時 resolve
    return new Promise((resolve) =&gt; {
      this._onConfirm = () =&gt; resolve(true)
      this._onCancel = () =&gt; resolve(false)
    })
  }

  hide(): void {
    this.removeAttribute('open')
  }

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  attributeChangedCallback(name: string, _old: string | null, _new: string | null): void {
    if (this.isConnected) this.render()
  }

  connectedCallback(): void {
    this.render()
  }

  private render(): void {
    const { title, message, confirmText = '確認', cancelText = '取消' } = this._options
    const isOpen = this.isOpen

    this.shadow.innerHTML = \`
      &lt;style&gt;
        :host { display: \${isOpen ? 'flex' : 'none'}; position: fixed; inset: 0;
                background: rgba(0,0,0,.5); align-items: center; justify-content: center; z-index: 1000; }
        .dialog { background: white; border-radius: 12px; padding: 24px; min-width: 320px; }
        .title { font-size: 1.25em; font-weight: bold; margin-bottom: 12px; }
        .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
        button { padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; }
        .confirm { background: #4f46e5; color: white; }
        .cancel { background: #e5e7eb; }
      &lt;/style&gt;
      &lt;div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"&gt;
        &lt;div class="title" id="dialog-title"&gt;\${title}&lt;/div&gt;
        &lt;div class="message"&gt;\${message}&lt;/div&gt;
        &lt;div class="actions"&gt;
          &lt;button class="cancel" data-action="cancel"&gt;\${cancelText}&lt;/button&gt;
          &lt;button class="confirm" data-action="confirm"&gt;\${confirmText}&lt;/button&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    \`

    this.shadow.querySelector('.confirm')?.addEventListener('click', () =&gt; {
      this._onConfirm?.()
      this.hide()
    })
    this.shadow.querySelector('.cancel')?.addEventListener('click', () =&gt; {
      this._onCancel?.()
      this.hide()
    })
  }
}

customElements.define('my-dialog', MyDialog)

// ── 全域型別聲明 ──
// 這讓 document.querySelector('my-dialog') 回傳 MyDialog 型別
declare global {
  interface HTMLElementTagNameMap {
    'my-dialog': MyDialog
  }
}

// ── 使用時有完整型別支援 ──
async function deleteUser() {
  const dialog = document.querySelector('my-dialog')! // 型別：MyDialog
  const confirmed = await dialog.show({
    title: '確認刪除',
    message: '此操作無法復原，確定要刪除此使用者嗎？',
    confirmText: '刪除',
    cancelText: '取消',
  })

  if (confirmed) {
    console.log('User deleted')
  }
}
</book-code-block>

<book-callout variant="tip" title="最佳實踐：TypeScript 型別設計原則">
  <p>為你的 Custom Element 設計 TypeScript API 時，遵循「Public API 最小化」原則：只暴露真正需要從外部存取的 property 和方法，其他的用 <code>private</code> 隱藏。Attribute 用字串，複雜資料用 Property（物件、陣列），非同步操作用回傳 Promise 的方法。</p>
</book-callout>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>Custom Elements 是你自己定義的 HTML 標籤，記住三個關鍵：constructor 不碰 DOM、connectedCallback 是真正的初始化入口、Attribute 是字串而 Property 可以是任意型別。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch01">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">為什麼選 Web Components？</span>
    </a>
    <a class="footer-link" href="#ch03">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">Shadow DOM — 真正的樣式與結構封裝</span>
    </a>
  </div>
</div>
`
