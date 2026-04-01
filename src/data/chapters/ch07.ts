export const metadata = {
  id: 7,
  part: 2,
  title: 'Reactive Properties — 自己打造響應式系統',
  tags: ['面試重點', '進階'] as string[],
  sections: [
    { slug: 'ch07-s01', title: 'Property 到 DOM 的更新迴圈運作原理' },
    { slug: 'ch07-s02', title: '用 Promise.resolve() 與 queueMicrotask 實作批次更新' },
    { slug: 'ch07-s03', title: '從零開始實作一個簡易的 Reactive Base Class' },
    { slug: 'ch07-s04', title: 'Dirty-checking 與深層觀察（Deep Observation）的取捨' },
    { slug: 'ch07-s05', title: '使用 Proxy 實現細粒度的響應式' },
    { slug: 'ch07-interview', title: '面試題：你會如何從零實作一個 Reactive Property 系統？' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 07 · 第二部：TypeScript 優先的 Web Components 開發</div>
  <h1>Reactive Properties — 自己打造響應式系統</h1>
  <p>React 的 useState、Vue 的 ref()、Solid 的 createSignal——這些框架的響應式系統背後的核心機制其實都可以用原生 JavaScript 實作。本章是全書最具挑戰性的章節：我們從零開始，一步步建立一個完整的 Reactive Base Class，理解微任務（microtask）批次更新的精妙設計，並探索 Proxy 如何實現細粒度的響應式追蹤。這些知識不僅讓你理解框架的工作原理，也讓你有能力在不依賴任何框架的情況下建立高效能的 Web Components。</p>
  <div class="chapter-tags"><span class="tag tag-interview">面試重點</span><span class="tag tag-advanced">進階</span></div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch07-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">Property 到 DOM 的更新迴圈</span>
    </a>
    <a class="catalog-item" href="#ch07-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">Promise.resolve() 與 queueMicrotask 批次更新</span>
    </a>
    <a class="catalog-item" href="#ch07-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">從零實作 Reactive Base Class</span>
    </a>
    <a class="catalog-item" href="#ch07-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">Dirty-checking 與深層觀察的取捨</span>
    </a>
    <a class="catalog-item" href="#ch07-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">Proxy 細粒度響應式</span>
    </a>
    <a class="catalog-item" href="#ch07-interview">
      <span class="catalog-item-num">06</span>
      <span class="catalog-item-title">面試題：從零實作 Reactive Property 系統</span>
    </a>
  </div>
</div>

<h2 id="ch07-s01">Property 到 DOM 的更新迴圈運作原理</h2>

<p>所謂「響應式」，本質上就是一個機制：當某個值改變時，自動更新依賴它的 DOM。這看起來簡單，實作起來卻有很多微妙的細節。最核心的問題是：<strong>何時更新 DOM？</strong></p>

<p>最樸素的方式是「同步更新」——每次 property 改變就立即重新渲染。這雖然直觀，但效率極低。想像一個元件有 10 個 reactive properties，在某個操作中它們全部同時改變。同步更新會觸發 10 次完整渲染，但實際上我們只需要渲染最後一次的結果。</p>

<book-code-block language="typescript" label="同步更新的問題示範">
// ── 反面示範：同步更新（低效）──
class SyncReactiveElement extends HTMLElement {
  private _name = 'World'
  private _age = 0
  private _role = 'user'
  private renderCount = 0

  // 每個 setter 都立即觸發 render
  get name() { return this._name }
  set name(v: string) { this._name = v; this.render() }  // render #1

  get age() { return this._age }
  set age(v: number) { this._age = v; this.render() }    // render #2

  get role() { return this._role }
  set role(v: string) { this._role = v; this.render() }  // render #3

  connectedCallback() { this.render() }

  private render() {
    this.renderCount++
    // 這行會在同一個 JS 同步執行環境中被呼叫 3 次
    this.textContent = \`\${this._name} (age \${this._age}, role: \${this._role})\`
    console.log(\`Render #\${this.renderCount}\`)
  }
}
customElements.define('sync-reactive', SyncReactiveElement)

// 使用端：
// const el = document.querySelector('sync-reactive') as SyncReactiveElement
// el.name = 'Alice'  // → render #1（顯示 Alice, age 0, role user）
// el.age = 30        // → render #2（顯示 Alice, age 30, role user）
// el.role = 'admin'  // → render #3（顯示 Alice, age 30, role admin）
// 三次 render，但使用者只關心最終結果

// ── 正確思路：非同步批次更新 ──
// 關鍵洞察：在同一個「JavaScript Task」（同步執行環境）中，
// 所有的 property 改變都應該被「收集」起來，
// 等到當前同步程式碼執行完畢後，才進行一次 DOM 更新。
// 這就是「批次更新（Batched Update）」的核心思想。

// JavaScript 事件迴圈：
// [Task 佇列] → 執行 Task → [清空 Microtask 佇列] → 渲染 → 下一個 Task
//
// 我們利用「Microtask」來插入在當前 Task 結束後、渲染前的時機
// Promise.resolve().then() 和 queueMicrotask() 都是 Microtask
</book-code-block>

<h2 id="ch07-s02">用 Promise.resolve() 與 queueMicrotask 實作批次更新</h2>

<p>JavaScript 的事件迴圈（Event Loop）分為 Tasks 和 Microtasks 兩個層級。Microtasks 在當前 Task 執行完畢後、下一個 Task 開始前執行，而且會在瀏覽器渲染之前執行完畢。這個時機正是批次更新的最佳插入點。</p>

<book-code-block language="typescript" label="微任務批次更新的核心機制">
// ── 理解 Microtask 時機 ──
// 事件迴圈執行順序：
// 1. 執行當前 Task（如：使用者點擊 → 觸發事件處理函式）
// 2. 清空所有 Microtask（Promise.then、queueMicrotask、MutationObserver）
// 3. 瀏覽器渲染（如果需要）
// 4. 執行下一個 Task

// ── Promise.resolve() 作為微任務排程器 ──
class MicrotaskBatchDemo {
  private pendingUpdate = false
  private updateCount = 0

  // 排程一次 microtask 更新
  private scheduleUpdate(): Promise&lt;void&gt; {
    if (!this.pendingUpdate) {
      this.pendingUpdate = true

      return Promise.resolve().then(() =&gt; {
        // 這裡在 microtask 時機執行
        // 此時所有同步的 property 修改都已完成
        this.pendingUpdate = false
        this.updateCount++
        console.log(\`DOM 更新 #\${this.updateCount}\`)
        this.performUpdate()
      })
    }
    // 如果已有排程中的更新，回傳空 Promise
    return Promise.resolve()
  }

  private performUpdate() {
    console.log('執行實際的 DOM 更新')
  }

  // 模擬多個 property 修改
  testBatching() {
    console.log('--- 開始修改 properties ---')
    this.scheduleUpdate()  // 排程更新
    this.scheduleUpdate()  // 已有排程，被忽略
    this.scheduleUpdate()  // 已有排程，被忽略
    console.log('--- 同步程式碼結束 ---')
    // 輸出：
    // --- 開始修改 properties ---
    // --- 同步程式碼結束 ---
    // DOM 更新 #1      ← 只執行一次！
    // 執行實際的 DOM 更新
  }
}

// ── queueMicrotask() vs Promise.resolve().then() ──
// 兩者都是 microtask，執行時機相同
// queueMicrotask 是更語意化的方式（直接表達意圖）
// Promise.resolve() 是更傳統的方式（相容性略好）

function scheduleWithQueueMicrotask(callback: () =&gt; void) {
  queueMicrotask(callback)
}

function scheduleWithPromise(callback: () =&gt; void) {
  Promise.resolve().then(callback)
}

// ── 使用 updateComplete Promise 等待更新完成 ──
class UpdatableElement extends HTMLElement {
  private _pendingUpdate: Promise&lt;boolean&gt; | null = null
  private _resolveUpdate!: (value: boolean) =&gt; void

  // 公開 API：讓使用者等待 DOM 更新完成
  get updateComplete(): Promise&lt;boolean&gt; {
    if (!this._pendingUpdate) {
      this._pendingUpdate = new Promise&lt;boolean&gt;(resolve =&gt; {
        this._resolveUpdate = resolve
      })
    }
    return this._pendingUpdate
  }

  protected requestUpdate() {
    const promise = this.updateComplete  // 確保 Promise 已建立
    void promise  // 抑制 unused variable 警告

    queueMicrotask(() =&gt; {
      this.performUpdate()
      this._pendingUpdate = null
      this._resolveUpdate(true)
    })
  }

  protected performUpdate() {
    // 子類別覆寫：在這裡更新 DOM
  }
}

// 使用：
// await element.updateComplete  // 等待 DOM 更新完成再讀取 DOM 狀態
// const value = element.querySelector('input')!.value  // 此時 DOM 已是最新
</book-code-block>

<h2 id="ch07-s03">從零開始實作一個簡易的 Reactive Base Class</h2>

<p>這是本章最核心的部分。我們要實作一個完整的 <code>ReactiveElement</code> Base Class，讓繼承它的元件自動獲得批次更新、property 追蹤、以及 <code>updateComplete</code> Promise 等能力。這個實作是對 Lit 的 <code>LitElement</code> 核心機制的簡化版本，讓你真正理解其工作原理。</p>

<book-code-block language="typescript" label="完整的 ReactiveElement Base Class 實作">
// ── ReactiveElement：完整的響應式 Base Class ──

// 型別定義
type PropertyDeclaration&lt;T = unknown&gt; = {
  // attribute name（預設為 camelCase → kebab-case 轉換）
  attribute?: string | false
  // 值的型別轉換器
  type?: 'string' | 'number' | 'boolean' | 'object'
  // 是否反射到 attribute
  reflect?: boolean
  // 自訂相等性比較
  hasChanged?: (newVal: T, oldVal: T) =&gt; boolean
}

type PropertyDeclarationMap = Map&lt;string, PropertyDeclaration&gt;

// 預設的相等性比較（使用嚴格相等，NaN 例外處理）
function defaultHasChanged(value: unknown, old: unknown): boolean {
  return value !== old &amp;&amp; (value === value || old === old)
  //                      ↑ 處理 NaN !== NaN 的特殊情況
}

// 型別轉換器
const typeConverters = {
  string: {
    fromAttr: (val: string | null) =&gt; val ?? '',
    toAttr: (val: unknown) =&gt; String(val ?? ''),
  },
  number: {
    fromAttr: (val: string | null) =&gt; (val !== null ? Number(val) : 0),
    toAttr: (val: unknown) =&gt; String(val),
  },
  boolean: {
    fromAttr: (val: string | null) =&gt; val !== null,
    toAttr: (val: unknown) =&gt; (val ? '' : null),
  },
  object: {
    fromAttr: (val: string | null) =&gt; {
      try { return val !== null ? JSON.parse(val) : null } catch { return null }
    },
    toAttr: (val: unknown) =&gt; JSON.stringify(val),
  },
}

// ── 核心：ReactiveElement Base Class ──
abstract class ReactiveElement extends HTMLElement {
  // 靜態：每個子類別的 property 宣告（用 WeakMap 避免記憶體洩漏）
  private static __propertyDeclarations: PropertyDeclarationMap = new Map()

  // 靜態方法：宣告一個 reactive property
  static property(name: string, options: PropertyDeclaration = {}) {
    if (!this.hasOwnProperty('__propertyDeclarations')) {
      this.__propertyDeclarations = new Map(
        (Object.getPrototypeOf(this) as typeof ReactiveElement).__propertyDeclarations
      )
    }
    this.__propertyDeclarations.set(name, options)

    // 同時定義到 observedAttributes
    const attrName = options.attribute !== false
      ? (options.attribute ?? camelToKebab(name))
      : null

    if (attrName) {
      const existing = (this as any).observedAttributes ?? []
      if (!existing.includes(attrName)) {
        Object.defineProperty(this, 'observedAttributes', {
          get: () =&gt; [...existing, attrName],
          configurable: true,
        })
      }
    }
  }

  // 實例：追蹤哪些 property 已被標記為需要更新
  private __changedProperties: Map&lt;string, unknown&gt; = new Map()
  // 是否有排程中的更新
  private __updateScheduled = false
  // 更新完成的 Promise
  private __updateComplete: Promise&lt;boolean&gt; | null = null
  private __resolveUpdate!: (value: boolean) =&gt; void
  // 是否已連接到 DOM（避免在 disconnected 時執行更新）
  private __connected = false

  // 公開 API：讓外部等待 DOM 更新完成
  get updateComplete(): Promise&lt;boolean&gt; {
    if (!this.__updateComplete) {
      this.__updateComplete = new Promise&lt;boolean&gt;(resolve =&gt; {
        this.__resolveUpdate = resolve
      })
    }
    return this.__updateComplete
  }

  // 在 constructor 中為每個 declared property 建立 getter/setter
  constructor() {
    super()
    this.__setupProperties()
  }

  private __setupProperties() {
    const declarations = (this.constructor as typeof ReactiveElement).__propertyDeclarations
    declarations.forEach((options, name) =&gt; {
      const privateKey = \`__prop_\${name}\`
      const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), name)

      // 如果子類別已有定義 getter/setter，不要覆蓋
      if (descriptor?.get) return

      // 定義 getter/setter
      Object.defineProperty(this, name, {
        get() {
          return (this as any)[privateKey]
        },
        set(newValue: unknown) {
          const oldValue = (this as any)[privateKey]
          const hasChanged = options.hasChanged ?? defaultHasChanged

          if (hasChanged(newValue, oldValue)) {
            (this as any)[privateKey] = newValue
            ;(this as ReactiveElement).__requestUpdate(name, oldValue)
          }
        },
        configurable: true,
        enumerable: true,
      })
    })
  }

  // 標記 property 已改變，排程更新
  protected __requestUpdate(name: string, oldValue: unknown) {
    if (!this.__changedProperties.has(name)) {
      this.__changedProperties.set(name, oldValue)
    }
    this.__scheduleUpdate()
  }

  // 排程一個 microtask 更新（批次化）
  private __scheduleUpdate() {
    if (!this.__updateScheduled &amp;&amp; this.__connected) {
      this.__updateScheduled = true
      const promise = this.updateComplete  // 確保 Promise 已建立

      queueMicrotask(() =&gt; {
        this.__updateScheduled = false
        if (this.__connected) {
          const changedProps = new Map(this.__changedProperties)
          this.__changedProperties.clear()
          this.__performUpdate(changedProps)
        }
        // Resolve 上一個 updateComplete，建立新的
        this.__resolveUpdate(true)
        this.__updateComplete = null
        void promise
      })
    }
  }

  // 執行更新
  private __performUpdate(changedProperties: Map&lt;string, unknown&gt;) {
    // 呼叫生命週期回呼
    if (this.shouldUpdate(changedProperties)) {
      this.update(changedProperties)
      this.updated(changedProperties)
    }
  }

  // ── attribute → property 的橋樑 ──
  attributeChangedCallback(name: string, _old: string | null, newVal: string | null) {
    const declarations = (this.constructor as typeof ReactiveElement).__propertyDeclarations
    // 找到對應的 property name
    for (const [propName, options] of declarations) {
      const attrName = options.attribute !== false
        ? (options.attribute ?? camelToKebab(propName))
        : null

      if (attrName === name) {
        const type = options.type ?? 'string'
        const converter = typeConverters[type] ?? typeConverters.string
        ;(this as any)[propName] = converter.fromAttr(newVal)
        break
      }
    }
  }

  // ── 生命週期 ──
  connectedCallback() {
    this.__connected = true
    this.__scheduleUpdate()
  }

  disconnectedCallback() {
    this.__connected = false
  }

  // ── 供子類別覆寫的 Hooks ──
  // 控制是否應該更新（可用於效能最佳化）
  protected shouldUpdate(_changedProperties: Map&lt;string, unknown&gt;): boolean {
    return true
  }

  // 執行 DOM 更新（子類別必須覆寫）
  protected abstract update(changedProperties: Map&lt;string, unknown&gt;): void

  // 更新後的回呼（可選覆寫）
  protected updated(_changedProperties: Map&lt;string, unknown&gt;): void {}
}

// 工具函式：camelCase → kebab-case
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, char =&gt; \`-\${char.toLowerCase()}\`)
}

// ── 使用 ReactiveElement ──
class UserCard extends ReactiveElement {
  // 宣告 reactive properties（class 初始化時執行）
  static {
    UserCard.property('name', { type: 'string', reflect: true })
    UserCard.property('age', { type: 'number' })
    UserCard.property('online', { type: 'boolean', attribute: 'is-online' })
  }

  // 型別宣告（告訴 TS 這些屬性存在）
  declare name: string
  declare age: number
  declare online: boolean

  private shadow: ShadowRoot

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    // 設定預設值
    this.name = ''
    this.age = 0
    this.online = false
  }

  protected update(changedProperties: Map&lt;string, unknown&gt;): void {
    // changedProperties 包含所有改變的 property 及其舊值
    console.log('Updating, changed:', [...changedProperties.keys()])

    this.shadow.innerHTML = \`
      &lt;style&gt;
        :host { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .avatar { width: 40px; height: 40px; border-radius: 50%; background: #4f46e5; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
        .status { width: 10px; height: 10px; border-radius: 50%; background: \${this.online ? '#10b981' : '#9ca3af'}; }
        .name { font-weight: 600; }
        .age { color: #6b7280; font-size: 0.875rem; }
      &lt;/style&gt;
      &lt;div class="avatar"&gt;\${this.name[0]?.toUpperCase() ?? '?'}&lt;/div&gt;
      &lt;div&gt;
        &lt;div class="name"&gt;\${this.name}&lt;/div&gt;
        &lt;div class="age"&gt;Age: \${this.age}&lt;/div&gt;
      &lt;/div&gt;
      &lt;div class="status" title="\${this.online ? 'Online' : 'Offline'}"&gt;&lt;/div&gt;
    \`
  }
}

customElements.define('user-card', UserCard)

// ── 使用示範（批次更新）──
async function demo() {
  const card = document.querySelector('user-card') as UserCard

  // 這三行同步執行，只觸發一次 DOM 更新
  card.name = 'Alice'   // 標記為 changed，排程 microtask
  card.age = 30         // 標記為 changed（microtask 已排程，不重複）
  card.online = true    // 標記為 changed

  // 等待 DOM 更新完成
  await card.updateComplete
  console.log('DOM has been updated')
}
</book-code-block>

<h2 id="ch07-s04">Dirty-checking 與深層觀察（Deep Observation）的取捨</h2>

<p>我們在 <code>ReactiveElement</code> 中使用的 <code>defaultHasChanged</code>（嚴格相等比較）是最簡單也最高效的「Dirty-checking」實作。它只能偵測到基本值（string、number、boolean）的改變，以及物件/陣列參考的改變——但無法偵測到物件內部屬性的改變。</p>

<book-code-block language="typescript" label="不同 Dirty-checking 策略的取捨">
// ── 策略一：嚴格相等（預設，最快）──
function strictEqual(newVal: unknown, oldVal: unknown): boolean {
  return newVal !== oldVal &amp;&amp; (newVal === newVal || oldVal === oldVal)
  // NaN !== NaN → 兩個 NaN 都算「改變了」（正確的行為）
}

// 問題：
// const card = document.querySelector('user-card') as UserCard
// card.user = { name: 'Alice' }  // ← 觸發更新（新物件）
// const user = card.user
// user.name = 'Bob'              // ← 不觸發更新！（相同物件參考）
// card.user = user               // ← 不觸發更新！（相同參考）

// ── 策略二：強制更新（總是觸發）──
function alwaysChanged(): boolean {
  return true
}
// 用法：ReactiveElement.property('user', { hasChanged: alwaysChanged })
// 問題：無法進行任何最佳化，每次設定都重新渲染

// ── 策略三：JSON 序列化比較（深度比較）──
function deepEqual(newVal: unknown, oldVal: unknown): boolean {
  try {
    return JSON.stringify(newVal) !== JSON.stringify(oldVal)
  } catch {
    return newVal !== oldVal
  }
}
// 問題：性能差（O(n) 序列化），無法處理函式、循環參考

// ── 策略四：Structural Equality（中等成本）──
function shallowEqual(newVal: unknown, oldVal: unknown): boolean {
  if (newVal === oldVal) return false
  if (typeof newVal !== 'object' || newVal === null) return true
  if (typeof oldVal !== 'object' || oldVal === null) return true

  const newKeys = Object.keys(newVal as object)
  const oldKeys = Object.keys(oldVal as object)

  if (newKeys.length !== oldKeys.length) return true

  return newKeys.some(key =&gt;
    (newVal as any)[key] !== (oldVal as any)[key]
  )
}

// ── 最佳實踐：不可變資料（Immutable Data）──
// 與其嘗試深度觀察，不如讓使用者遵循不可變更新的慣例
// 每次修改都建立新的物件/陣列：

class ImmutableDataElement extends HTMLElement {
  private _items: string[] = []

  get items(): string[] {
    return this._items
  }

  set items(value: string[]) {
    // 嚴格相等比較：只有傳入新陣列時才更新
    if (value !== this._items) {
      this._items = value
      this.render()
    }
  }

  // 提供方便的方法，讓使用者不需要手動建立新陣列
  addItem(item: string) {
    // 建立新陣列（不修改原陣列）← Immutable 更新
    this.items = [...this._items, item]
  }

  removeItem(index: number) {
    this.items = this._items.filter((_, i) =&gt; i !== index)
  }

  connectedCallback() { this.render() }

  private render() {
    this.innerHTML = \`&lt;ul&gt;\${this._items.map(item =&gt; \`&lt;li&gt;\${item}&lt;/li&gt;\`).join('')}&lt;/ul&gt;\`
  }
}
customElements.define('immutable-list', ImmutableDataElement)
</book-code-block>

<h2 id="ch07-s05">使用 Proxy 實現細粒度的響應式</h2>

<p>Proxy 是 ES2015 引入的原生 JavaScript 特性，它讓你能夠攔截物件的基本操作（讀取、寫入、刪除等），從而實現真正的「細粒度響應式」——不只是追蹤頂層物件的替換，而是追蹤任何深度的屬性修改。這是 Vue 3 的 Composition API 和 MobX 的核心機制。</p>

<book-code-block language="typescript" label="用 Proxy 實作細粒度響應式系統">
// ── 基礎 Proxy 響應式 ──
type Effect = () =&gt; void
type Subscriber = Set&lt;Effect&gt;

// 全域效果追蹤器（簡化版 Vue 3 的依賴追蹤）
let currentEffect: Effect | null = null
const targetMap = new WeakMap&lt;object, Map&lt;string | symbol, Subscriber&gt;&gt;()

// 追蹤依賴
function track(target: object, key: string | symbol) {
  if (!currentEffect) return

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  let deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }

  deps.add(currentEffect)
}

// 觸發更新
function trigger(target: object, key: string | symbol) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  const deps = depsMap.get(key)
  if (!deps) return

  deps.forEach(effect =&gt; effect())
}

// 建立響應式物件
function reactive&lt;T extends object&gt;(raw: T): T {
  return new Proxy(raw, {
    get(target, key, receiver) {
      const result = Reflect.get(target, key, receiver)
      // 追蹤此屬性被讀取
      track(target, key)
      // 如果值是物件，也讓它變成響應式（深度響應式）
      if (typeof result === 'object' &amp;&amp; result !== null) {
        return reactive(result)
      }
      return result
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver)
      // 觸發依賴此屬性的效果
      trigger(target, key)
      return result
    },
    deleteProperty(target, key) {
      const result = Reflect.deleteProperty(target, key)
      trigger(target, key)
      return result
    },
  })
}

// 執行一個效果函式，自動追蹤其中的依賴
function effect(fn: Effect): Effect {
  const effectFn: Effect = () =&gt; {
    currentEffect = effectFn
    fn()
    currentEffect = null
  }
  effectFn()  // 立即執行一次，追蹤依賴
  return effectFn
}

// ── 在 Custom Element 中使用 Proxy 響應式 ──
class ProxyReactiveCounter extends HTMLElement {
  // 響應式狀態（用 Proxy 包裝）
  private state = reactive({
    count: 0,
    step: 1,
    history: [] as number[],
  })

  connectedCallback() {
    this.attachShadow({ mode: 'open' })

    // 建立一個 effect：當 state 的任何依賴屬性改變時，自動重新渲染
    effect(() =&gt; {
      // 在 effect 執行期間，所有讀取的屬性都會被追蹤
      const { count, step, history } = this.state

      if (this.shadowRoot) {
        this.shadowRoot.innerHTML = \`
          &lt;style&gt;
            :host { display: block; font-family: sans-serif; padding: 16px; }
            .counter { font-size: 3em; font-weight: bold; color: #4f46e5; text-align: center; }
            .controls { display: flex; gap: 8px; justify-content: center; margin-top: 12px; }
            button { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; }
            .dec { background: #fef2f2; color: #dc2626; }
            .inc { background: #eff6ff; color: #2563eb; }
            .step { padding: 4px 8px; width: 60px; text-align: center; border: 1px solid #d1d5db; border-radius: 4px; }
            .history { margin-top: 12px; color: #6b7280; font-size: 0.75rem; }
          &lt;/style&gt;
          &lt;div class="counter"&gt;\${count}&lt;/div&gt;
          &lt;div class="controls"&gt;
            &lt;button class="dec"&gt;-\${step}&lt;/button&gt;
            &lt;input class="step" type="number" value="\${step}" min="1" max="100"&gt;
            &lt;button class="inc"&gt;+\${step}&lt;/button&gt;
          &lt;/div&gt;
          &lt;div class="history"&gt;歷史：\${history.slice(-5).join(' → ')}&lt;/div&gt;
        \`
        this.bindEvents()
      }
    })
  }

  private bindEvents() {
    const shadow = this.shadowRoot!

    shadow.querySelector('.dec')!.addEventListener('click', () =&gt; {
      this.state.count -= this.state.step
      this.state.history = [...this.state.history, this.state.count]
      // ← Proxy 自動偵測 count 和 history 的改變，觸發 effect 重新執行
    })

    shadow.querySelector('.inc')!.addEventListener('click', () =&gt; {
      this.state.count += this.state.step
      this.state.history = [...this.state.history, this.state.count]
    })

    shadow.querySelector('.step')!.addEventListener('input', (e) =&gt; {
      this.state.step = parseInt((e.target as HTMLInputElement).value, 10) || 1
    })
  }
}

customElements.define('proxy-counter', ProxyReactiveCounter)
</book-code-block>

<h2 id="ch07-interview">面試題：你會如何從零實作一個 Reactive Property 系統？</h2>

<book-callout variant="info" title="面試題">
  <p><strong>問題：</strong>不使用任何框架，請解釋你會如何為 Web Components 設計一個 Reactive Property 系統。需要考慮哪些關鍵問題？請說明批次更新的實作方式。</p>

  <p><strong>模範答案：</strong></p>

  <p><strong>核心問題的識別：</strong>Reactive Property 系統需要解決三個問題：1）如何偵測值的改變？2）改變後何時更新 DOM？3）如何避免多個 property 連續改變時的冗餘渲染？</p>

  <p><strong>偵測改變的方式（由簡到複雜）：</strong></p>
  <p>第一層：getter/setter。在 class 的 setter 中手動觸發更新。這是最基礎、效能最好的方式，也是 Lit 使用的方式。setter 在被賦值時執行，比較新舊值是否有變化（<code>newVal !== oldVal</code>，同時處理 NaN 的特殊情況），有變化才觸發更新排程。</p>
  <p>第二層：Proxy。對整個 state 物件使用 Proxy，攔截所有的 <code>set</code> trap。這允許深層追蹤（物件內部屬性的改變），也是 Vue 3 的做法。代價是每次屬性讀取都有 Proxy 的開銷，且不支援 IE11。</p>

  <p><strong>批次更新的實作：</strong>使用 <code>queueMicrotask()</code> 或 <code>Promise.resolve().then()</code>。在 setter 中只是「標記需要更新」，不立即執行 DOM 更新。同時設置一個 flag（<code>pendingUpdate = true</code>）防止重複排程。在 microtask 時機，執行一次 DOM 更新，然後清除 flag。這讓同一個 JS 執行環境中的所有 property 改變只觸發一次 DOM 更新。</p>

  <p><strong>updateComplete Promise：</strong>為了讓外部程式碼能夠等待 DOM 更新完成（例如在 E2E 測試中），提供一個 <code>updateComplete</code> getter 回傳 Promise，在每次 DOM 更新完成後 resolve。每次排程新的更新時建立新的 Promise。</p>

  <p><strong>我的實作步驟：</strong>1）定義靜態的 <code>reactiveProperties</code> Map，儲存每個 property 的設定；2）在 constructor 中遍歷 Map，用 <code>Object.defineProperty</code> 為每個 property 建立 getter/setter；3）setter 中比較值是否改變，有變化則呼叫 <code>requestUpdate()</code>；4）<code>requestUpdate()</code> 將 property 名稱和舊值加入 <code>changedProperties</code> Map，並呼叫 <code>scheduleUpdate()</code>；5）<code>scheduleUpdate()</code> 用 queueMicrotask 排程 <code>performUpdate()</code>；6）<code>performUpdate()</code> 呼叫子類別的 <code>update(changedProperties)</code>，DOM 更新後 resolve <code>updateComplete</code>。</p>

  <p><strong>這就是 Lit 核心的工作方式</strong>，理解了這個機制，你也就理解了為什麼 Lit 如此高效。</p>
</book-callout>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>Reactive Property 系統的核心是「在 setter 中追蹤變化，在 microtask 中批次更新 DOM」——這三個關鍵詞（setter 追蹤、microtask 批次、updateComplete 等待）就是面試時讓評審眼前一亮的完整答案。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch06">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">Custom Elements 的完整型別設計</span>
    </a>
    <a class="footer-link" href="#ch08">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">渲染策略 — 從 innerHTML 到 Virtual DOM</span>
    </a>
  </div>
</div>
`
