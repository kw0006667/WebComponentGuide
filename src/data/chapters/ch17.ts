export const metadata = {
  id: 17,
  part: 4,
  title: '大規模狀態管理',
  tags: ['進階', '面試重點'] as string[],
  sections: [
    { slug: 'ch17-s01', title: '元件本地狀態 vs. 共享狀態 — 如何決定邊界' },
    { slug: 'ch17-s02', title: '帶有型別定義的 Event Bus 模式' },
    { slug: 'ch17-s03', title: '整合 Redux / Zustand / Signals 與 Web Components' },
    { slug: 'ch17-s04', title: 'TC39 Signals 提案對 Web Components 開發的意義' },
    { slug: 'ch17-s05', title: '在原生元件中使用 @preact/signals 的 Observable 模式' },
    { slug: 'ch17-interview', title: '面試題：如何在包含 50 個 Web Components 的應用中共享狀態？' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 17 · 第四部：進階模式與系統架構</div>
  <h1>大規模狀態管理</h1>
  <p>當應用程式從單一元件擴展到數十個互相協作的 Web Components，狀態管理的複雜度呈指數級增長。本章深入探討如何決定狀態邊界、建立型別安全的事件通訊層，並與主流狀態管理函式庫無縫整合。</p>
  <div class="chapter-tags">
    <span class="tag tag-advanced">進階</span>
    <span class="tag tag-interview">面試重點</span>
  </div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch17-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">元件本地狀態 vs. 共享狀態 — 如何決定邊界</span>
    </a>
    <a class="catalog-item" href="#ch17-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">帶有型別定義的 Event Bus 模式</span>
    </a>
    <a class="catalog-item" href="#ch17-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">整合 Redux / Zustand / Signals 與 Web Components</span>
    </a>
    <a class="catalog-item" href="#ch17-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">TC39 Signals 提案對 Web Components 開發的意義</span>
    </a>
    <a class="catalog-item" href="#ch17-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">在原生元件中使用 @preact/signals 的 Observable 模式</span>
    </a>
    <a class="catalog-item" href="#ch17-interview">
      <span class="catalog-item-num">06</span>
      <span class="catalog-item-title">面試題：如何在包含 50 個 Web Components 的應用中共享狀態？</span>
    </a>
  </div>
</div>

<h2 id="ch17-s01">元件本地狀態 vs. 共享狀態 — 如何決定邊界</h2>

<p>狀態管理的第一步是正確劃分邊界。將所有狀態提升到全域會導致過度耦合，而將可共享的狀態封閉在元件內又會引發「Props Drilling」困境。以下決策流程圖協助您做出正確選擇：</p>

<book-code-block language="text" label="狀態邊界決策流程">
問題：這個狀態應該放在哪裡？

┌─────────────────────────────────────────┐
│ 這個狀態只被單一元件使用嗎？            │
└────────────────┬────────────────────────┘
                 │
        是 ──────┴────── 否
        │                │
        ▼                ▼
  元件本地狀態    多個元件需要讀取此狀態嗎？
  (this._count)        │
                是 ────┴──── 否
                │             │
                ▼             ▼
        這些元件是否          父子關係？
        有共同的祖先？         │
                │        是 ──┴── 否
        是 ──┴── 否     │         │
        │          │    ▼         ▼
        ▼          ▼  屬性傳遞   Context API
   提升至最近    全域Store    (ch16)
   共同祖先      (EventBus/
               Zustand/Redux)
</book-code-block>

<p>實際判斷標準可以分為三個層次：</p>
<ul>
  <li><strong>Layer 1 — 本地狀態</strong>：UI 狀態（展開/收合、hover 狀態）、表單輸入中間值、動畫計時器</li>
  <li><strong>Layer 2 — 父子傳遞</strong>：父元件需要控制或回應子元件的狀態，透過 property/attribute 向下傳，CustomEvent 向上報</li>
  <li><strong>Layer 3 — 全域共享</strong>：使用者身份認證、購物車內容、主題色彩、語言設定</li>
</ul>

<book-code-block language="typescript" label="TypeScript — 三層狀態範例">
// Layer 1：本地 UI 狀態
class DropdownMenu extends HTMLElement {
  private _isOpen = false  // 只有這個元件需要知道

  toggle() {
    this._isOpen = !this._isOpen
    this.setAttribute('aria-expanded', String(this._isOpen))
    this._render()
  }
}

// Layer 2：父子傳遞狀態
class ProductCard extends HTMLElement {
  // 父元件透過 property 傳入
  set product(value: Product) {
    this._product = value
    this._render()
  }

  private _handleAddToCart() {
    // 向上冒泡，讓父容器處理
    this.dispatchEvent(new CustomEvent('add-to-cart', {
      detail: { productId: this._product.id },
      bubbles: true,
      composed: true,
    }))
  }
}

// Layer 3：全域狀態（使用後續介紹的 EventBus 或 Store）
class UserAvatar extends HTMLElement {
  connectedCallback() {
    // 訂閱全域認證狀態變更
    authStore.subscribe(state =&gt; {
      this._user = state.user
      this._render()
    })
  }
}
</book-code-block>

<h2 id="ch17-s02">帶有型別定義的 Event Bus 模式</h2>

<p>Event Bus 是 Web Components 最輕量的跨元件通訊方案，無需引入任何外部依賴。關鍵是加上完整的 TypeScript 型別定義，讓事件的 payload 結構可被靜態檢查。</p>

<book-code-block language="typescript" label="TypeScript — 完整型別安全的 EventBus 實作">
// event-bus.ts

// 1. 定義所有事件的 payload 型別
export interface AppEventMap {
  'user:login':    { userId: string; username: string; role: 'admin' | 'user' }
  'user:logout':   { reason?: string }
  'cart:add':      { productId: string; quantity: number; price: number }
  'cart:remove':   { productId: string }
  'cart:clear':    Record&lt;string, never&gt;
  'theme:change':  { theme: 'light' | 'dark' | 'system' }
  'toast:show':    { message: string; type: 'info' | 'success' | 'error'; duration?: number }
  'modal:open':    { id: string; props?: Record&lt;string, unknown&gt; }
  'modal:close':   { id: string }
}

type EventKey = keyof AppEventMap
type Listener&lt;K extends EventKey&gt; = (payload: AppEventMap[K]) =&gt; void
type UnsubscribeFn = () =&gt; void

// 2. 型別安全的 EventBus 類別
class TypedEventBus {
  private readonly _listeners = new Map&lt;EventKey, Set&lt;Listener&lt;any&gt;&gt;&gt;()

  on&lt;K extends EventKey&gt;(event: K, listener: Listener&lt;K&gt;): UnsubscribeFn {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set())
    }
    this._listeners.get(event)!.add(listener)

    // 回傳 unsubscribe 函式，方便在 disconnectedCallback 清理
    return () =&gt; this.off(event, listener)
  }

  off&lt;K extends EventKey&gt;(event: K, listener: Listener&lt;K&gt;): void {
    this._listeners.get(event)?.delete(listener)
  }

  emit&lt;K extends EventKey&gt;(event: K, payload: AppEventMap[K]): void {
    this._listeners.get(event)?.forEach(listener =&gt; {
      try {
        listener(payload)
      } catch (err) {
        console.error(\`[EventBus] Error in listener for "\${event}":\`, err)
      }
    })
  }

  // 一次性監聽
  once&lt;K extends EventKey&gt;(event: K, listener: Listener&lt;K&gt;): UnsubscribeFn {
    const wrapper: Listener&lt;K&gt; = (payload) =&gt; {
      listener(payload)
      this.off(event, wrapper)
    }
    return this.on(event, wrapper)
  }

  // 清理某個 event 的所有 listeners（測試用）
  clear&lt;K extends EventKey&gt;(event?: K): void {
    if (event) {
      this._listeners.delete(event)
    } else {
      this._listeners.clear()
    }
  }
}

// 3. 全域單例（整個應用程式共用）
export const bus = new TypedEventBus()

// 4. 在 Web Component 中使用
class ShoppingCartBadge extends HTMLElement {
  private _count = 0
  private _unsubs: UnsubscribeFn[] = []

  connectedCallback() {
    this._unsubs = [
      bus.on('cart:add', ({ quantity }) =&gt; {
        this._count += quantity
        this._render()
      }),
      bus.on('cart:remove', () =&gt; {
        this._count = Math.max(0, this._count - 1)
        this._render()
      }),
      bus.on('cart:clear', () =&gt; {
        this._count = 0
        this._render()
      }),
    ]
  }

  disconnectedCallback() {
    // 避免記憶體洩漏
    this._unsubs.forEach(unsub =&gt; unsub())
    this._unsubs = []
  }

  private _render() {
    this.textContent = this._count &gt; 0 ? String(this._count) : ''
    this.toggleAttribute('has-items', this._count &gt; 0)
  }
}

customElements.define('cart-badge', ShoppingCartBadge)
</book-code-block>

<h2 id="ch17-s03">整合 Redux / Zustand / Signals 與 Web Components</h2>

<p>當應用程式複雜度超過 EventBus 所能應對的範圍，需要時間旅行偵錯、持久化或複雜的衍生狀態時，整合成熟的狀態管理函式庫是合理選擇。以 Zustand 為例，它的 API 簡潔，對框架無依賴，與 Web Components 整合尤為順暢。</p>

<book-code-block language="typescript" label="TypeScript — Zustand Store 定義">
// store/cart-store.ts
import { createStore } from 'zustand/vanilla'
import { subscribeWithSelector } from 'zustand/middleware'

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export interface CartState {
  items: CartItem[]
  isLoading: boolean
  // 衍生狀態（computed）
  readonly totalCount: number
  readonly totalPrice: number
  // Actions
  addItem: (item: Omit&lt;CartItem, 'quantity'&gt; &amp; { quantity?: number }) =&gt; void
  removeItem: (productId: string) =&gt; void
  updateQuantity: (productId: string, quantity: number) =&gt; void
  clearCart: () =&gt; void
}

export const cartStore = createStore&lt;CartState&gt;()(
  subscribeWithSelector((set, get) =&gt; ({
    items: [],
    isLoading: false,

    get totalCount() {
      return get().items.reduce((sum, item) =&gt; sum + item.quantity, 0)
    },

    get totalPrice() {
      return get().items.reduce((sum, item) =&gt; sum + item.price * item.quantity, 0)
    },

    addItem: (newItem) =&gt; set((state) =&gt; {
      const existing = state.items.find(i =&gt; i.productId === newItem.productId)
      if (existing) {
        return {
          items: state.items.map(i =&gt;
            i.productId === newItem.productId
              ? { ...i, quantity: i.quantity + (newItem.quantity ?? 1) }
              : i
          ),
        }
      }
      return { items: [...state.items, { ...newItem, quantity: newItem.quantity ?? 1 }] }
    }),

    removeItem: (productId) =&gt; set((state) =&gt; ({
      items: state.items.filter(i =&gt; i.productId !== productId),
    })),

    updateQuantity: (productId, quantity) =&gt; set((state) =&gt; ({
      items: quantity &lt;= 0
        ? state.items.filter(i =&gt; i.productId !== productId)
        : state.items.map(i =&gt;
            i.productId === productId ? { ...i, quantity } : i
          ),
    })),

    clearCart: () =&gt; set({ items: [] }),
  }))
)
</book-code-block>

<book-code-block language="typescript" label="TypeScript — LitElement 整合 Zustand Store">
// components/cart-summary.ts
import { LitElement, html, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { cartStore, CartState } from '../store/cart-store'

@customElement('cart-summary')
export class CartSummary extends LitElement {
  static styles = css\`
    :host { display: block; padding: 1rem; }
    .total { font-size: 1.25rem; font-weight: bold; }
    .empty { color: var(--color-muted, #888); }
  \`

  @state() private _cartState: Pick&lt;CartState, 'items' | 'totalCount' | 'totalPrice'&gt;

  private _unsubscribe?: () =&gt; void

  constructor() {
    super()
    this._cartState = cartStore.getState()
  }

  connectedCallback() {
    super.connectedCallback()
    // 訂閱 store 變更，並在 items 改變時才觸發重新渲染（效能最佳化）
    this._unsubscribe = cartStore.subscribe(
      (state) =&gt; state.items,
      () =&gt; {
        this._cartState = cartStore.getState()
      },
      { equalityFn: (a, b) =&gt; a === b }
    )
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this._unsubscribe?.()
  }

  render() {
    const { items, totalCount, totalPrice } = this._cartState

    if (items.length === 0) {
      return html\`&lt;p class="empty"&gt;購物車是空的&lt;/p&gt;\`
    }

    return html\`
      &lt;ul&gt;
        \${items.map(item =&gt; html\`
          &lt;li&gt;
            \${item.name} × \${item.quantity}
            &lt;span&gt;\${(item.price * item.quantity).toFixed(2)}&lt;/span&gt;
            &lt;button @click=\${() =&gt; cartStore.getState().removeItem(item.productId)}&gt;
              移除
            &lt;/button&gt;
          &lt;/li&gt;
        \`)}
      &lt;/ul&gt;
      &lt;div class="total"&gt;
        共 \${totalCount} 件 · NT\$ \${totalPrice.toFixed(0)}
      &lt;/div&gt;
    \`
  }
}
</book-code-block>

<h2 id="ch17-s04">TC39 Signals 提案對 Web Components 開發的意義</h2>

<p>TC39 Signals 提案（Stage 1）旨在為 JavaScript 引入原生的細粒度響應式原語，類似於 Solid.js 的 Signal 或 Vue 3 的 ref/computed。一旦標準化，Web Components 將不再需要依賴任何框架即可實現高效的響應式更新。</p>

<book-code-block language="typescript" label="TypeScript — TC39 Signals API（提案語法）">
// 注意：以下為 TC39 Signals 提案的預期 API，尚未進入瀏覽器
// 可透過 @tc39/proposal-signals polyfill 提前試用

import { Signal } from 'signal-polyfill'

// 1. 建立 State Signal（可讀寫）
const count = new Signal.State(0)
const username = new Signal.State('Alice')

// 2. 建立 Computed Signal（唯讀，自動追蹤依賴）
const doubleCount = new Signal.Computed(() =&gt; count.get() * 2)
const greeting = new Signal.Computed(() =&gt; \`Hello, \${username.get()}! Count: \${count.get()}\`)

// 3. 讀取值
console.log(count.get())       // 0
console.log(doubleCount.get()) // 0

// 4. 更新值
count.set(5)
console.log(doubleCount.get()) // 10（自動重新計算）

// 5. Effect（使用 Signal.subtle.Watcher 實作，或透過框架整合）
// 原生 Watcher API（低階）
const watcher = new Signal.subtle.Watcher(() =&gt; {
  // 有 signal 變更時呼叫（非同步）
  console.log('Some signal changed')
  queueMicrotask(processEffects)
})

function processEffects() {
  for (const signal of watcher.getPending()) {
    signal.get() // 重新計算
  }
  watcher.watch() // 重新開始監聽
}

watcher.watch(greeting) // 監聽 greeting Signal
username.set('Bob')     // 觸發 watcher
</book-code-block>

<book-code-block language="typescript" label="TypeScript — 在原生 Web Component 中整合 Signals">
import { Signal } from 'signal-polyfill'
import { effect } from './signal-effect-helper' // 封裝 Watcher

// 全域 Signals（跨元件共享）
export const appState = {
  user: new Signal.State&lt;{ name: string; avatar: string } | null&gt;(null),
  theme: new Signal.State&lt;'light' | 'dark'&gt;('light'),
  notifications: new Signal.State&lt;number&gt;(0),
}

class UserProfile extends HTMLElement {
  private _cleanup?: () =&gt; void

  connectedCallback() {
    // effect 自動追蹤依賴，任何 signal 變更都觸發重新渲染
    this._cleanup = effect(() =&gt; {
      const user = appState.user.get()
      const theme = appState.theme.get()
      this._render(user, theme)
    })
  }

  disconnectedCallback() {
    this._cleanup?.() // 清理 effect
  }

  private _render(user: typeof appState.user extends Signal.State&lt;infer T&gt; ? T : never, theme: string) {
    if (!user) {
      this.innerHTML = \`&lt;button&gt;登入&lt;/button&gt;\`
      return
    }
    this.innerHTML = \`
      &lt;div data-theme="\${theme}"&gt;
        &lt;img src="\${user.avatar}" alt="\${user.name}" /&gt;
        &lt;span&gt;\${user.name}&lt;/span&gt;
      &lt;/div&gt;
    \`
  }
}

customElements.define('user-profile', UserProfile)

// 從任何地方更新，所有訂閱的元件自動響應
appState.user.set({ name: 'Tim', avatar: '/avatar.jpg' })
appState.theme.set('dark')
</book-code-block>

<h2 id="ch17-s05">在原生元件中使用 @preact/signals 的 Observable 模式</h2>

<p>在 TC39 Signals 正式標準化之前，<code>@preact/signals-core</code> 提供了相容性最廣的 Signal 實作。它是框架無關的，可直接在原生 Web Components 中使用。</p>

<book-code-block language="typescript" label="TypeScript — @preact/signals-core 整合原生 Web Component">
import { signal, computed, effect, batch } from '@preact/signals-core'

// ===== 全域 Store（signals-based）=====
export const cartSignals = {
  items: signal&lt;Array&lt;{ id: string; name: string; price: number; qty: number }&gt;&gt;([]),
  couponCode: signal&lt;string | null&gt;(null),
  // computed 自動追蹤依賴
  total: computed(() =&gt;
    cartSignals.items.value.reduce((sum, item) =&gt; sum + item.price * item.qty, 0)
  ),
  itemCount: computed(() =&gt;
    cartSignals.items.value.reduce((sum, item) =&gt; sum + item.qty, 0)
  ),
}

// ===== Cart Icon 元件 =====
class CartIcon extends HTMLElement {
  private _disposeEffect?: () =&gt; void

  connectedCallback() {
    this.attachShadow({ mode: 'open' })
    // effect 自動訂閱所有在其中被讀取的 signals
    this._disposeEffect = effect(() =&gt; {
      const count = cartSignals.itemCount.value
      const total = cartSignals.total.value
      this.shadowRoot!.innerHTML = \`
        &lt;style&gt;
          :host { display: inline-flex; align-items: center; gap: 0.5rem; cursor: pointer; }
          .badge { background: var(--color-accent, #e53e3e); color: white;
                   border-radius: 50%; width: 20px; height: 20px;
                   display: flex; align-items: center; justify-content: center;
                   font-size: 0.75rem; font-weight: bold; }
        &lt;/style&gt;
        &lt;svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"&gt;
          &lt;path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/&gt;
        &lt;/svg&gt;
        \${count &gt; 0 ? \`&lt;span class="badge"&gt;\${count}&lt;/span&gt;\` : ''}
        &lt;span&gt;NT\$ \${total.toFixed(0)}&lt;/span&gt;
      \`
    })
  }

  disconnectedCallback() {
    this._disposeEffect?.()
  }
}

customElements.define('cart-icon', CartIcon)

// ===== 使用 batch 進行批量更新（避免多次渲染）=====
function addMultipleItems() {
  batch(() =&gt; {
    cartSignals.items.value = [
      ...cartSignals.items.value,
      { id: 'A', name: '商品A', price: 100, qty: 1 },
      { id: 'B', name: '商品B', price: 200, qty: 2 },
    ]
    cartSignals.couponCode.value = 'SAVE10'
    // batch 結束後，依賴這些 signals 的 effect 只觸發一次
  })
}
</book-code-block>

<h2 id="ch17-interview">面試題：如何在包含 50 個 Web Components 的應用中共享狀態？</h2>

<div class="interview-qa">
  <p><strong>Q：如果你需要在一個包含 50 個 Web Components 的大型應用中共享使用者認證狀態、購物車狀態和主題設定，你會採用什麼架構？</strong></p>

  <p><strong>A（分層回答）：</strong></p>

  <p><strong>第一層（基礎）：</strong>首先，我會根據狀態的性質決定機制。對於簡單的跨元件通知，原生 <code>CustomEvent</code> 加上 <code>bubbles: true, composed: true</code> 就足夠。但 50 個元件的場景需要更結構化的方案。</p>

  <p><strong>第二層（進階）：</strong>我會採用分層架構：</p>
  <ul>
    <li><strong>全域 Store</strong>（Zustand vanilla 或 @preact/signals）持有認證、購物車等真正需要全域共享的狀態</li>
    <li><strong>Context API</strong>（@lit/context）處理在特定子樹中共享但非全域的狀態，例如表單狀態或頁面層級主題</li>
    <li><strong>型別安全 EventBus</strong> 用於一次性的跨元件通知，如 toast 訊息、modal 開關</li>
    <li><strong>元件本地狀態</strong>：UI 互動狀態絕不提升到全域</li>
  </ul>

  <p><strong>第三層（系統考量）：</strong>效能方面，訂閱時使用 selector（只訂閱需要的狀態片段），避免無關更新觸發重渲。記憶體方面，確保 <code>disconnectedCallback</code> 中清理所有訂閱。測試方面，Store 與元件分離讓單元測試更容易隔離。</p>
</div>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>狀態管理的本質是邊界決策——本地狀態留在元件內，父子通訊用 property/event，跨元件共享用型別安全的 EventBus 或 Signals，全域複雜狀態用 Zustand 等專業工具。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch16">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">Context API 與跨層級溝通</span>
    </a>
    <a class="footer-link" href="#ch18">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">在 Web Component 應用中實作 Client-Side Routing</span>
    </a>
  </div>
</div>
`
