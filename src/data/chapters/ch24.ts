export const metadata = {
  id: 24,
  part: 5,
  title: 'Web Components 的無障礙設計（Accessibility）',
  tags: ['面試重點', '進階'] as string[],
  sections: [
    { slug: 'ch24-s01', title: 'Accessibility Tree 與 Shadow DOM 對其造成的影響' },
    { slug: 'ch24-s02', title: 'Custom Elements 中的 ARIA Role、State 與 Property 設定' },
    { slug: 'ch24-s03', title: 'ElementInternals.ariaRole — 設定 ARIA 的正確方式' },
    { slug: 'ch24-s04', title: '鍵盤導航模式：Roving Tabindex 與 Focus Trap' },
    { slug: 'ch24-s05', title: '跨越 Shadow Boundary 的 Accessible Name 計算' },
    { slug: 'ch24-interview', title: '面試題：Shadow DOM 如何影響螢幕閱讀器的行為？' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 24 · 第五部：品質保證：測試、無障礙與效能</div>
  <h1>Web Components 的無障礙設計（Accessibility）</h1>
  <p>無障礙設計不是事後的補丁，而是 Web Components 設計的核心部分。Shadow DOM 的封裝性對螢幕閱讀器和輔助技術帶來了特殊挑戰，本章深入探討正確的 ARIA 設定方式、鍵盤導航模式，以及如何確保元件對所有使用者都可及。</p>
  <div class="chapter-tags">
    <span class="tag tag-interview">面試重點</span>
    <span class="tag tag-advanced">進階</span>
  </div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch24-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">Accessibility Tree 與 Shadow DOM 對其造成的影響</span>
    </a>
    <a class="catalog-item" href="#ch24-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">Custom Elements 中的 ARIA Role、State 與 Property 設定</span>
    </a>
    <a class="catalog-item" href="#ch24-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">ElementInternals.ariaRole — 設定 ARIA 的正確方式</span>
    </a>
    <a class="catalog-item" href="#ch24-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">鍵盤導航模式：Roving Tabindex 與 Focus Trap</span>
    </a>
    <a class="catalog-item" href="#ch24-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">跨越 Shadow Boundary 的 Accessible Name 計算</span>
    </a>
    <a class="catalog-item" href="#ch24-interview">
      <span class="catalog-item-num">06</span>
      <span class="catalog-item-title">面試題：Shadow DOM 如何影響螢幕閱讀器的行為？</span>
    </a>
  </div>
</div>

<h2 id="ch24-s01">Accessibility Tree 與 Shadow DOM 對其造成的影響</h2>

<p>瀏覽器會從 DOM 建立一棵 <strong>Accessibility Tree</strong>（無障礙樹），螢幕閱讀器和其他輔助技術透過這棵樹了解頁面結構。Shadow DOM 的存在讓這棵樹的建立變得複雜：</p>

<book-code-block language="text" label="概念圖 — DOM vs Accessibility Tree 與 Shadow DOM">
DOM 結構：                          Accessibility Tree：
&lt;my-button&gt;                         [role="button"] "提交表單"
  #shadow-root                         └ (Shadow DOM 內容被展平)
    &lt;button role="button"&gt;
      提交表單
    &lt;/button&gt;

關鍵規則：
1. Shadow DOM 對 Accessibility Tree 是「透明」的
   → 螢幕閱讀器看到的是展平後的結果，不感知 Shadow Boundary

2. 但 aria-labelledby / aria-describedby 的 IDREF 不能跨越 Shadow Boundary
   → 這是最常見的 a11y 陷阱！

3. Custom Element 本身（host element）也是 Accessibility Tree 的節點
   → 必須為 host element 設定正確的 role

4. 若 Shadow DOM 中有可聚焦元素，Tab 順序仍然有效
   → 但需要正確設定 tabindex 和 delegatesFocus
</book-code-block>

<book-code-block language="typescript" label="TypeScript — 偵測 Accessibility Tree 的問題">
// 在 Chrome DevTools 中，可以用 accessibilityTree API 檢查
// 但在測試中，建議使用 axe-core

// npm install --save-dev axe-core @axe-core/webdriverjs

// 使用 @open-wc/testing 的無障礙斷言（基於 axe-core）
import { expect, fixture, html } from '@open-wc/testing'
import './my-button.js'

it('應通過 axe 無障礙稽核', async () =&gt; {
  const el = await fixture(html\`
    &lt;my-button&gt;提交表單&lt;/my-button&gt;
  \`)
  // 自動執行 axe-core 規則
  await expect(el).to.be.accessible()
})

// 更精細的 axe 設定
it('通過 WCAG 2.1 AA 規則', async () =&gt; {
  const el = await fixture(html\`
    &lt;custom-dialog open title="確認刪除"&gt;
      &lt;p&gt;您確定要刪除此項目嗎？&lt;/p&gt;
      &lt;button slot="actions"&gt;取消&lt;/button&gt;
      &lt;button slot="actions" variant="danger"&gt;刪除&lt;/button&gt;
    &lt;/custom-dialog&gt;
  \`)

  await expect(el).to.be.accessible({
    rules: {
      // 可以停用特定規則或調整嚴重程度
      'color-contrast': { enabled: true },
      'focus-trap-testing': { enabled: false }, // 特殊環境下停用
    },
  })
})
</book-code-block>

<h2 id="ch24-s02">Custom Elements 中的 ARIA Role、State 與 Property 設定</h2>

<p>為 Custom Element 設定正確的 ARIA 資訊有兩種方式：直接設定 host element 的 attribute，或使用 ElementInternals（推薦）。</p>

<book-code-block language="typescript" label="TypeScript — 各種互動元件的 ARIA 模式">
// ===== 1. 開關按鈕（Toggle Button）=====
class ToggleButton extends HTMLElement {
  static formAssociated = true
  private _internals: ElementInternals
  private _pressed = false

  constructor() {
    super()
    this._internals = this.attachInternals()
    // 使用 ElementInternals 設定 ARIA（比直接設 attribute 更正確）
    this._internals.role = 'button'
    this._internals.ariaPressed = 'false'
    this.attachShadow({ mode: 'open' })
  }

  connectedCallback() {
    // tabindex 讓元素可聚焦
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0')
    }
    this.addEventListener('click', this._handleClick)
    this.addEventListener('keydown', this._handleKeydown)
    this._render()
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._handleClick)
    this.removeEventListener('keydown', this._handleKeydown)
  }

  get pressed(): boolean { return this._pressed }
  set pressed(value: boolean) {
    this._pressed = value
    // 更新 ARIA 狀態
    this._internals.ariaPressed = String(value)
    this._render()
  }

  private _handleClick = () =&gt; {
    this.pressed = !this._pressed
    this.dispatchEvent(new Event('change', { bubbles: true }))
  }

  private _handleKeydown = (e: KeyboardEvent) =&gt; {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      this._handleClick()
    }
  }

  private _render() {
    this.shadowRoot!.innerHTML = \`
      &lt;style&gt;
        :host { display: inline-block; cursor: pointer; }
        :host(:focus-visible) { outline: 2px solid #4299e1; outline-offset: 2px; border-radius: 4px; }
        .toggle { padding: 8px 16px; border-radius: 6px; user-select: none;
                  background: \${this._pressed ? '#3b82f6' : '#e5e7eb'};
                  color: \${this._pressed ? '#fff' : '#374151'}; }
      &lt;/style&gt;
      &lt;div class="toggle"&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/div&gt;
    \`
  }
}

customElements.define('toggle-button', ToggleButton)

// ===== 2. 進度條（Progressbar）=====
class ProgressBar extends HTMLElement {
  static get observedAttributes() { return ['value', 'max', 'label'] }

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  attributeChangedCallback() { this._render() }
  connectedCallback() { this._render() }

  private _render() {
    const value = parseInt(this.getAttribute('value') ?? '0')
    const max = parseInt(this.getAttribute('max') ?? '100')
    const label = this.getAttribute('label') ?? '進度'
    const percent = Math.min(100, Math.max(0, (value / max) * 100))

    // 直接在 host element 上設定 ARIA（也是有效方式）
    this.setAttribute('role', 'progressbar')
    this.setAttribute('aria-valuenow', String(value))
    this.setAttribute('aria-valuemin', '0')
    this.setAttribute('aria-valuemax', String(max))
    this.setAttribute('aria-label', label)

    this.shadowRoot!.innerHTML = \`
      &lt;style&gt;
        :host { display: block; }
        .track { background: #e5e7eb; border-radius: 9999px; height: 8px; overflow: hidden; }
        .fill { background: #3b82f6; height: 100%; border-radius: 9999px;
                width: \${percent}%; transition: width 0.3s ease; }
      &lt;/style&gt;
      &lt;div class="track" aria-hidden="true"&gt;
        &lt;div class="fill"&gt;&lt;/div&gt;
      &lt;/div&gt;
    \`
  }
}

customElements.define('progress-bar', ProgressBar)
</book-code-block>

<h2 id="ch24-s03">ElementInternals.ariaRole — 設定 ARIA 的正確方式</h2>

<p>ElementInternals 提供的 ARIA mixin 是設定 Custom Element 語意的推薦方式，優於直接操作 attributes，因為它不會被外部 attribute 覆蓋（「strong host author semantics」問題的解法）。</p>

<book-code-block language="typescript" label="TypeScript — ElementInternals ARIA Properties 完整參考">
class AccessibleWidget extends HTMLElement {
  static formAssociated = true
  private _internals: ElementInternals

  constructor() {
    super()
    this._internals = this.attachInternals()

    // ===== ARIA Role（設定元素的語意角色）=====
    this._internals.role = 'listbox'
    // 常用 role：
    // 'button', 'checkbox', 'combobox', 'dialog', 'grid', 'gridcell',
    // 'listbox', 'menu', 'menuitem', 'option', 'progressbar', 'radio',
    // 'radiogroup', 'scrollbar', 'searchbox', 'separator', 'slider',
    // 'spinbutton', 'switch', 'tab', 'tablist', 'tabpanel',
    // 'textbox', 'timer', 'tooltip', 'tree', 'treeitem'

    // ===== ARIA States（動態狀態）=====
    this._internals.ariaChecked = 'false'        // checkbox, radio, switch
    this._internals.ariaExpanded = 'false'        // accordion, combobox, menu
    this._internals.ariaHidden = null             // null = 不設定（繼承預設）
    this._internals.ariaInvalid = 'false'         // 表單驗證狀態
    this._internals.ariaPressed = 'false'         // toggle button
    this._internals.ariaSelected = 'false'        // option, tab
    this._internals.ariaDisabled = 'false'        // 停用狀態

    // ===== ARIA Properties（較穩定的描述性屬性）=====
    this._internals.ariaLabel = '選項清單'        // 覆蓋文字內容的標籤
    // 注意：ariaLabelledby 和 ariaDescribedby 不能跨 Shadow Boundary 引用 ID
    // 在 Shadow DOM 內部的元素可以互相引用
    this._internals.ariaMultiSelectable = 'true'  // listbox, grid
    this._internals.ariaOrientation = 'vertical'  // listbox, menu
    this._internals.ariaValueNow = '50'           // progressbar, slider
    this._internals.ariaValueMin = '0'
    this._internals.ariaValueMax = '100'
    this._internals.ariaValueText = '50%'         // 人類可讀的數值描述

    this.attachShadow({ mode: 'open' })
  }

  // ElementInternals 的 ARIA 設定可以被使用者的 attribute 覆蓋
  // 這允許 &lt;my-listbox aria-label="自訂標籤"&gt; 覆蓋預設值
  // 這就是「外部語意可覆蓋內建語意」的設計哲學

  connectedCallback() {
    this._render()
  }

  updateState(expanded: boolean, activeIndex: number) {
    this._internals.ariaExpanded = String(expanded)
    // 其他狀態更新...
    this._render()
  }

  private _render() {
    // 渲染 Shadow DOM
  }
}

customElements.define('accessible-widget', AccessibleWidget)
</book-code-block>

<h2 id="ch24-s04">鍵盤導航模式：Roving Tabindex 與 Focus Trap</h2>

<p>複合元件（如選項清單、選項卡、選單）需要實作正確的鍵盤導航，有兩種主要模式：Roving Tabindex 和 Focus Trap。</p>

<book-code-block language="typescript" label="TypeScript — Roving Tabindex 實作（方向鍵導航）">
// roving-tabindex.ts
// 適用於：listbox、radiogroup、toolbar、tab list
// 模式：只有一個元素在 tab 序列中（tabindex=0），其他為 -1
// 方向鍵切換焦點元素

class OptionList extends HTMLElement {
  private _options: HTMLElement[] = []
  private _activeIndex = 0

  static get observedAttributes() { return ['aria-activedescendant'] }

  connectedCallback() {
    this._internals = (this as any).attachInternals?.() ?? null
    if (this._internals) {
      this._internals.role = 'listbox'
    } else {
      this.setAttribute('role', 'listbox')
    }

    this.setAttribute('tabindex', '0') // host 可接受 tab 焦點

    this.addEventListener('keydown', this._handleKeydown)
    this.addEventListener('click', this._handleClick)
    this._initOptions()
  }

  disconnectedCallback() {
    this.removeEventListener('keydown', this._handleKeydown)
    this.removeEventListener('click', this._handleClick)
  }

  private _internals: ElementInternals | null = null

  private _initOptions() {
    // 找到所有 option 子元素
    this._options = Array.from(this.querySelectorAll('[role="option"]')) as HTMLElement[]
    this._options.forEach((opt, i) =&gt; {
      opt.setAttribute('tabindex', i === 0 ? '0' : '-1')
    })
    this._updateActiveDescendant()
  }

  private _handleKeydown = (e: KeyboardEvent) =&gt; {
    const len = this._options.length
    if (len === 0) return

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault()
        this._setActive((this._activeIndex + 1) % len)
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault()
        this._setActive((this._activeIndex - 1 + len) % len)
        break
      case 'Home':
        e.preventDefault()
        this._setActive(0)
        break
      case 'End':
        e.preventDefault()
        this._setActive(len - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        this._selectActive()
        break
    }
  }

  private _handleClick = (e: Event) =&gt; {
    const option = (e.target as HTMLElement).closest('[role="option"]') as HTMLElement
    if (!option) return
    const index = this._options.indexOf(option)
    if (index !== -1) {
      this._setActive(index)
      this._selectActive()
    }
  }

  private _setActive(index: number) {
    // 將舊的 active 設為 tabindex=-1
    this._options[this._activeIndex]?.setAttribute('tabindex', '-1')
    this._options[this._activeIndex]?.setAttribute('aria-selected', 'false')

    this._activeIndex = index

    // 將新的 active 設為 tabindex=0 並聚焦
    const activeOption = this._options[this._activeIndex]
    activeOption?.setAttribute('tabindex', '0')
    activeOption?.focus()

    this._updateActiveDescendant()
  }

  private _selectActive() {
    const option = this._options[this._activeIndex]
    if (!option) return
    option.setAttribute('aria-selected', 'true')
    this.dispatchEvent(new CustomEvent('option-select', {
      detail: { value: option.dataset.value, index: this._activeIndex },
      bubbles: true,
    }))
  }

  private _updateActiveDescendant() {
    const activeOption = this._options[this._activeIndex]
    if (activeOption) {
      this.setAttribute('aria-activedescendant', activeOption.id || '')
    }
  }
}

customElements.define('option-list', OptionList)
</book-code-block>

<book-code-block language="typescript" label="TypeScript — Focus Trap 實作（Modal/Dialog）">
// focus-trap.ts
// 適用於：modal dialog, dropdown menu（開啟時）
// 模式：Tab/Shift+Tab 在容器內的可聚焦元素間循環，不逃逸到外部

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'audio[controls]',
  'video[controls]',
  'details &gt; summary',
].join(', ')

export class FocusTrap {
  private _container: Element
  private _lastFocused: HTMLElement | null = null

  constructor(container: Element) {
    this._container = container
  }

  activate() {
    // 記住觸發前的焦點位置
    this._lastFocused = document.activeElement as HTMLElement
    // 聚焦 container 中的第一個可聚焦元素
    this._getFirstFocusable()?.focus()
    this._container.addEventListener('keydown', this._handleKeydown)
  }

  deactivate() {
    this._container.removeEventListener('keydown', this._handleKeydown)
    // 還原焦點到觸發前的元素
    this._lastFocused?.focus()
  }

  private _getFocusableElements(): HTMLElement[] {
    // 需要處理 Shadow DOM 中的可聚焦元素
    const results: HTMLElement[] = []
    const shadowRoot = this._container instanceof HTMLElement
      ? this._container.shadowRoot
      : null

    const searchRoot = shadowRoot ?? this._container
    results.push(...Array.from(searchRoot.querySelectorAll&lt;HTMLElement&gt;(FOCUSABLE_SELECTORS)))

    return results.filter(el =&gt; {
      return !el.hidden &amp;&amp; el.offsetParent !== null  // 過濾不可見元素
    })
  }

  private _getFirstFocusable(): HTMLElement | null {
    return this._getFocusableElements()[0] ?? null
  }

  private _getLastFocusable(): HTMLElement | null {
    const all = this._getFocusableElements()
    return all[all.length - 1] ?? null
  }

  private _handleKeydown = (e: KeyboardEvent) =&gt; {
    if (e.key !== 'Tab') return

    const focusables = this._getFocusableElements()
    if (focusables.length === 0) { e.preventDefault(); return }

    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = (this._container.shadowRoot?.activeElement ?? document.activeElement) as HTMLElement

    if (e.shiftKey) {
      // Shift+Tab：往前
      if (active === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      // Tab：往後
      if (active === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }
}

// ===== 在 Custom Element 中使用 Focus Trap =====
class CustomDialog extends HTMLElement {
  private _focusTrap?: FocusTrap
  private _isOpen = false

  static get observedAttributes() { return ['open'] }

  attributeChangedCallback(name: string, _old: string | null, newVal: string | null) {
    if (name === 'open') {
      if (newVal !== null) {
        this._open()
      } else {
        this._close()
      }
    }
  }

  connectedCallback() {
    this._internals?.role ?? this.setAttribute('role', 'dialog')
    this.setAttribute('aria-modal', 'true')
    this.attachShadow({ mode: 'open' })
    this._render()
    this._focusTrap = new FocusTrap(this)
  }

  private _internals: any = null

  private _open() {
    this._isOpen = true
    this.removeAttribute('hidden')
    this._focusTrap?.activate()
    // 按 Escape 關閉
    document.addEventListener('keydown', this._handleEscape)
  }

  private _close() {
    this._isOpen = false
    this.setAttribute('hidden', '')
    this._focusTrap?.deactivate()
    document.removeEventListener('keydown', this._handleEscape)
    this.dispatchEvent(new Event('close', { bubbles: true }))
  }

  private _handleEscape = (e: KeyboardEvent) =&gt; {
    if (e.key === 'Escape' &amp;&amp; this._isOpen) {
      this.removeAttribute('open')
    }
  }

  private _render() {
    const title = this.getAttribute('title') ?? ''
    this.shadowRoot!.innerHTML = \`
      &lt;style&gt;
        :host { position: fixed; inset: 0; display: grid; place-items: center;
                background: rgba(0,0,0,0.5); z-index: 1000; }
        :host([hidden]) { display: none; }
        .dialog { background: white; border-radius: 12px; padding: 24px;
                  max-width: 480px; width: 90vw; box-shadow: 0 25px 50px rgba(0,0,0,0.25); }
        h2 { margin: 0 0 16px; font-size: 1.25rem; }
        .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 24px; }
      &lt;/style&gt;
      &lt;div class="dialog" role="document"&gt;
        &lt;h2 id="dialog-title"&gt;\${title}&lt;/h2&gt;
        &lt;slot&gt;&lt;/slot&gt;
        &lt;div class="actions"&gt;
          &lt;slot name="actions"&gt;&lt;/slot&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    \`

    // 用 aria-labelledby 指向 Shadow DOM 內的標題
    // 注意：這個 ID 在 Shadow DOM 內部，沒有跨 boundary 問題
    this.setAttribute('aria-labelledby', 'dialog-title')
  }
}

customElements.define('custom-dialog', CustomDialog)
</book-code-block>

<h2 id="ch24-s05">跨越 Shadow Boundary 的 Accessible Name 計算</h2>

<p>計算元素的「Accessible Name」時，瀏覽器有一套複雜的演算法（Accessible Name and Description Computation，ANDC）。Shadow DOM 對這個計算有重要影響：</p>

<book-code-block language="typescript" label="TypeScript — Accessible Name 的正確設定模式">
// 問題：aria-labelledby 的 IDREF 不能跨越 Shadow Boundary

// ❌ 錯誤：這個 label-for-input 在 light DOM，
//    input 在 Shadow DOM 內，無法關聯
class BrokenInput extends HTMLElement {
  connectedCallback() {
    this.innerHTML = \`&lt;label id="my-label"&gt;姓名&lt;/label&gt;\`
    this.attachShadow({ mode: 'open' })
    // 這裡的 aria-labelledby 嘗試引用外部的 'my-label'——這是錯的！
    this.shadowRoot!.innerHTML = \`
      &lt;input aria-labelledby="my-label" /&gt;
    \`
  }
}

// ✅ 正確方案 1：在 Shadow DOM 內部建立完整的 label + input 關聯
class CorrectInput1 extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
    const label = this.getAttribute('label') ?? ''
    this.shadowRoot!.innerHTML = \`
      &lt;!-- label 和 input 都在同一個 Shadow Root 內，ID 可以關聯 --&gt;
      &lt;label for="the-input"&gt;\${label}&lt;/label&gt;
      &lt;input id="the-input" type="text" /&gt;
    \`
  }
}

// ✅ 正確方案 2：用 aria-label 直接提供名稱（不需要 IDREF）
class CorrectInput2 extends HTMLElement {
  static get observedAttributes() { return ['label'] }

  connectedCallback() {
    this.attachShadow({ mode: 'open' })
    this._render()
  }

  attributeChangedCallback() { this._render() }

  private _render() {
    const label = this.getAttribute('label') ?? ''
    this.shadowRoot!.innerHTML = \`
      &lt;!-- 直接用 aria-label（字串，不是 IDREF）--&gt;
      &lt;input type="text" aria-label="\${label}" /&gt;
    \`
  }
}

// ✅ 正確方案 3：使用 ElementInternals 的 ariaLabel 設定在 host element
class CorrectInput3 extends HTMLElement {
  static formAssociated = true
  private _internals: ElementInternals

  constructor() {
    super()
    this._internals = this.attachInternals()
    this.attachShadow({ mode: 'open' })
  }

  static get observedAttributes() { return ['label'] }

  attributeChangedCallback(name: string, _old: string | null, newVal: string | null) {
    if (name === 'label' &amp;&amp; newVal !== null) {
      // 設定在 host element 上（ElementInternals ARIA）
      this._internals.ariaLabel = newVal
    }
  }
}

// ===== 正確使用 delegatesFocus =====
class FocusDelegatingInput extends HTMLElement {
  connectedCallback() {
    // delegatesFocus: true 讓外部的 label 點擊可以聚焦到 Shadow DOM 內的 input
    this.attachShadow({ mode: 'open', delegatesFocus: true })
    this.shadowRoot!.innerHTML = \`&lt;input type="text" placeholder="輸入..." /&gt;\`
  }
}

customElements.define('correct-input-1', CorrectInput1)
customElements.define('correct-input-2', CorrectInput2)
customElements.define('correct-input-3', CorrectInput3)
customElements.define('focus-delegating-input', FocusDelegatingInput)
</book-code-block>

<h2 id="ch24-interview">面試題：Shadow DOM 如何影響螢幕閱讀器的行為？</h2>

<div class="interview-qa">
  <p><strong>Q：Shadow DOM 的封裝對無障礙設計有什麼影響？如果你要建立一個完全無障礙的 Custom Dialog 元件，需要注意哪些事項？</strong></p>

  <p><strong>A（分層回答）：</strong></p>

  <p><strong>Shadow DOM 與 Accessibility Tree 的關係：</strong>Shadow DOM 對 Accessibility Tree 是「透明」的，螢幕閱讀器能看到 Shadow DOM 內的內容。但有一個重要限制：<code>aria-labelledby</code> 和 <code>aria-describedby</code> 的 IDREF（ID 引用）無法跨越 Shadow Boundary，這是最常見的 a11y 陷阱。</p>

  <p><strong>建立無障礙 Dialog 的要點：</strong></p>
  <ol>
    <li>host element 設定 <code>role="dialog"</code> 和 <code>aria-modal="true"</code></li>
    <li>用 <code>aria-labelledby</code> 指向 Shadow DOM <em>內部</em>的標題元素（不能跨 boundary）</li>
    <li>開啟時啟動 Focus Trap（Tab/Shift+Tab 在 dialog 內循環）</li>
    <li>按 Escape 鍵關閉，並還原焦點到開啟前的元素</li>
    <li>Dialog 外的內容標記為 <code>aria-hidden="true"</code>，防止螢幕閱讀器漫遊</li>
    <li>使用 <code>delegatesFocus: true</code> 確保 host element 聚焦時正確代理到內部</li>
  </ol>

  <p><strong>驗證工具：</strong>使用 <code>@open-wc/testing</code> 的 <code>expect(el).to.be.accessible()</code>（基於 axe-core），以及 Chrome DevTools 的 Accessibility Tree 面板手動驗證。</p>
</div>

<book-code-block language="typescript" label="TypeScript — axe-core 整合測試範例">
// tests/accessibility.test.ts
import { expect, fixture, html } from '@open-wc/testing'
import axe from 'axe-core'

// 測試整個頁面的無障礙性
async function runAxe(element: Element) {
  const results = await axe.run(element, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    },
  })
  return results
}

describe('無障礙稽核', () =&gt; {
  it('custom-dialog 應通過 WCAG 2.1 AA', async () =&gt; {
    const el = await fixture(html\`
      &lt;custom-dialog open title="刪除確認"&gt;
        &lt;p&gt;此操作不可復原，請確認是否繼續？&lt;/p&gt;
        &lt;button slot="actions"&gt;取消&lt;/button&gt;
        &lt;button slot="actions" variant="danger"&gt;確認刪除&lt;/button&gt;
      &lt;/custom-dialog&gt;
    \`)

    // @open-wc/testing 包裝的簡便方式
    await expect(el).to.be.accessible()
  })

  it('option-list 鍵盤導航應符合 WAI-ARIA Patterns', async () =&gt; {
    const el = await fixture(html\`
      &lt;option-list aria-label="水果選項"&gt;
        &lt;div role="option" id="opt1" data-value="apple"&gt;蘋果&lt;/div&gt;
        &lt;div role="option" id="opt2" data-value="banana"&gt;香蕉&lt;/div&gt;
        &lt;div role="option" id="opt3" data-value="cherry"&gt;櫻桃&lt;/div&gt;
      &lt;/option-list&gt;
    \`)

    await expect(el).to.be.accessible()

    // 驗證 ArrowDown 移動焦點
    el.focus()
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await new Promise(r =&gt; setTimeout(r, 0))

    const activeOpt = el.querySelector('[tabindex="0"]')
    expect(activeOpt?.id).to.equal('opt2')
  })
})
</book-code-block>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>Shadow DOM 對 Accessibility Tree 透明，但 IDREF（aria-labelledby）不能跨越 Shadow Boundary；使用 ElementInternals ARIA properties 設定語意，Roving Tabindex 管理複合元件導航，Focus Trap 管理模態視窗焦點，並以 axe-core 持續驗證。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch23">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">測試 Web Components</span>
    </a>
    <a class="footer-link" href="#ch25">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">效能最佳化與 Lazy Loading 策略</span>
    </a>
  </div>
</div>
`
