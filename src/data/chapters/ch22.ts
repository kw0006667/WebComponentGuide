export const metadata = {
  id: 22,
  part: 4,
  title: '表單、驗證與 Form-Associated Custom Elements API',
  tags: ['進階', '面試重點'] as string[],
  sections: [
    { slug: 'ch22-s01', title: '為什麼 Custom Elements 預設無法參與表單提交' },
    { slug: 'ch22-s02', title: 'formAssociated、ElementInternals 與 setFormValue() 的用法' },
    { slug: 'ch22-s03', title: '用 setValidity() 實作自訂驗證，接入 Constraint Validation API' },
    { slug: 'ch22-s04', title: '實作一個完全無障礙、能與 <form> 協作的 <custom-input>' },
    { slug: 'ch22-interview', title: '面試題：如何讓 Web Component 支援原生表單提交？' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 22 · 第四部：進階模式與系統架構</div>
  <h1>表單、驗證與 Form-Associated Custom Elements API</h1>
  <p>讓 Custom Element 真正融入原生 HTML 表單是許多開發者的痛點。Form-Associated Custom Elements（FACE）API 提供了完整的解決方案，讓自訂元件能夠參與表單提交、驗證和重置，就像原生 <code>&lt;input&gt;</code> 一樣。</p>
  <div class="chapter-tags">
    <span class="tag tag-advanced">進階</span>
    <span class="tag tag-interview">面試重點</span>
  </div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch22-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">為什麼 Custom Elements 預設無法參與表單提交</span>
    </a>
    <a class="catalog-item" href="#ch22-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">formAssociated、ElementInternals 與 setFormValue() 的用法</span>
    </a>
    <a class="catalog-item" href="#ch22-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">用 setValidity() 實作自訂驗證，接入 Constraint Validation API</span>
    </a>
    <a class="catalog-item" href="#ch22-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">實作完全無障礙的 &lt;custom-input&gt;</span>
    </a>
    <a class="catalog-item" href="#ch22-interview">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">面試題：如何讓 Web Component 支援原生表單提交？</span>
    </a>
  </div>
</div>

<h2 id="ch22-s01">為什麼 Custom Elements 預設無法參與表單提交</h2>

<p>當你在 <code>&lt;form&gt;</code> 中放入自訂元件時，提交表單不會包含它的值，<code>form.elements</code> 也不會列出它，<code>form.checkValidity()</code> 也不知道它的存在。根本原因是：</p>

<book-code-block language="html" label="HTML — 問題演示：Custom Element 的值不會被提交">
&lt;form id="contact-form" action="/submit" method="post"&gt;
  &lt;!-- 原生 input：表單提交時會包含 name=username 的值 --&gt;
  &lt;input name="username" type="text" value="Alice" /&gt;

  &lt;!-- Custom Element：表單完全不知道它的存在！ --&gt;
  &lt;fancy-input name="email" value="alice@example.com"&gt;&lt;/fancy-input&gt;

  &lt;button type="submit"&gt;送出&lt;/button&gt;
&lt;/form&gt;

&lt;script&gt;
  const form = document.getElementById('contact-form')
  form.addEventListener('submit', (e) =&gt; {
    e.preventDefault()
    const data = new FormData(form)
    console.log([...data.entries()])
    // 輸出：[['username', 'Alice']]
    // fancy-input 的值完全不見了！
  })

  // form.elements 也不包含 fancy-input
  console.log(form.elements.length) // 2（input + button），不含 fancy-input
&lt;/script&gt;
</book-code-block>

<p>解決方案是使用 <strong>Form-Associated Custom Elements（FACE）API</strong>，這是 Chrome 77+、Safari 16.4+、Firefox 98+ 支援的標準。</p>

<h2 id="ch22-s02">formAssociated、ElementInternals 與 setFormValue() 的用法</h2>

<p>啟用 FACE API 需要三個關鍵步驟：宣告 <code>static formAssociated = true</code>、呼叫 <code>attachInternals()</code>、以及在值變更時呼叫 <code>internals.setFormValue()</code>。</p>

<book-code-block language="typescript" label="TypeScript — FACE API 最小範例">
class RatingInput extends HTMLElement {
  // 步驟 1：宣告此元件關聯表單
  static formAssociated = true

  // 步驟 2：取得 ElementInternals（必須在建構子中呼叫）
  private _internals: ElementInternals
  private _value = '0'

  constructor() {
    super()
    this._internals = this.attachInternals()
    this.attachShadow({ mode: 'open' })
  }

  // 步驟 3：當值改變時，通知表單
  set value(newValue: string) {
    this._value = newValue
    // 設定此元件對表單的貢獻值
    // 第一個參數：提交的值（字串或 FormData）
    // 第二個參數（可選）：用於 FormData 的 name，通常省略（使用元件的 name attribute）
    this._internals.setFormValue(newValue)
    this._render()
  }

  get value(): string {
    return this._value
  }

  // 表單重置時觸發（回到預設值）
  formResetCallback() {
    this.value = this.getAttribute('value') ?? '0'
  }

  // 表單被停用時觸發（fieldset disabled 等情況）
  formDisabledCallback(disabled: boolean) {
    this.toggleAttribute('disabled', disabled)
    this._render()
  }

  // 表單狀態恢復時觸發（瀏覽器自動填入）
  formStateRestoreCallback(state: string, reason: 'restore' | 'autocomplete') {
    this.value = state
  }

  connectedCallback() {
    this._render()
  }

  private _render() {
    const rating = parseInt(this._value)
    const disabled = this.hasAttribute('disabled')

    this.shadowRoot!.innerHTML = \`
      &lt;style&gt;
        :host { display: inline-flex; gap: 4px; }
        button { background: none; border: none; cursor: pointer; font-size: 1.5rem;
                 padding: 2px; transition: transform 0.1s; }
        button:hover:not(:disabled) { transform: scale(1.2); }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
      &lt;/style&gt;
      \${[1,2,3,4,5].map(i =&gt; \`
        &lt;button
          type="button"
          \${disabled ? 'disabled' : ''}
          aria-label="\${i} 顆星"
          aria-pressed="\${i &lt;= rating}"
          data-value="\${i}"
        &gt;\${i &lt;= rating ? '★' : '☆'}&lt;/button&gt;
      \`).join('')}
    \`

    this.shadowRoot!.addEventListener('click', (e) =&gt; {
      const btn = (e.target as HTMLElement).closest('button')
      if (btn) {
        this.value = btn.dataset.value!
        this.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })
  }
}

customElements.define('rating-input', RatingInput)
</book-code-block>

<h2 id="ch22-s03">用 setValidity() 實作自訂驗證，接入 Constraint Validation API</h2>

<p><code>ElementInternals.setValidity()</code> 讓 Custom Element 能夠加入瀏覽器的 Constraint Validation API，與原生的 <code>:valid</code>/<code>:invalid</code> CSS 偽類和 <code>form.checkValidity()</code> 完全相容。</p>

<book-code-block language="typescript" label="TypeScript — setValidity() 完整用法">
// setValidity 的第一個參數是 ValidityStateFlags 物件
// 對應 ValidityState 的各個屬性：
// {
//   valueMissing: boolean      // 必填但為空
//   typeMismatch: boolean      // 格式不符
//   patternMismatch: boolean   // 不符合 pattern
//   tooLong: boolean           // 超過 maxlength
//   tooShort: boolean          // 少於 minlength
//   rangeUnderflow: boolean    // 小於 min
//   rangeOverflow: boolean     // 大於 max
//   stepMismatch: boolean      // 不符合 step
//   badInput: boolean          // 使用者輸入無法轉換為值
//   customError: boolean       // 自訂錯誤（最常用）
// }

class PhoneInput extends HTMLElement {
  static formAssociated = true
  private _internals: ElementInternals
  private _value = ''

  // 台灣手機號碼格式驗證
  private static readonly PHONE_REGEX = /^09\d{8}$/

  constructor() {
    super()
    this._internals = this.attachInternals()
    this.attachShadow({ mode: 'open' })
  }

  set value(newValue: string) {
    this._value = newValue
    this._internals.setFormValue(newValue)
    this._validate()
    this._render()
  }

  get value(): string {
    return this._value
  }

  private _validate() {
    const required = this.hasAttribute('required')
    const isEmpty = this._value.trim() === ''

    if (required &amp;&amp; isEmpty) {
      // 第一個參數：哪個驗證規則失敗
      // 第二個參數：顯示給使用者的錯誤訊息（可用於 :invalid 的 tooltip）
      // 第三個參數（可選）：焦點目標元素（Shadow DOM 中的實際 input）
      this._internals.setValidity(
        { valueMissing: true },
        '請輸入手機號碼',
        this.shadowRoot?.querySelector('input') ?? undefined
      )
    } else if (!isEmpty &amp;&amp; !PhoneInput.PHONE_REGEX.test(this._value)) {
      this._internals.setValidity(
        { patternMismatch: true },
        '請輸入有效的台灣手機號碼（格式：09xxxxxxxx）',
        this.shadowRoot?.querySelector('input') ?? undefined
      )
    } else {
      // 清除所有驗證錯誤（代表驗證通過）
      this._internals.setValidity({})
    }
  }

  connectedCallback() {
    this._render()
  }

  formResetCallback() {
    this.value = ''
  }

  private _render() {
    const isInvalid = !this._internals.validity.valid
    const errorMsg = this._internals.validationMessage

    this.shadowRoot!.innerHTML = \`
      &lt;style&gt;
        :host { display: block; }
        input { width: 100%; padding: 8px 12px; border: 2px solid #e2e8f0;
                border-radius: 6px; font-size: 1rem; outline: none; }
        input:focus { border-color: #4299e1; }
        input.invalid { border-color: #e53e3e; }
        .error-msg { color: #e53e3e; font-size: 0.875rem; margin-top: 4px; }
      &lt;/style&gt;
      &lt;input
        type="tel"
        class="\${isInvalid ? 'invalid' : ''}"
        value="\${this._value}"
        placeholder="09xxxxxxxx"
        aria-invalid="\${isInvalid}"
        aria-describedby="\${isInvalid ? 'error-msg' : ''}"
      /&gt;
      \${isInvalid ? \`&lt;p id="error-msg" class="error-msg" role="alert"&gt;\${errorMsg}&lt;/p&gt;\` : ''}
    \`

    this.shadowRoot!.querySelector('input')?.addEventListener('input', (e) =&gt; {
      this.value = (e.target as HTMLInputElement).value
      this.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }
}

customElements.define('phone-input', PhoneInput)
</book-code-block>

<h2 id="ch22-s04">實作一個完全無障礙、能與 &lt;form&gt; 協作的 &lt;custom-input&gt;</h2>

<p>這是本章的旗艦範例：一個完整的 <code>&lt;custom-input&gt;</code> 元件，整合了 FACE API 的所有功能、完整的 ARIA 無障礙支援，以及鍵盤操作。</p>

<book-code-block language="typescript" label="TypeScript — 完整 custom-input 實作（FACE API 旗艦範例）">
// custom-input.ts — 完整的 Form-Associated Custom Element

type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'

class CustomInput extends HTMLElement {
  // ===== FACE API 宣告 =====
  static formAssociated = true
  private _internals: ElementInternals

  // ===== 狀態 =====
  private _value = ''
  private _defaultValue = ''

  // ===== 觀察的 Attributes =====
  static get observedAttributes() {
    return ['type', 'placeholder', 'required', 'disabled', 'readonly',
            'minlength', 'maxlength', 'pattern', 'autocomplete', 'label', 'value']
  }

  constructor() {
    super()
    this._internals = this.attachInternals()

    // 設定 ARIA role（ElementInternals 方式，比直接設 attribute 更正確）
    this._internals.role = 'textbox'

    this.attachShadow({ mode: 'open' })
  }

  // ===== Attribute 變更回調 =====
  attributeChangedCallback(name: string, _old: string | null, newVal: string | null) {
    if (name === 'value') {
      this._defaultValue = newVal ?? ''
      if (!this._userHasInteracted) {
        this._value = newVal ?? ''
        this._internals.setFormValue(this._value)
      }
    }
    this._validate()
    this._render()
  }

  // ===== Form 生命週期回調 =====
  formResetCallback() {
    this._value = this._defaultValue
    this._userHasInteracted = false
    this._internals.setFormValue(this._value)
    this._validate()
    this._render()
  }

  formDisabledCallback(disabled: boolean) {
    this._isFormDisabled = disabled
    this._render()
  }

  formStateRestoreCallback(state: string, _reason: string) {
    this._value = state
    this._internals.setFormValue(this._value)
    this._render()
  }

  // ===== 公開 Properties =====
  get value(): string { return this._value }
  set value(v: string) {
    this._value = v
    this._internals.setFormValue(v)
    this._validate()
    this._render()
  }

  get validity(): ValidityState { return this._internals.validity }
  get validationMessage(): string { return this._internals.validationMessage }
  get willValidate(): boolean { return this._internals.willValidate }
  checkValidity(): boolean { return this._internals.checkValidity() }
  reportValidity(): boolean { return this._internals.reportValidity() }

  // ===== 內部狀態 =====
  private _userHasInteracted = false
  private _isFormDisabled = false
  private _isTouched = false  // 失去焦點後才顯示驗證錯誤

  // ===== 驗證邏輯 =====
  private _validate() {
    const input = this.shadowRoot?.querySelector('input')
    const required = this.hasAttribute('required')
    const minlength = parseInt(this.getAttribute('minlength') ?? '0')
    const maxlength = parseInt(this.getAttribute('maxlength') ?? '999999')
    const pattern = this.getAttribute('pattern')
    const type = (this.getAttribute('type') ?? 'text') as InputType

    const isEmpty = this._value === ''

    if (required &amp;&amp; isEmpty) {
      this._internals.setValidity({ valueMissing: true }, '此欄位為必填', input ?? undefined)
      return
    }
    if (!isEmpty &amp;&amp; this._value.length &lt; minlength) {
      this._internals.setValidity(
        { tooShort: true },
        \`至少需要 \${minlength} 個字元（目前 \${this._value.length} 個）\`,
        input ?? undefined
      )
      return
    }
    if (!isEmpty &amp;&amp; this._value.length &gt; maxlength) {
      this._internals.setValidity(
        { tooLong: true },
        \`最多允許 \${maxlength} 個字元（目前 \${this._value.length} 個）\`,
        input ?? undefined
      )
      return
    }
    if (!isEmpty &amp;&amp; pattern) {
      const regex = new RegExp(\`^\${pattern}$\`)
      if (!regex.test(this._value)) {
        this._internals.setValidity(
          { patternMismatch: true },
          \`格式不符合要求\`,
          input ?? undefined
        )
        return
      }
    }
    if (!isEmpty &amp;&amp; type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(this._value)) {
        this._internals.setValidity(
          { typeMismatch: true },
          '請輸入有效的電子郵件地址',
          input ?? undefined
        )
        return
      }
    }

    // 驗證通過
    this._internals.setValidity({})
  }

  // ===== 連接到 DOM =====
  connectedCallback() {
    this._defaultValue = this.getAttribute('value') ?? ''
    this._value = this._defaultValue
    this._internals.setFormValue(this._value)
    this._validate()
    this._render()
  }

  // ===== 渲染 =====
  private _render() {
    const type = (this.getAttribute('type') ?? 'text') as InputType
    const placeholder = this.getAttribute('placeholder') ?? ''
    const label = this.getAttribute('label') ?? ''
    const required = this.hasAttribute('required')
    const disabled = this.hasAttribute('disabled') || this._isFormDisabled
    const readonly = this.hasAttribute('readonly')
    const autocomplete = this.getAttribute('autocomplete') ?? 'off'
    const maxlength = this.getAttribute('maxlength')

    const isInvalid = !this._internals.validity.valid
    const showError = isInvalid &amp;&amp; this._isTouched
    const errorMsg = this._internals.validationMessage
    const inputId = \`input-\${Math.random().toString(36).slice(2)}\`

    this.shadowRoot!.innerHTML = \`
      &lt;style&gt;
        :host { display: block; font-family: system-ui, sans-serif; }
        :host([disabled]) { opacity: 0.6; }

        .field { display: flex; flex-direction: column; gap: 4px; }

        label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--input-label-color, #374151);
        }
        label .required-mark { color: #e53e3e; margin-left: 2px; }

        .input-wrapper { position: relative; }

        input {
          width: 100%;
          padding: 10px 14px;
          border: 2px solid var(--input-border-color, #d1d5db);
          border-radius: var(--input-radius, 6px);
          font-size: 1rem;
          line-height: 1.5;
          color: var(--input-text-color, #111827);
          background: var(--input-bg, #fff);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }
        input:focus {
          border-color: var(--input-focus-color, #3b82f6);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }
        input.error { border-color: #ef4444; }
        input.error:focus { box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2); }
        input:disabled { background: #f3f4f6; cursor: not-allowed; }

        .char-count {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.75rem;
          color: #9ca3af;
          pointer-events: none;
        }
        .char-count.near-limit { color: #f59e0b; }
        .char-count.at-limit { color: #ef4444; }

        .error-msg {
          font-size: 0.8125rem;
          color: #ef4444;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .error-msg::before { content: '⚠'; }

        .hint {
          font-size: 0.8125rem;
          color: #6b7280;
        }
      &lt;/style&gt;

      &lt;div class="field"&gt;
        \${label ? \`
          &lt;label for="\${inputId}"&gt;
            \${label}
            \${required ? '&lt;span class="required-mark" aria-hidden="true"&gt;*&lt;/span&gt;' : ''}
          &lt;/label&gt;
        \` : ''}

        &lt;div class="input-wrapper"&gt;
          &lt;input
            id="\${inputId}"
            type="\${type}"
            value="\${this._value.replace(/"/g, '&amp;quot;')}"
            placeholder="\${placeholder}"
            \${required ? 'required' : ''}
            \${disabled ? 'disabled' : ''}
            \${readonly ? 'readonly' : ''}
            \${maxlength ? \`maxlength="\${maxlength}"\` : ''}
            autocomplete="\${autocomplete}"
            aria-required="\${required}"
            aria-invalid="\${showError}"
            aria-describedby="\${showError ? 'error-msg' : 'hint'}"
            class="\${showError ? 'error' : ''}"
          /&gt;
          \${maxlength ? \`
            &lt;span class="char-count \${
              this._value.length &gt;= parseInt(maxlength) ? 'at-limit' :
              this._value.length &gt;= parseInt(maxlength) * 0.8 ? 'near-limit' : ''
            }"&gt;\${this._value.length}/\${maxlength}&lt;/span&gt;
          \` : ''}
        &lt;/div&gt;

        \${showError ? \`&lt;p id="error-msg" class="error-msg" role="alert"&gt;\${errorMsg}&lt;/p&gt;\` : ''}
        \${!showError &amp;&amp; this.hasAttribute('hint') ? \`
          &lt;p id="hint" class="hint"&gt;\${this.getAttribute('hint')}&lt;/p&gt;
        \` : ''}
      &lt;/div&gt;
    \`

    // 事件監聽
    const inputEl = this.shadowRoot!.querySelector('input')!

    inputEl.addEventListener('input', (e) =&gt; {
      this._userHasInteracted = true
      this._value = (e.target as HTMLInputElement).value
      this._internals.setFormValue(this._value)
      this._validate()
      // 保持游標位置（只更新 char counter，不重新渲染整個 Shadow DOM）
      const charCount = this.shadowRoot!.querySelector('.char-count')
      if (charCount &amp;&amp; maxlength) {
        charCount.textContent = \`\${this._value.length}/\${maxlength}\`
      }
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }))
      this.dispatchEvent(new Event('change', { bubbles: true, composed: true }))
    })

    inputEl.addEventListener('blur', () =&gt; {
      this._isTouched = true
      this._render() // 失去焦點後才顯示驗證錯誤
    })

    inputEl.addEventListener('focus', () =&gt; {
      this.dispatchEvent(new Event('focus', { bubbles: false }))
    })
  }
}

customElements.define('custom-input', CustomInput)
</book-code-block>

<book-code-block language="html" label="HTML — custom-input 在表單中的完整使用範例">
&lt;form id="register-form" novalidate&gt;
  &lt;custom-input
    name="username"
    label="使用者名稱"
    required
    minlength="3"
    maxlength="20"
    pattern="[a-zA-Z0-9_]+"
    hint="只能包含英文字母、數字和底線"
    autocomplete="username"
  &gt;&lt;/custom-input&gt;

  &lt;custom-input
    name="email"
    type="email"
    label="電子郵件"
    required
    autocomplete="email"
  &gt;&lt;/custom-input&gt;

  &lt;custom-input
    name="password"
    type="password"
    label="密碼"
    required
    minlength="8"
    hint="至少 8 個字元"
    autocomplete="new-password"
  &gt;&lt;/custom-input&gt;

  &lt;button type="submit"&gt;註冊&lt;/button&gt;
&lt;/form&gt;

&lt;script type="module"&gt;
  import './custom-input.js'

  const form = document.getElementById('register-form')
  form.addEventListener('submit', (e) =&gt; {
    e.preventDefault()

    // form.checkValidity() 會呼叫所有關聯元件的驗證
    if (!form.checkValidity()) {
      // reportValidity() 顯示瀏覽器原生的驗證提示
      form.reportValidity()
      return
    }

    // FormData 自動包含所有 form-associated custom elements 的值
    const data = new FormData(form)
    console.log(Object.fromEntries(data))
    // { username: 'alice', email: 'alice@example.com', password: '...' }
  })
&lt;/script&gt;
</book-code-block>

<h2 id="ch22-interview">面試題：如何讓 Web Component 支援原生表單提交？</h2>

<div class="interview-qa">
  <p><strong>Q：你需要建立一個自訂的 Rating（星級評分）元件，要求它能在 <code>&lt;form&gt;</code> 提交時自動包含評分值，並且支援 <code>required</code> 驗證。你會怎麼實作？</strong></p>

  <p><strong>A（分層回答）：</strong></p>

  <p><strong>核心 API：</strong>使用 Form-Associated Custom Elements（FACE）API。需要三步：</p>
  <ol>
    <li>宣告 <code>static formAssociated = true</code></li>
    <li>在建構子中呼叫 <code>this._internals = this.attachInternals()</code></li>
    <li>當評分改變時呼叫 <code>this._internals.setFormValue(newRating)</code></li>
  </ol>

  <p><strong>驗證整合：</strong>使用 <code>this._internals.setValidity()</code> 整合 Constraint Validation API。當 <code>required</code> 且尚未評分時，呼叫 <code>setValidity({ valueMissing: true }, '請給予評分')</code>；評分後呼叫 <code>setValidity({})</code> 清除錯誤。這樣 <code>form.checkValidity()</code> 就能感知到這個元件的驗證狀態。</p>

  <p><strong>生命週期：</strong>還需要實作 <code>formResetCallback()</code>（重置時回到預設值）和 <code>formDisabledCallback(disabled)</code>（<code>fieldset</code> 停用時停用元件）。</p>

  <p><strong>無障礙：</strong>在 <code>constructor</code> 中設定 <code>this._internals.role = 'slider'</code>（或 <code>'radiogroup'</code>），每個星星按鈕加上 <code>aria-label</code> 和 <code>aria-pressed</code>，鍵盤支援方向鍵調整。</p>
</div>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>Form-Associated Custom Elements API 透過 <code>static formAssociated = true</code>、<code>attachInternals()</code>、<code>setFormValue()</code> 和 <code>setValidity()</code> 四個核心機制，讓自訂元件完全融入原生表單的提交、驗證和重置生命週期。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch21">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">跨框架互通性 — 在 React / Angular / Vue 的世界裡生存</span>
    </a>
    <a class="footer-link" href="#ch23">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">測試 Web Components</span>
    </a>
  </div>
</div>
`
