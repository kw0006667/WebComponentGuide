export const metadata = {
  id: 6,
  part: 2,
  title: 'Custom Elements 的完整型別設計',
  tags: ['實用技巧'] as string[],
  sections: [
    { slug: 'ch06-s01', title: '用 TypeScript class 繼承 HTMLElement' },
    { slug: 'ch06-s02', title: '在 HTMLElementTagNameMap 中宣告自訂元素' },
    { slug: 'ch06-s03', title: '用 Getter / Setter 實作 Attribute Reflection 模式' },
    { slug: 'ch06-s04', title: '用 CustomEvent<T> 設計強型別的自訂事件' },
    { slug: 'ch06-s05', title: '用 Declaration Merging 擴充全域 HTMLElement 型別' },
    { slug: 'ch06-s06', title: '在 Shadow Root 內進行型別安全的元素查詢' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 06 · 第二部：TypeScript 優先的 Web Components 開發</div>
  <h1>Custom Elements 的完整型別設計</h1>
  <p>進入第二部，我們聚焦於 TypeScript 如何讓 Web Components 開發更安全、更易維護。從 HTMLElementTagNameMap 的 Declaration Merging，到強型別的 CustomEvent，再到 Shadow Root 內的型別安全查詢——本章建立完整的 TypeScript 型別系統，讓你的元件 API 對使用者和 IDE 都清晰可見。</p>
  <div class="chapter-tags"><span class="tag tag-tip">實用技巧</span></div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch06-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">TypeScript class 繼承 HTMLElement</span>
    </a>
    <a class="catalog-item" href="#ch06-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">HTMLElementTagNameMap 宣告</span>
    </a>
    <a class="catalog-item" href="#ch06-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">Getter / Setter Attribute Reflection</span>
    </a>
    <a class="catalog-item" href="#ch06-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">CustomEvent&lt;T&gt; 強型別自訂事件</span>
    </a>
    <a class="catalog-item" href="#ch06-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">Declaration Merging 擴充全域型別</span>
    </a>
    <a class="catalog-item" href="#ch06-s06">
      <span class="catalog-item-num">06</span>
      <span class="catalog-item-title">Shadow Root 型別安全查詢</span>
    </a>
  </div>
</div>

<h2 id="ch06-s01">用 TypeScript class 繼承 HTMLElement</h2>

<p>TypeScript 的 Custom Element class 繼承 <code>HTMLElement</code> 時，有幾個型別設計上的重要考量。TypeScript 的 DOM 型別庫（<code>lib.dom.d.ts</code>）已經包含了完整的 <code>HTMLElement</code> 介面，但為了讓你的元件獲得最佳的型別支援，還需要一些額外的宣告技巧。</p>

<book-code-block language="typescript" label="完整的 TypeScript Custom Element 型別架構">
// ── 1. 定義元件的公開介面（Interface Segregation）──
// 把公開 API 分離成介面，方便測試和文件生成
interface SearchBoxInterface {
  // Properties
  readonly value: string
  placeholder: string
  disabled: boolean
  minLength: number

  // Methods
  clear(): void
  focus(options?: FocusOptions): void

  // Events（文件化，但 TS 無法直接型別化）
  // 'search' event: CustomEvent&lt;{ query: string }&gt;
  // 'clear' event: CustomEvent&lt;void&gt;
}

// ── 2. 定義事件的 payload 型別 ──
interface SearchBoxEventMap {
  'search': CustomEvent&lt;{ query: string; timestamp: number }&gt;
  'clear': CustomEvent&lt;void&gt;
  'suggestion-select': CustomEvent&lt;{ value: string; index: number }&gt;
}

// ── 3. 完整的元件 class 實作 ──
class SearchBox extends HTMLElement implements SearchBoxInterface {
  // ── 靜態型別 ──
  static readonly tagName = 'search-box' as const

  static get observedAttributes(): Array&lt;keyof SearchBoxAttributes&gt; {
    return ['placeholder', 'disabled', 'min-length', 'value']
  }

  // ── Private state（有型別）──
  private shadow: ShadowRoot
  private inputEl: HTMLInputElement | null = null
  private _value = ''
  private _placeholder = 'Search...'
  private _disabled = false
  private _minLength = 2

  // ── Constructor ──
  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  // ── Public Properties（有完整型別）──
  get value(): string {
    return this._value
  }

  get placeholder(): string {
    return this._placeholder
  }
  set placeholder(value: string) {
    this._placeholder = value
    this.setAttribute('placeholder', value)
  }

  get disabled(): boolean {
    return this._disabled
  }
  set disabled(value: boolean) {
    this._disabled = value
    if (value) {
      this.setAttribute('disabled', '')
    } else {
      this.removeAttribute('disabled')
    }
  }

  get minLength(): number {
    return this._minLength
  }
  set minLength(value: number) {
    this._minLength = Math.max(0, value)
    this.setAttribute('min-length', String(this._minLength))
  }

  // ── Public Methods ──
  clear(): void {
    this._value = ''
    if (this.inputEl) {
      this.inputEl.value = ''
    }
    this.dispatchEvent(new CustomEvent('clear', {
      bubbles: true,
      composed: true,
    }))
  }

  focus(options?: FocusOptions): void {
    this.inputEl?.focus(options)
  }

  // ── 型別安全的事件發送輔助方法 ──
  private emit&lt;K extends keyof SearchBoxEventMap&gt;(
    type: K,
    detail: SearchBoxEventMap[K] extends CustomEvent&lt;infer D&gt; ? D : never
  ): void {
    this.dispatchEvent(new CustomEvent(type, {
      bubbles: true,
      composed: true,
      detail,
    }))
  }

  // ── 生命週期 ──
  connectedCallback(): void {
    this.render()
    this.setupEventListeners()
  }

  attributeChangedCallback(
    name: string,
    _old: string | null,
    newVal: string | null
  ): void {
    switch (name) {
      case 'placeholder':
        this._placeholder = newVal ?? 'Search...'
        break
      case 'disabled':
        this._disabled = newVal !== null
        break
      case 'min-length':
        this._minLength = parseInt(newVal ?? '2', 10)
        break
    }
    if (this.isConnected) this.render()
  }

  private render(): void {
    this.shadow.innerHTML = \`
      &lt;style&gt;
        :host { display: block; }
        .wrapper { display: flex; align-items: center; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden; }
        input { flex: 1; padding: 10px 12px; border: none; outline: none; font-size: 0.875rem; }
        input:disabled { background: #f9fafb; cursor: not-allowed; }
        button { padding: 8px 12px; background: none; border: none; cursor: pointer; color: #6b7280; }
        button:hover { color: #374151; }
      &lt;/style&gt;
      &lt;div class="wrapper"&gt;
        &lt;input
          type="text"
          placeholder="\${this._placeholder}"
          value="\${this._value}"
          \${this._disabled ? 'disabled' : ''}
          aria-label="Search"
        /&gt;
        &lt;button type="button" class="clear-btn" aria-label="Clear" \${!this._value ? 'hidden' : ''}&gt;✕&lt;/button&gt;
        &lt;button type="button" class="search-btn" aria-label="Submit search"&gt;🔍&lt;/button&gt;
      &lt;/div&gt;
    \`
    this.inputEl = this.shadow.querySelector('input')
  }

  private setupEventListeners(): void {
    this.shadow.addEventListener('input', (e) =&gt; {
      const target = e.target as HTMLInputElement
      if (target.matches('input')) {
        this._value = target.value
        const clearBtn = this.shadow.querySelector('.clear-btn') as HTMLButtonElement
        clearBtn.hidden = !this._value
      }
    })

    this.shadow.addEventListener('click', (e) =&gt; {
      const target = e.target as HTMLElement
      if (target.matches('.clear-btn')) {
        this.clear()
      } else if (target.matches('.search-btn') || target.matches('input')) {
        if (this._value.length &gt;= this._minLength) {
          this.emit('search', { query: this._value, timestamp: Date.now() })
        }
      }
    })

    this.shadow.addEventListener('keydown', (e) =&gt; {
      if ((e as KeyboardEvent).key === 'Enter' &amp;&amp; this._value.length &gt;= this._minLength) {
        this.emit('search', { query: this._value, timestamp: Date.now() })
      }
    })
  }
}

// 型別別名，方便參考
type SearchBoxAttributes = {
  placeholder: string
  disabled: string
  'min-length': string
  value: string
}

customElements.define(SearchBox.tagName, SearchBox)
</book-code-block>

<h2 id="ch06-s02">在 HTMLElementTagNameMap 中宣告自訂元素</h2>

<p><code>HTMLElementTagNameMap</code> 是 TypeScript 內建的介面，它映射 HTML 標籤名稱到對應的 DOM 介面型別。例如 <code>"button"</code> 映射到 <code>HTMLButtonElement</code>，<code>"input"</code> 映射到 <code>HTMLInputElement</code>。透過 Declaration Merging，你可以把自訂元素加入這個映射，讓 <code>document.querySelector('search-box')</code> 回傳正確的型別。</p>

<book-code-block language="typescript" label="HTMLElementTagNameMap Declaration Merging">
// ── 基本宣告（在元件檔案的最後，或單獨的 types.d.ts）──
declare global {
  interface HTMLElementTagNameMap {
    'search-box': SearchBox
    'my-button': MyButton
    'my-card': MyCard
    'my-dialog': MyDialog
    'my-tabs': MyTabs
    'data-table': DataTable
  }
}

// ── 效果展示 ──
// 有了上面的宣告，以下程式碼都有正確的型別：

// querySelector 有型別
const searchBox = document.querySelector('search-box')
//    ^ 型別：SearchBox | null

// querySelectorAll 有型別
const allButtons = document.querySelectorAll('my-button')
//    ^ 型別：NodeListOf&lt;MyButton&gt;

// createElement 有型別
const dialog = document.createElement('my-dialog')
//    ^ 型別：MyDialog

// 型別守衛
function processElement(el: Element) {
  if (el instanceof SearchBox) {
    el.clear()  // ← TypeScript 知道 el 是 SearchBox，可以呼叫 clear()
  }
}

// ── 在 React 中使用（需要額外宣告）──
// React 元素型別不知道 Custom Elements，需要擴充
declare namespace React {
  namespace JSX {
    interface IntrinsicElements {
      'search-box': React.DetailedHTMLProps&lt;
        React.HTMLAttributes&lt;SearchBox&gt; &amp; {
          placeholder?: string
          disabled?: boolean
          'min-length'?: number
        },
        SearchBox
      &gt;
    }
  }
}

// ── 集中管理（推薦做法）──
// 建立 src/types/custom-elements.d.ts
// 在這個檔案中統一宣告所有 Custom Element 的型別
// 並在 tsconfig.json 的 include 中包含此檔案

// custom-elements.d.ts 範例：
// declare global {
//   interface HTMLElementTagNameMap {
//     'ds-button': import('../components/button/ds-button.js').DsButton
//     'ds-card': import('../components/card/ds-card.js').DsCard
//     // ... 其他元件
//   }
// }
</book-code-block>

<h2 id="ch06-s03">用 Getter / Setter 實作 Attribute Reflection 模式</h2>

<p>Attribute Reflection（屬性反射）是 Custom Element 設計中的一個重要模式：讓 JavaScript Property 和 HTML Attribute 保持同步。原生 HTML 元素（如 <code>&lt;input&gt;</code> 的 <code>value</code>、<code>&lt;button&gt;</code> 的 <code>disabled</code>）都實作了這個模式。正確的 TypeScript 實作需要 getter/setter pair，並搭配 <code>observedAttributes</code>。</p>

<book-code-block language="typescript" label="完整的 Attribute Reflection 模式">
// ── 通用的 Attribute Reflection 工具型別 ──

// 將 Attribute 字串值轉換為各種型別的輔助函式
const AttributeConverters = {
  string: {
    fromAttr: (val: string | null, defaultVal: string) =&gt; val ?? defaultVal,
    toAttr: (val: string) =&gt; val,
  },
  number: {
    fromAttr: (val: string | null, defaultVal: number) =&gt;
      val !== null ? parseFloat(val) : defaultVal,
    toAttr: (val: number) =&gt; String(val),
  },
  boolean: {
    // HTML boolean attribute 慣例：有就是 true，沒有就是 false
    fromAttr: (val: string | null) =&gt; val !== null,
    toAttr: (_val: boolean) =&gt; '',  // boolean attribute 的值通常是空字串
  },
  // 枚舉型別
  enum: &lt;T extends string&gt;(values: readonly T[], defaultVal: T) =&gt; ({
    fromAttr: (val: string | null): T =&gt;
      values.includes(val as T) ? (val as T) : defaultVal,
    toAttr: (val: T) =&gt; val,
  }),
} as const

// ── 完整的 Attribute Reflection 實作 ──
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

class TypedButton extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'size', 'disabled', 'loading', 'label', 'count'] as const
  }

  // ── 每個 attribute 對應一個 getter/setter pair ──

  // 字串 property（帶預設值）
  get variant(): ButtonVariant {
    return AttributeConverters.enum(
      ['primary', 'secondary', 'danger', 'ghost'] as const,
      'primary' as ButtonVariant
    ).fromAttr(this.getAttribute('variant'))
  }
  set variant(value: ButtonVariant) {
    this.setAttribute('variant', value)
  }

  // 枚舉 property
  get size(): ButtonSize {
    return AttributeConverters.enum(
      ['sm', 'md', 'lg'] as const,
      'md' as ButtonSize
    ).fromAttr(this.getAttribute('size'))
  }
  set size(value: ButtonSize) {
    this.setAttribute('size', value)
  }

  // 布林 property
  get disabled(): boolean {
    return AttributeConverters.boolean.fromAttr(this.getAttribute('disabled'))
  }
  set disabled(value: boolean) {
    if (value) {
      this.setAttribute('disabled', '')
      this.setAttribute('aria-disabled', 'true')
    } else {
      this.removeAttribute('disabled')
      this.removeAttribute('aria-disabled')
    }
  }

  // 載入狀態（布林）
  get loading(): boolean {
    return this.hasAttribute('loading')
  }
  set loading(value: boolean) {
    this.toggleAttribute('loading', value)
  }

  // 字串 property
  get label(): string {
    return this.getAttribute('label') ?? ''
  }
  set label(value: string) {
    this.setAttribute('label', value)
  }

  // 數字 property
  get count(): number {
    return parseInt(this.getAttribute('count') ?? '0', 10)
  }
  set count(value: number) {
    this.setAttribute('count', String(value))
  }

  // ── 生命週期 ──
  connectedCallback() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'button')
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0')
    this.render()
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render()
  }

  private render() {
    const variantStyles: Record&lt;ButtonVariant, string&gt; = {
      primary: 'background:#4f46e5;color:white;',
      secondary: 'background:#e5e7eb;color:#374151;',
      danger: 'background:#dc2626;color:white;',
      ghost: 'background:transparent;color:#4f46e5;border:1px solid #4f46e5;',
    }

    const sizeStyles: Record&lt;ButtonSize, string&gt; = {
      sm: 'padding:4px 10px;font-size:0.75rem;',
      md: 'padding:8px 16px;font-size:0.875rem;',
      lg: 'padding:12px 24px;font-size:1rem;',
    }

    this.style.cssText = \`
      display: inline-flex; align-items: center; gap: 6px;
      border: none; border-radius: 6px; cursor: \${this.disabled ? 'not-allowed' : 'pointer'};
      opacity: \${this.disabled ? 0.5 : 1};
      \${variantStyles[this.variant]}
      \${sizeStyles[this.size]}
    \`

    this.innerHTML = this.loading
      ? \`&lt;span style="animation:spin 1s linear infinite"&gt;⟳&lt;/span&gt; Loading...\`
      : \`\${this.label || ''}&lt;slot&gt;&lt;/slot&gt;\${this.count ? \`&lt;span style="background:rgba(0,0,0,.2);padding:1px 6px;border-radius:999px"&gt;\${this.count}&lt;/span&gt;\` : ''}\`
  }
}

customElements.define('typed-button', TypedButton)

declare global {
  interface HTMLElementTagNameMap {
    'typed-button': TypedButton
  }
}
</book-code-block>

<h2 id="ch06-s04">用 CustomEvent&lt;T&gt; 設計強型別的自訂事件</h2>

<p>TypeScript 的 <code>CustomEvent&lt;T&gt;</code> 泛型讓你能夠為事件的 <code>detail</code> 屬性指定精確的型別。搭配事件映射介面（Event Map），可以讓 <code>addEventListener</code> 也有完整的型別支援。</p>

<book-code-block language="typescript" label="強型別 CustomEvent 設計模式">
// ── 定義元件的事件型別 ──
interface FormFieldEvents {
  'field-change': { name: string; value: string; valid: boolean }
  'field-blur': { name: string; value: string }
  'field-submit': { formData: Record&lt;string, string&gt; }
  'validation-error': { name: string; errors: string[] }
}

// ── 型別安全的事件發送工具 ──
class TypedEventEmitter extends HTMLElement {
  // 強型別的 emit 方法
  protected emit&lt;K extends keyof FormFieldEvents&gt;(
    type: K,
    detail: FormFieldEvents[K],
    options: Omit&lt;CustomEventInit, 'detail'&gt; = {}
  ): boolean {
    return this.dispatchEvent(
      new CustomEvent(type, {
        detail,
        bubbles: true,
        composed: true,
        ...options,
      })
    )
  }
}

// ── 使用強型別 emit 的元件 ──
class TypedFormField extends TypedEventEmitter {
  private fieldName = ''
  private fieldValue = ''

  static get observedAttributes() { return ['name', 'required', 'pattern'] }

  connectedCallback() {
    this.fieldName = this.getAttribute('name') ?? ''
    this.attachShadow({ mode: 'open' })!.innerHTML = \`
      &lt;style&gt;
        :host { display: block; margin-bottom: 16px; }
        input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box; }
        input:invalid { border-color: #dc2626; }
        .error { color: #dc2626; font-size: 0.75rem; margin-top: 4px; }
      &lt;/style&gt;
      &lt;input type="text" name="\${this.fieldName}" /&gt;
      &lt;div class="error" hidden&gt;&lt;/div&gt;
    \`
    this.setupListeners()
  }

  private setupListeners() {
    const input = this.shadowRoot!.querySelector('input')!

    input.addEventListener('input', () =&gt; {
      this.fieldValue = input.value
      const valid = this.validate(input.value)

      // 型別安全的 emit：TypeScript 確保 detail 的形狀正確
      this.emit('field-change', {
        name: this.fieldName,
        value: this.fieldValue,
        valid,
      })
    })

    input.addEventListener('blur', () =&gt; {
      this.emit('field-blur', {
        name: this.fieldName,
        value: this.fieldValue,
      })
    })
  }

  private validate(value: string): boolean {
    const required = this.hasAttribute('required')
    const pattern = this.getAttribute('pattern')

    const errors: string[] = []

    if (required &amp;&amp; !value) {
      errors.push('此欄位為必填')
    }

    if (pattern &amp;&amp; value &amp;&amp; !new RegExp(pattern).test(value)) {
      errors.push('格式不符合規定')
    }

    if (errors.length &gt; 0) {
      this.emit('validation-error', {
        name: this.fieldName,
        errors,
      })
      const errorEl = this.shadowRoot!.querySelector('.error')!
      errorEl.textContent = errors[0]
      ;(errorEl as HTMLElement).hidden = false
    } else {
      const errorEl = this.shadowRoot!.querySelector('.error') as HTMLElement
      errorEl.hidden = true
    }

    return errors.length === 0
  }
}

customElements.define('typed-form-field', TypedFormField)

// ── 使用端：addEventListener 需要手動斷言型別 ──
const field = document.querySelector('typed-form-field')!

// 方式一：型別斷言（最直接）
field.addEventListener('field-change', (e) =&gt; {
  const detail = (e as CustomEvent&lt;FormFieldEvents['field-change']&gt;).detail
  console.log(detail.name, detail.value, detail.valid)
})

// 方式二：建立型別安全的 addEventListener 包裝
function onTypedEvent&lt;
  TElement extends HTMLElement,
  K extends keyof FormFieldEvents
&gt;(
  element: TElement,
  type: K,
  handler: (detail: FormFieldEvents[K]) =&gt; void
) {
  element.addEventListener(type, (e) =&gt; {
    handler((e as CustomEvent).detail as FormFieldEvents[K])
  })
}

onTypedEvent(field, 'field-change', ({ name, value, valid }) =&gt; {
  // 全部都有型別推斷！
  console.log(name, value, valid)
})
</book-code-block>

<h2 id="ch06-s05">用 Declaration Merging 擴充全域 HTMLElement 型別</h2>

<p>有時候你需要在多個元件中共用某些屬性或方法，或者為現有的 HTMLElement 型別添加自訂的屬性。TypeScript 的 Declaration Merging 讓你能夠擴充已有的介面，而不需要修改原始型別定義。</p>

<book-code-block language="typescript" label="Declaration Merging 擴充全域型別">
// ── 方式一：擴充 HTMLElement 介面，添加共用方法 ──
declare global {
  interface HTMLElement {
    // 為所有 HTMLElement 添加一個 "component utilities"
    // 注意：這在執行時需要 mixin 或 base class 提供實作
    // 純型別宣告不會添加實際方法！
  }
}

// ── 方式二：用 Mixin 模式結合型別擴充 ──
// 定義一個 Mixin，為元素添加共用的能力

// Mixin 型別定義
type Constructor&lt;T = HTMLElement&gt; = new (...args: any[]) =&gt; T

// 可重用的 Mixin：Disabled 功能
function DisabledMixin&lt;TBase extends Constructor&gt;(Base: TBase) {
  abstract class DisabledElement extends Base {
    get disabled(): boolean {
      return this.hasAttribute('disabled')
    }
    set disabled(value: boolean) {
      this.toggleAttribute('disabled', value)
    }

    // 保護禁用元素的互動
    protected guardDisabled(callback: () =&gt; void): void {
      if (!this.disabled) callback()
    }
  }

  return DisabledElement
}

// 可重用的 Mixin：Loading 功能
function LoadingMixin&lt;TBase extends Constructor&gt;(Base: TBase) {
  abstract class LoadingElement extends Base {
    get loading(): boolean {
      return this.hasAttribute('loading')
    }
    set loading(value: boolean) {
      this.toggleAttribute('loading', value)
      this.setAttribute('aria-busy', String(value))
    }

    protected async withLoading&lt;T&gt;(fn: () =&gt; Promise&lt;T&gt;): Promise&lt;T&gt; {
      this.loading = true
      try {
        return await fn()
      } finally {
        this.loading = false
      }
    }
  }

  return LoadingElement
}

// 組合多個 Mixin
const BaseWithMixins = LoadingMixin(DisabledMixin(HTMLElement))

class SubmitButton extends BaseWithMixins {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })!.innerHTML = \`
      &lt;style&gt;
        :host { display: inline-block; }
        button { padding: 8px 16px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer; }
        :host([disabled]) button, :host([loading]) button { opacity: 0.6; cursor: not-allowed; }
      &lt;/style&gt;
      &lt;button type="button"&gt;&lt;slot&gt;Submit&lt;/slot&gt;&lt;/button&gt;
    \`

    this.shadowRoot!.querySelector('button')!.addEventListener('click', () =&gt; {
      this.guardDisabled(async () =&gt; {
        await this.withLoading(async () =&gt; {
          // 模擬 API 呼叫
          await new Promise(resolve =&gt; setTimeout(resolve, 1500))
          console.log('Submitted!')
        })
      })
    })
  }
}

customElements.define('submit-button', SubmitButton)

declare global {
  interface HTMLElementTagNameMap {
    'submit-button': SubmitButton
    'typed-form-field': TypedFormField
    'typed-button': TypedButton
    'search-box': SearchBox
  }
}
</book-code-block>

<h2 id="ch06-s06">在 Shadow Root 內進行型別安全的元素查詢</h2>

<p>在 Shadow DOM 內部查詢元素時，TypeScript 的型別推斷通常只能回傳 <code>Element | null</code>，不夠具體。建立型別安全的查詢工具可以大幅提升開發體驗，同時在 DOM 結構不符預期時提供明確的錯誤訊息。</p>

<book-code-block language="typescript" label="Shadow Root 型別安全查詢工具">
// ── 型別安全的查詢工具 ──
class ShadowQueryHelper {
  constructor(private root: ShadowRoot | Document) {}

  // 必定存在的元素查詢（不存在時拋出錯誤）
  require&lt;T extends HTMLElement&gt;(
    selector: string,
    type?: new(...args: any[]) =&gt; T
  ): T {
    const el = this.root.querySelector(selector)
    if (!el) {
      throw new Error(\`Required element not found: "\${selector}"\`)
    }
    if (type &amp;&amp; !(el instanceof type)) {
      throw new Error(\`Element "\${selector}" is not an instance of \${type.name}\`)
    }
    return el as T
  }

  // 可能不存在的元素查詢
  optional&lt;T extends HTMLElement&gt;(
    selector: string
  ): T | null {
    return this.root.querySelector(selector) as T | null
  }

  // 查詢多個元素
  all&lt;T extends HTMLElement&gt;(selector: string): T[] {
    return Array.from(this.root.querySelectorAll(selector)) as T[]
  }

  // 根據標籤名稱的型別安全查詢
  tag&lt;K extends keyof HTMLElementTagNameMap&gt;(
    tagName: K,
    selector?: string
  ): HTMLElementTagNameMap[K] | null {
    const fullSelector = selector ? \`\${tagName}\${selector}\` : tagName
    return this.root.querySelector(fullSelector) as HTMLElementTagNameMap[K] | null
  }
}

// ── 在元件中使用型別安全查詢 ──
class ComplexWidget extends HTMLElement {
  private shadow!: ShadowRoot
  private $!: ShadowQueryHelper

  // 快取 DOM 參考（避免重複查詢）
  private elements!: {
    input: HTMLInputElement
    submitBtn: HTMLButtonElement
    errorMsg: HTMLParagraphElement
    list: HTMLUListElement
    emptyState: HTMLDivElement
  }

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  connectedCallback() {
    this.render()
    this.$ = new ShadowQueryHelper(this.shadow)

    // 在渲染後，一次性查詢並快取所有需要的元素
    this.elements = {
      input: this.$.require&lt;HTMLInputElement&gt;('#main-input', HTMLInputElement),
      submitBtn: this.$.require&lt;HTMLButtonElement&gt;('.submit-btn', HTMLButtonElement),
      errorMsg: this.$.require&lt;HTMLParagraphElement&gt;('.error-message'),
      list: this.$.require&lt;HTMLUListElement&gt;('.item-list'),
      emptyState: this.$.require&lt;HTMLDivElement&gt;('.empty-state'),
    }

    this.bindEvents()
  }

  private render() {
    this.shadow.innerHTML = \`
      &lt;style&gt;
        :host { display: block; }
        .form { display: flex; gap: 8px; margin-bottom: 16px; }
        input { flex: 1; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; }
        .submit-btn { padding: 8px 16px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer; }
        .error-message { color: #dc2626; font-size: 0.75rem; min-height: 1em; }
        .item-list { list-style: none; padding: 0; margin: 0; }
        .item-list li { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
        .empty-state { text-align: center; color: #9ca3af; padding: 32px; }
      &lt;/style&gt;
      &lt;div class="form"&gt;
        &lt;input id="main-input" type="text" placeholder="Add item..." /&gt;
        &lt;button class="submit-btn" type="button"&gt;Add&lt;/button&gt;
      &lt;/div&gt;
      &lt;p class="error-message"&gt;&lt;/p&gt;
      &lt;ul class="item-list"&gt;&lt;/ul&gt;
      &lt;div class="empty-state"&gt;No items yet. Add one above!&lt;/div&gt;
    \`
  }

  private bindEvents() {
    const { input, submitBtn } = this.elements

    submitBtn.addEventListener('click', () =&gt; this.addItem())
    input.addEventListener('keydown', (e) =&gt; {
      if (e.key === 'Enter') this.addItem()
    })
  }

  private addItem() {
    const { input, errorMsg, list, emptyState } = this.elements
    const value = input.value.trim()

    if (!value) {
      errorMsg.textContent = '請輸入項目名稱'
      return
    }

    errorMsg.textContent = ''
    const li = document.createElement('li')
    li.textContent = value
    list.appendChild(li)
    input.value = ''
    emptyState.hidden = list.children.length &gt; 0
  }
}

customElements.define('complex-widget', ComplexWidget)
</book-code-block>

<book-callout variant="tip" title="效能提示：快取 DOM 參考">
  <p>在 Shadow DOM 內部，每次呼叫 <code>querySelector()</code> 都會遍歷 DOM 樹。對於需要頻繁存取的元素（如輸入框、按鈕、顯示區域），在 <code>connectedCallback</code> 完成初始渲染後，將這些元素的參考快取在 class 屬性中。這樣既獲得了型別安全（明確的型別宣告），又避免了重複的 DOM 查詢開銷。</p>
</book-callout>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>TypeScript 對 Web Components 的支援需要主動設定——透過 HTMLElementTagNameMap 宣告讓 querySelector 有型別、用 getter/setter 實作 Attribute Reflection、用 CustomEvent&lt;T&gt; 強型別化事件——這些模式合在一起，讓你的元件 API 對使用者如同原生 HTML 元素一樣清晰可見。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch05">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">ES Modules、Import Maps 與現代開發工具鏈</span>
    </a>
    <a class="footer-link" href="#ch07">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">Reactive Properties — 自己打造響應式系統</span>
    </a>
  </div>
</div>
`
