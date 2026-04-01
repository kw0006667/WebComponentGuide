export const metadata = {
  id: 9,
  part: 2,
  title: 'Events、組合模式與元件契約設計',
  tags: ['實用技巧', '面試重點'] as string[],
  sections: [
    { slug: 'ch09-s01', title: '設計元件的 API 介面：Attributes、Properties、Events、Slots 各司其職' },
    { slug: 'ch09-s02', title: 'Event Bubbling 與 composed: true — 穿越 Shadow Boundary' },
    { slug: 'ch09-s03', title: '在 Shadow Root 內實作 Event Delegation' },
    { slug: 'ch09-s04', title: 'Controller 模式：將邏輯與渲染分離' },
    { slug: 'ch09-s05', title: 'Mixin 模式實現共用行為（FocusMixin、DisabledMixin）' },
    { slug: 'ch09-interview', title: '面試題：兩個平行的 Web Components 之間要如何溝通？' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 09 · 第二部：TypeScript 優先的 Web Components 開發</div>
  <h1>Events、組合模式與元件契約設計</h1>
  <p>元件的公開 API 不只有 HTML attributes，還包含 Properties、Events 和 Slots，這四個面向共同構成了元件的「契約」。本章探討如何設計清晰、型別安全的元件 API，以及如何透過 Controller 模式和 Mixin 模式在多個元件之間複用邏輯。</p>
  <div class="chapter-tags">
    <span class="tag tag-tip">實用技巧</span>
    <span class="tag tag-interview">面試重點</span>
  </div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch09-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">設計元件的 API 介面：Attributes、Properties、Events、Slots 各司其職</span>
    </a>
    <a class="catalog-item" href="#ch09-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">Event Bubbling 與 composed: true — 穿越 Shadow Boundary</span>
    </a>
    <a class="catalog-item" href="#ch09-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">在 Shadow Root 內實作 Event Delegation</span>
    </a>
    <a class="catalog-item" href="#ch09-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">Controller 模式：將邏輯與渲染分離</span>
    </a>
    <a class="catalog-item" href="#ch09-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">Mixin 模式實現共用行為（FocusMixin、DisabledMixin）</span>
    </a>
    <a class="catalog-item" href="#ch09-interview">
      <span class="catalog-item-num">06</span>
      <span class="catalog-item-title">面試題：兩個平行的 Web Components 之間要如何溝通？</span>
    </a>
  </div>
</div>

<h2 id="ch09-s01">設計元件的 API 介面：Attributes、Properties、Events、Slots 各司其職</h2>

<p>設計 Web Component 的公開契約時，最容易犯的錯誤是把所有東西都塞進 attributes。正確的做法是依據資料的性質，選擇最適合的溝通管道。</p>

<h3>四種 API 管道的決策表</h3>

<table>
  <thead>
    <tr>
      <th>管道</th>
      <th>適合的資料類型</th>
      <th>方向</th>
      <th>典型用途</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Attribute</strong></td>
      <td>字串、布林旗標、簡單枚舉</td>
      <td>外部 → 元件</td>
      <td>disabled、variant="primary"、size="lg"</td>
    </tr>
    <tr>
      <td><strong>Property</strong></td>
      <td>複雜物件、陣列、函式、數字</td>
      <td>外部 → 元件</td>
      <td>items={[...]}、config={...}</td>
    </tr>
    <tr>
      <td><strong>Event</strong></td>
      <td>任何可序列化資料</td>
      <td>元件 → 外部</td>
      <td>change、submit、select</td>
    </tr>
    <tr>
      <td><strong>Slot</strong></td>
      <td>HTML 結構、子元件</td>
      <td>外部 → 元件（DOM 投影）</td>
      <td>label、icon、footer 內容</td>
    </tr>
  </tbody>
</table>

<p>以下是一個設計良好的 <code>&lt;app-select&gt;</code> 元件，展示這四個管道如何協同運作：</p>

<book-code-block language="typescript" label="元件契約設計範例">
// 強型別的 Event Payload
interface SelectChangeDetail {
  value: string
  label: string
  index: number
}

// Option 物件使用 Property 而非 Attribute 傳遞
interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

class AppSelect extends HTMLElement {
  static observedAttributes = ['placeholder', 'disabled', 'value']

  // 複雜資料使用 Property
  private _options: SelectOption[] = []

  get options(): SelectOption[] {
    return this._options
  }
  set options(val: SelectOption[]) {
    this._options = val
    this.render()
  }

  // 簡單字串使用 Attribute
  get placeholder(): string {
    return this.getAttribute('placeholder') ?? '請選擇...'
  }
  set placeholder(val: string) {
    this.setAttribute('placeholder', val)
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled')
  }
  set disabled(val: boolean) {
    this.toggleAttribute('disabled', val)
  }

  // Event 傳遞變更結果
  private emitChange(option: SelectOption, index: number) {
    this.dispatchEvent(
      new CustomEvent&lt;SelectChangeDetail&gt;('change', {
        detail: { value: option.value, label: option.label, index },
        bubbles: true,
        composed: true,
      })
    )
  }

  // Slot 讓呼叫方提供自訂的 trigger 元素
  private render() {
    if (!this.shadowRoot) return
    this.shadowRoot.innerHTML = \`
      &lt;slot name="trigger"&gt;&lt;button&gt;\${this.placeholder}&lt;/button&gt;&lt;/slot&gt;
      &lt;ul role="listbox"&gt;
        \${this._options.map((opt, i) =&gt; \`
          &lt;li role="option" data-index="\${i}" \${opt.disabled ? 'aria-disabled="true"' : ''}&gt;
            \${opt.label}
          &lt;/li&gt;
        \`).join('')}
      &lt;/ul&gt;
    \`
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' })
    this.render()
  }
}
</book-code-block>

<book-callout variant="tip" title="黃金法則">
  <p>Attribute 是 HTML 的語言，適合靜態設定與 CSS 選擇器的連動。Property 是 JavaScript 的語言，適合動態資料與複雜物件。永遠不要把陣列或物件序列化成 attribute 字串——這會造成效能問題，而且型別資訊完全消失。</p>
</book-callout>

<h2 id="ch09-s02">Event Bubbling 與 composed: true — 穿越 Shadow Boundary</h2>

<p>Shadow DOM 對事件系統產生了重大影響：預設情況下，在 Shadow Root 內部發出的事件，不會穿越 Shadow Boundary 到達外部文件。若要讓事件對外可見，必須同時設定 <code>bubbles: true</code> 和 <code>composed: true</code>。</p>

<h3>三種 composed 行為的對比</h3>

<book-code-block language="typescript" label="Event Bubbling 穿越 Shadow Boundary">
class DeepNestedButton extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })
    const btn = document.createElement('button')
    btn.textContent = '點我'
    shadow.appendChild(btn)

    btn.addEventListener('click', () => {
      // 1. 僅在 Shadow Root 內冒泡，外部聽不到
      this.dispatchEvent(new CustomEvent('internal-click', {
        bubbles: true,
        composed: false,   // 不穿越 shadow boundary
      }))

      // 2. 只在目標元素觸發，不冒泡也不穿越
      this.dispatchEvent(new CustomEvent('silent-click', {
        bubbles: false,
        composed: false,
      }))

      // 3. 冒泡並穿越所有 Shadow Boundary，外部可監聽
      this.dispatchEvent(new CustomEvent('app-click', {
        bubbles: true,
        composed: true,   // 這才是外部能接收到的版本
        detail: { timestamp: Date.now() },
      }))
    })
  }
}

// 外部使用端
document.addEventListener('app-click', (e) =&gt; {
  // e.target 會被重定向（retargeted）為 deep-nested-button，
  // 而非內部的 button
  console.log(e.target) // =&gt; &lt;deep-nested-button&gt;
  console.log((e as CustomEvent).detail.timestamp)
})

// 若要取得實際的原始目標，需使用 composedPath()
document.addEventListener('app-click', (e) =&gt; {
  const path = e.composedPath()
  // path[0] 才是真正的 button 元素（如果有存取權的話）
  console.log(path) // =&gt; [button, shadow-root, deep-nested-button, body, ...]
})
</book-code-block>

<book-callout variant="warning" title="Event Retargeting 的隱性陷阱">
  <p>當事件穿越 Shadow Boundary 時，<code>event.target</code> 會被自動重定向為 Shadow Host 元素，而非實際觸發事件的內部元素。這個機制保護了封裝性，但若你需要精確的來源資訊，必須使用 <code>event.composedPath()</code>——前提是你有對應的 Shadow Root 存取權限。</p>
</book-callout>

<h2 id="ch09-s03">在 Shadow Root 內實作 Event Delegation</h2>

<p>Event Delegation 是一種將事件監聽器統一綁定在祖先元素上，而非每個子元素各自綁定的技術。在 Shadow DOM 內部，這個模式同樣有效，且特別適合列表、選單等有大量重複子項目的元件。</p>

<book-code-block language="typescript" label="Shadow Root 內的 Event Delegation">
class MenuList extends HTMLElement {
  private items: Array&lt;{ id: string; label: string; danger?: boolean }&gt; = []

  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })

    // 只在 shadow root 上掛一個監聽器，而非每個 li 各掛一個
    shadow.addEventListener('click', this.handleClick.bind(this))
    shadow.addEventListener('keydown', this.handleKeydown.bind(this))

    this.render()
  }

  disconnectedCallback() {
    // 因為監聽器掛在 shadow，元件移除時自動清理
    // 若是掛在外部 document 則需手動移除
  }

  private handleClick(e: Event) {
    const target = e.target as HTMLElement
    // 使用 closest() 來找到最近的 [data-item-id]
    const item = target.closest('[data-item-id]') as HTMLElement | null
    if (!item) return

    const itemId = item.dataset.itemId!
    const isDanger = item.hasAttribute('data-danger')

    this.dispatchEvent(
      new CustomEvent('menu-select', {
        detail: { id: itemId, danger: isDanger },
        bubbles: true,
        composed: true,
      })
    )
  }

  private handleKeydown(e: KeyboardEvent) {
    const target = e.target as HTMLElement
    if (e.key === 'Enter' || e.key === ' ') {
      // 將 Enter/Space 轉換為點擊語義
      target.click()
      e.preventDefault()
    }

    // 方向鍵導航
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const items = Array.from(
        this.shadowRoot!.querySelectorAll&lt;HTMLElement&gt;('[data-item-id]')
      )
      const current = items.indexOf(target)
      const next = e.key === 'ArrowDown'
        ? Math.min(current + 1, items.length - 1)
        : Math.max(current - 1, 0)
      items[next]?.focus()
      e.preventDefault()
    }
  }

  private render() {
    if (!this.shadowRoot) return
    this.shadowRoot.innerHTML = \`
      &lt;style&gt;
        ul { list-style: none; margin: 0; padding: 0; }
        li { padding: 8px 16px; cursor: pointer; }
        li[data-danger] { color: var(--color-danger, red); }
        li:focus { outline: 2px solid blue; }
      &lt;/style&gt;
      &lt;ul role="menu"&gt;
        \${this.items.map(item =&gt; \`
          &lt;li role="menuitem"
              tabindex="-1"
              data-item-id="\${item.id}"
              \${item.danger ? 'data-danger' : ''}&gt;
            \${item.label}
          &lt;/li&gt;
        \`).join('')}
      &lt;/ul&gt;
    \`
    // 第一個項目可聚焦
    const first = this.shadowRoot.querySelector&lt;HTMLElement&gt;('[data-item-id]')
    first?.setAttribute('tabindex', '0')
  }
}

customElements.define('menu-list', MenuList)
</book-code-block>

<h2 id="ch09-s04">Controller 模式：將邏輯與渲染分離</h2>

<p>隨著元件邏輯越來越複雜，把所有程式碼都放在 class 裡會變得難以維護。Controller 模式（也就是 Lit 的 Reactive Controller 的原型）將可複用的邏輯抽取到獨立的類別中，元件只負責渲染，Controller 負責狀態與副作用。</p>

<book-code-block language="typescript" label="Controller 模式完整實作">
// Controller 的宿主介面 — 任何實作此介面的元件都能使用 Controller
interface ControllerHost {
  addController(controller: Controller): void
  removeController(controller: Controller): void
  requestUpdate(): void
  readonly isConnected: boolean
}

// Controller 的生命週期介面
interface Controller {
  hostConnected?(): void
  hostDisconnected?(): void
  hostUpdate?(): void
  hostUpdated?(): void
}

// 基礎元件混入 ControllerHost 能力
class BaseElement extends HTMLElement implements ControllerHost {
  private _controllers = new Set&lt;Controller&gt;()
  private _updatePending = false

  addController(controller: Controller) {
    this._controllers.add(controller)
    if (this.isConnected) controller.hostConnected?.()
  }

  removeController(controller: Controller) {
    this._controllers.delete(controller)
  }

  requestUpdate() {
    if (this._updatePending) return
    this._updatePending = true
    Promise.resolve().then(() =&gt; {
      this._updatePending = false
      for (const ctrl of this._controllers) ctrl.hostUpdate?.()
      this.render()
      for (const ctrl of this._controllers) ctrl.hostUpdated?.()
    })
  }

  connectedCallback() {
    for (const ctrl of this._controllers) ctrl.hostConnected?.()
    this.render()
  }

  disconnectedCallback() {
    for (const ctrl of this._controllers) ctrl.hostDisconnected?.()
  }

  protected render(): void {}
}

// --- 可複用的 FetchController ---
class FetchController&lt;T&gt; implements Controller {
  private host: ControllerHost
  private abortController?: AbortController

  data: T | null = null
  loading = false
  error: Error | null = null

  constructor(host: ControllerHost) {
    this.host = host
    host.addController(this)
  }

  async fetch(url: string): Promise&lt;void&gt; {
    this.abortController?.abort()
    this.abortController = new AbortController()

    this.loading = true
    this.error = null
    this.host.requestUpdate()

    try {
      const res = await fetch(url, { signal: this.abortController.signal })
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`)
      this.data = await res.json() as T
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        this.error = e as Error
      }
    } finally {
      this.loading = false
      this.host.requestUpdate()
    }
  }

  hostDisconnected() {
    // 元件卸載時自動取消請求，防止記憶體洩漏
    this.abortController?.abort()
  }
}

// 使用 FetchController 的元件
interface User { id: number; name: string; email: string }

class UserProfile extends BaseElement {
  private fetch = new FetchController&lt;User&gt;(this)

  static observedAttributes = ['user-id']

  attributeChangedCallback(name: string, _: string | null, newVal: string | null) {
    if (name === 'user-id' &amp;&amp; newVal) {
      this.fetch.fetch(\`https://jsonplaceholder.typicode.com/users/\${newVal}\`)
    }
  }

  protected render() {
    const root = this.shadowRoot ?? this.attachShadow({ mode: 'open' })
    const { loading, error, data } = this.fetch

    if (loading) {
      root.innerHTML = '&lt;p&gt;載入中...&lt;/p&gt;'
    } else if (error) {
      root.innerHTML = \`&lt;p class="error"&gt;錯誤：\${error.message}&lt;/p&gt;\`
    } else if (data) {
      root.innerHTML = \`
        &lt;div class="profile"&gt;
          &lt;h2&gt;\${data.name}&lt;/h2&gt;
          &lt;p&gt;\${data.email}&lt;/p&gt;
        &lt;/div&gt;
      \`
    }
  }
}

customElements.define('user-profile', UserProfile)
</book-code-block>

<book-callout variant="tip" title="Controller 的本質">
  <p>Controller 模式的精妙之處在於：Controller 持有宿主的引用，宿主的生命週期方法會驅動 Controller 的生命週期。這個協議非常類似 React 的 custom hook，但完全基於物件導向，不需要任何執行時框架。Lit 的 Reactive Controller 就是這個模式的標準化版本。</p>
</book-callout>

<h2 id="ch09-s05">Mixin 模式實現共用行為（FocusMixin、DisabledMixin）</h2>

<p>Mixin 是一種將行為「橫切面」注入到 class 繼承鏈中的技術，特別適合「FocusManagement」和「Disabled 狀態管理」這類跨元件共用的能力。TypeScript 對 Mixin 的支援需要一點技巧。</p>

<book-code-block language="typescript" label="FocusMixin 與 DisabledMixin 完整實作">
// Mixin 的基礎型別
type Constructor&lt;T = HTMLElement&gt; = new (...args: any[]) =&gt; T

// FocusMixin：讓元件支援 focus/blur 委派到 shadow 內部元素
function FocusMixin&lt;TBase extends Constructor&gt;(Base: TBase) {
  abstract class FocusMixinClass extends Base {
    // 子類別必須實作：指向內部可聚焦元素
    abstract get focusTarget(): HTMLElement | null

    // 攔截外部的 focus() 呼叫，委派給內部元素
    override focus(options?: FocusOptions): void {
      this.focusTarget?.focus(options)
    }

    override blur(): void {
      this.focusTarget?.blur()
    }

    connectedCallback() {
      // @ts-expect-error - super.connectedCallback 可能不存在
      super.connectedCallback?.()

      // 讓元件本身不可直接聚焦，把 focus 委派到內部元素
      if (!this.hasAttribute('tabindex')) {
        this.setAttribute('tabindex', '-1')
      }

      const handleFocusIn = () =&gt; this.setAttribute('focused', '')
      const handleFocusOut = () =&gt; this.removeAttribute('focused')

      this.addEventListener('focusin', handleFocusIn)
      this.addEventListener('focusout', handleFocusOut)
    }
  }
  return FocusMixinClass
}

// DisabledMixin：標準化 disabled 行為
function DisabledMixin&lt;TBase extends Constructor&gt;(Base: TBase) {
  class DisabledMixinClass extends Base {
    static observedAttributes = [
      // 注意：需要合併父類別的 observedAttributes
      ...(Base as any).observedAttributes ?? [],
      'disabled',
    ]

    get disabled(): boolean {
      return this.hasAttribute('disabled')
    }

    set disabled(val: boolean) {
      this.toggleAttribute('disabled', val)
    }

    attributeChangedCallback(name: string, oldVal: string | null, newVal: string | null) {
      // @ts-expect-error
      super.attributeChangedCallback?.(name, oldVal, newVal)
      if (name === 'disabled') {
        this.handleDisabledChange(newVal !== null)
      }
    }

    protected handleDisabledChange(isDisabled: boolean) {
      // 同步 ARIA 狀態
      this.setAttribute('aria-disabled', String(isDisabled))

      // 如果有內部的可互動元素，一起禁用
      const internals = (this as any)._internals as ElementInternals | undefined
      if (internals) {
        // Form-associated custom element 使用 ElementInternals
        internals.ariaDisabled = String(isDisabled)
      }

      // 阻止事件在 disabled 狀態下發出
      if (isDisabled) {
        this.style.pointerEvents = 'none'
      } else {
        this.style.pointerEvents = ''
      }
    }
  }
  return DisabledMixinClass
}

// 組合多個 Mixin
class BaseComponent extends HTMLElement {}

abstract class InteractiveButton extends DisabledMixin(FocusMixin(BaseComponent)) {
  private _button?: HTMLButtonElement

  get focusTarget() {
    return this._button ?? null
  }

  connectedCallback() {
    super.connectedCallback()
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = \`
      &lt;button&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/button&gt;
    \`
    this._button = shadow.querySelector('button')!
    this._button.addEventListener('click', (e) =&gt; {
      if (this.disabled) {
        e.stopPropagation()
        return
      }
      this.dispatchEvent(new CustomEvent('action', { bubbles: true, composed: true }))
    })
  }
}

class PrimaryButton extends InteractiveButton {}
customElements.define('primary-button', PrimaryButton)
</book-code-block>

<book-callout variant="warning" title="Mixin 的 observedAttributes 合併問題">
  <p>TypeScript Mixin 中最容易忽略的陷阱是 <code>observedAttributes</code> 的合併。每個 Mixin 都可能有自己需要觀察的 attributes，若沒有正確地合併陣列，後加入的 Mixin 會覆蓋前一個的設定。範例中使用了展開運算符來確保所有層級的 attributes 都被收集。</p>
</book-callout>

<h2 id="ch09-interview">面試題：兩個平行的 Web Components 之間要如何溝通？</h2>

<p>這是一道考驗你對 Web Components 事件模型和架構思維的經典面試題。回答時應該依據具體情境分析，而非直接給出單一答案。</p>

<h3>方案一：共同祖先的 Event Bus（最推薦的輕量方案）</h3>

<book-code-block language="typescript" label="CustomEvent 上浮 + 下傳模式">
// 兩個兄弟元件之間的溝通
// sidebar-nav 選取項目後，main-content 更新內容

// sidebar-nav 發出事件
class SidebarNav extends HTMLElement {
  private selectItem(id: string) {
    // 使用 composed:true 讓事件可以穿越 Shadow Boundary
    this.dispatchEvent(new CustomEvent('nav-select', {
      detail: { id },
      bubbles: true,
      composed: true,
    }))
  }
}

// 共同祖先監聽，再通知 main-content
class AppShell extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = \`
      &lt;sidebar-nav&gt;&lt;/sidebar-nav&gt;
      &lt;main-content&gt;&lt;/main-content&gt;
    \`

    // 在 shadow root 層攔截事件
    shadow.addEventListener('nav-select', (e) =&gt; {
      const detail = (e as CustomEvent&lt;{ id: string }&gt;).detail
      const content = shadow.querySelector('main-content') as MainContent
      content.currentId = detail.id  // 透過 property 設定
    })
  }
}
</book-code-block>

<h3>方案二：強型別的 EventBus 單例</h3>

<book-code-block language="typescript" label="型別安全的全域 EventBus">
// 定義所有可能的事件 map
interface AppEvents {
  'user:login': { userId: string; name: string }
  'cart:update': { itemCount: number }
  'theme:change': { theme: 'light' | 'dark' }
}

class TypedEventBus {
  private emitter = new EventTarget()

  emit&lt;K extends keyof AppEvents&gt;(event: K, detail: AppEvents[K]) {
    this.emitter.dispatchEvent(
      new CustomEvent(event as string, { detail })
    )
  }

  on&lt;K extends keyof AppEvents&gt;(
    event: K,
    handler: (detail: AppEvents[K]) =&gt; void
  ): () =&gt; void {
    const wrapper = (e: Event) =&gt; handler((e as CustomEvent).detail)
    this.emitter.addEventListener(event as string, wrapper)
    // 回傳 unsubscribe 函式
    return () =&gt; this.emitter.removeEventListener(event as string, wrapper)
  }
}

// 全域單例
export const bus = new TypedEventBus()

// 在元件 A 中發出事件
class ComponentA extends HTMLElement {
  connectedCallback() {
    bus.emit('cart:update', { itemCount: 5 })
  }
}

// 在元件 B 中訂閱事件
class ComponentB extends HTMLElement {
  private unsubscribe?: () =&gt; void

  connectedCallback() {
    this.unsubscribe = bus.on('cart:update', ({ itemCount }) =&gt; {
      this.shadowRoot!.querySelector('.badge')!.textContent = String(itemCount)
    })
  }

  disconnectedCallback() {
    // 必須取消訂閱，否則造成記憶體洩漏
    this.unsubscribe?.()
  }
}
</book-code-block>

<h3>方案三：Lit Context API（適合深層嵌套）</h3>

<p>若兩個元件不在同一個直接祖先下，或者需要多個消費者共享同一份資料，可以使用 <code>@lit/context</code>（第 14 章詳述）。Context API 本質上是一個基於事件的依賴注入系統，不需要全域狀態管理工具。</p>

<h3>選擇策略總結</h3>

<table>
  <thead>
    <tr><th>情境</th><th>推薦方案</th></tr>
  </thead>
  <tbody>
    <tr><td>父子或兄弟元件，有共同祖先</td><td>CustomEvent bubbling + 祖先中繼</td></tr>
    <tr><td>跨頁面、無共同祖先的平行元件</td><td>TypedEventBus 單例</td></tr>
    <tr><td>深層嵌套、多消費者的共享資料</td><td>Lit Context API</td></tr>
    <tr><td>需要時間旅行、Devtools 的複雜狀態</td><td>Redux / Zustand + Web Component adapter</td></tr>
  </tbody>
</table>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>元件契約 = Attributes（靜態設定）+ Properties（動態資料）+ Events（輸出通知）+ Slots（結構投影）；這四個管道各司其職，才能設計出既強大又易於使用的 Web Component API。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch08">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">渲染策略 — 從 innerHTML 到 Virtual DOM</span>
    </a>
    <a class="footer-link" href="#ch10">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">Web Components 的樣式架構設計</span>
    </a>
  </div>
</div>
`
