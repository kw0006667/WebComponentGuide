export const metadata = {
  id: 14,
  part: 3,
  title: 'Lit Context 與 Reactive Controllers',
  tags: ['Lit', '進階', '面試重點'] as string[],
  sections: [
    { slug: 'ch14-s01', title: 'Reactive Controller 協議 — 不需要框架的 Hook 系統' },
    { slug: 'ch14-s02', title: '實作 ResizeController、MouseController、FetchController' },
    { slug: 'ch14-s03', title: 'Context API（@lit/context）— Provider / Consumer 模式' },
    { slug: 'ch14-s04', title: 'Context vs. 全域 Store vs. Event Bus — 選擇正確工具的思路' },
    { slug: 'ch14-interview', title: '面試題：Lit 的 Context API 和 React Context 有什麼異同？' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 14 · 第三部：Lit Framework — 更精簡、更慣用的寫法</div>
  <h1>Lit Context 與 Reactive Controllers</h1>
  <p>Reactive Controllers 是 Lit 的「Hook 系統」——不需要框架，純粹基於物件協議，讓你將邏輯封裝成可複用的模組。Context API 則解決了跨元件層級的資料共享問題，是深層嵌套元件的最佳解法。</p>
  <div class="chapter-tags">
    <span class="tag tag-lit">Lit</span>
    <span class="tag tag-advanced">進階</span>
    <span class="tag tag-interview">面試重點</span>
  </div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch14-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">Reactive Controller 協議 — 不需要框架的 Hook 系統</span>
    </a>
    <a class="catalog-item" href="#ch14-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">實作 ResizeController、MouseController、FetchController</span>
    </a>
    <a class="catalog-item" href="#ch14-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">Context API（@lit/context）— Provider / Consumer 模式</span>
    </a>
    <a class="catalog-item" href="#ch14-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">Context vs. 全域 Store vs. Event Bus — 選擇正確工具的思路</span>
    </a>
    <a class="catalog-item" href="#ch14-interview">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">面試題：Lit 的 Context API 和 React Context 有什麼異同？</span>
    </a>
  </div>
</div>

<h2 id="ch14-s01">Reactive Controller 協議 — 不需要框架的 Hook 系統</h2>

<p>Reactive Controller 是一個輕量的協議（interface），讓你可以將任何有狀態的邏輯封裝成可複用的物件，並讓它的生命週期與宿主元件的生命週期同步。這個協議的核心非常簡單：</p>

<book-code-block language="typescript" label="ReactiveController 介面定義">
// Lit 的 ReactiveController 介面（來自 lit 套件的原始碼）
export interface ReactiveController {
  // 元件連接到 DOM 時呼叫
  hostConnected?(): void
  // 元件從 DOM 移除時呼叫
  hostDisconnected?(): void
  // 元件更新週期開始前呼叫（在 willUpdate 之前）
  hostUpdate?(): void
  // 元件更新週期完成後呼叫（在 updated 之後）
  hostUpdated?(): void
}

// ReactiveControllerHost 介面（LitElement 實作了這個介面）
export interface ReactiveControllerHost {
  addController(controller: ReactiveController): void
  removeController(controller: ReactiveController): void
  requestUpdate(): void
  readonly updateComplete: Promise&lt;boolean&gt;
}

// 使用方式：在 LitElement 中加入 Controller
import { LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('my-element')
class MyElement extends LitElement {
  // 建立 Controller 並傳入 this（宿主）
  private resize = new ResizeController(this)
  private mouse = new MouseController(this)
  private data = new FetchController&lt;User[]&gt;(this, '/api/users')

  override render() {
    return html\`
      &lt;p&gt;元件寬度：\${this.resize.contentRect.width}px&lt;/p&gt;
      &lt;p&gt;滑鼠位置：\${this.mouse.x}, \${this.mouse.y}&lt;/p&gt;
      \${this.data.loading ? html\`&lt;p&gt;載入中...&lt;/p&gt;\` : null}
    \`
  }
}
</book-code-block>

<h2 id="ch14-s02">實作 ResizeController、MouseController、FetchController</h2>

<p>以下是三個常用 Controller 的完整實作，展示 Controller 模式的各種使用情境。</p>

<book-code-block language="typescript" label="ResizeController：觀察元素尺寸變化">
import { ReactiveController, ReactiveControllerHost } from 'lit'

export class ResizeController implements ReactiveController {
  private host: ReactiveControllerHost &amp; Element
  private observer: ResizeObserver

  contentRect: DOMRectReadOnly = new DOMRectReadOnly()

  constructor(host: ReactiveControllerHost &amp; Element) {
    this.host = host
    this.observer = new ResizeObserver(entries =&gt; {
      for (const entry of entries) {
        this.contentRect = entry.contentRect
      }
      // 通知宿主需要重新渲染
      this.host.requestUpdate()
    })
    // 向宿主註冊，宿主會在適當時機呼叫生命週期方法
    host.addController(this)
  }

  hostConnected() {
    this.observer.observe(this.host)
  }

  hostDisconnected() {
    this.observer.disconnect()
  }
}
</book-code-block>

<book-code-block language="typescript" label="FetchController：帶有 AbortSignal 的資料抓取">
import { ReactiveController, ReactiveControllerHost } from 'lit'

export class FetchController&lt;T&gt; implements ReactiveController {
  private host: ReactiveControllerHost
  private url: string
  private abortController?: AbortController

  data: T | null = null
  loading = false
  error: Error | null = null

  constructor(host: ReactiveControllerHost, url: string) {
    this.host = host
    this.url = url
    host.addController(this)
  }

  hostConnected() {
    this.fetch()
  }

  hostDisconnected() {
    // 元件卸載時取消進行中的請求，防止記憶體洩漏
    this.abortController?.abort()
  }

  async fetch(url?: string): Promise&lt;void&gt; {
    this.abortController?.abort()
    this.abortController = new AbortController()

    if (url) this.url = url

    this.loading = true
    this.error = null
    this.data = null
    this.host.requestUpdate()

    try {
      const response = await fetch(this.url, {
        signal: this.abortController.signal,
      })

      if (!response.ok) {
        throw new Error('HTTP ' + response.status + ': ' + response.statusText)
      }

      this.data = (await response.json()) as T
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        this.error = err as Error
      }
    } finally {
      this.loading = false
      this.host.requestUpdate()
    }
  }
}

// 在元件中使用 FetchController
import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'

interface Post { id: number; title: string; body: string }

@customElement('post-list')
class PostList extends LitElement {
  private fetch = new FetchController&lt;Post[]&gt;(
    this,
    'https://jsonplaceholder.typicode.com/posts?_limit=5'
  )

  override render() {
    const { loading, error, data } = this.fetch

    if (loading) return html\`&lt;p&gt;載入中...&lt;/p&gt;\`
    if (error) return html\`&lt;p class="error"&gt;\${error.message}&lt;/p&gt;\`
    if (!data) return null

    return html\`
      &lt;ul&gt;
        \${data.map(post =&gt; html\`
          &lt;li&gt;
            &lt;strong&gt;\${post.title}&lt;/strong&gt;
            &lt;p&gt;\${post.body}&lt;/p&gt;
          &lt;/li&gt;
        \`)}
      &lt;/ul&gt;
      &lt;button @click=\${() =&gt; this.fetch.fetch()}&gt;重新載入&lt;/button&gt;
    \`
  }
}
</book-code-block>

<h2 id="ch14-s03">Context API（@lit/context）— Provider / Consumer 模式</h2>

<p><code>@lit/context</code> 實作了 Context Protocol，讓 Provider 元件可以向所有後代 Consumer 元件提供資料，而不需要一層一層手動傳遞 props（避免 Props Drilling）。它的底層機制是自訂事件（Context Request Event），完全基於 Web 標準。</p>

<book-code-block language="typescript" label="@lit/context：完整的 Provider / Consumer 實作">
import { createContext, provide, consume, ContextProvider, ContextConsumer } from '@lit/context'
import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'

// 1. 定義 Context 的型別和 key
interface AppUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

// createContext 建立一個唯一的 Context 物件，用型別參數確保型別安全
const userContext = createContext&lt;AppUser | null&gt;('app-user')
const themeContext = createContext&lt;'light' | 'dark'&gt;('app-theme')

// 2. Provider 元件：使用 @provide Decorator 提供資料
@customElement('app-provider')
class AppProviderElement extends LitElement {
  // @provide 讓這個 property 自動提供給所有後代 Consumer
  @provide({ context: userContext })
  @property({ attribute: false })
  user: AppUser | null = null

  @provide({ context: themeContext })
  @property({ reflect: true })
  theme: 'light' | 'dark' = 'light'

  override render() {
    return html\`
      &lt;button @click=\${this.loadUser}&gt;登入&lt;/button&gt;
      &lt;button @click=\${this.toggleTheme}&gt;切換主題&lt;/button&gt;
      &lt;slot&gt;&lt;/slot&gt;
    \`
  }

  private async loadUser() {
    // 模擬 API 呼叫
    this.user = { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin' }
  }

  private toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light'
  }
}

// 3. Consumer 元件：使用 @consume Decorator 接收資料
@customElement('user-avatar')
class UserAvatar extends LitElement {
  // @consume 讓這個 property 自動接收最近的 Provider 提供的值
  @consume({ context: userContext, subscribe: true })
  @property({ attribute: false })
  user: AppUser | null = null

  @consume({ context: themeContext, subscribe: true })
  theme: 'light' | 'dark' = 'light'

  override render() {
    if (!this.user) {
      return html\`&lt;div class="avatar guest"&gt;訪客&lt;/div&gt;\`
    }
    return html\`
      &lt;div class="avatar \${this.theme}"&gt;
        &lt;span class="initials"&gt;\${this.user.name.charAt(0)}&lt;/span&gt;
        &lt;span class="name"&gt;\${this.user.name}&lt;/span&gt;
        \${this.user.role === 'admin' ? html\`&lt;span class="badge"&gt;管理員&lt;/span&gt;\` : null}
      &lt;/div&gt;
    \`
  }
}

// 使用：不論 user-avatar 嵌套多深，都能取得 user 資料
// &lt;app-provider&gt;
//   &lt;div class="layout"&gt;
//     &lt;nav&gt;&lt;user-avatar&gt;&lt;/user-avatar&gt;&lt;/nav&gt;
//     &lt;main&gt;
//       &lt;section&gt;&lt;user-avatar&gt;&lt;/user-avatar&gt;&lt;/section&gt;
//     &lt;/main&gt;
//   &lt;/div&gt;
// &lt;/app-provider&gt;
</book-code-block>

<h2 id="ch14-s04">Context vs. 全域 Store vs. Event Bus — 選擇正確工具的思路</h2>

<table>
  <thead>
    <tr>
      <th>維度</th>
      <th>Context API</th>
      <th>全域 Store（Redux/Zustand）</th>
      <th>Event Bus</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>資料範圍</td>
      <td>Provider 子樹內</td>
      <td>全應用程式</td>
      <td>任意</td>
    </tr>
    <tr>
      <td>訂閱機制</td>
      <td>自動（subscribe: true）</td>
      <td>需要 selector 或 adapter</td>
      <td>手動訂閱/取消訂閱</td>
    </tr>
    <tr>
      <td>型別安全</td>
      <td>強（TypeScript 泛型）</td>
      <td>強（配合型別完整的 store）</td>
      <td>中（需要自訂型別）</td>
    </tr>
    <tr>
      <td>DevTools 支援</td>
      <td>無</td>
      <td>Redux DevTools（時間旅行）</td>
      <td>無</td>
    </tr>
    <tr>
      <td>適用情境</td>
      <td>Auth、Theme、i18n、局部共享資料</td>
      <td>複雜業務邏輯、需要調試的狀態</td>
      <td>兄弟元件通訊、一次性事件</td>
    </tr>
    <tr>
      <td>依賴</td>
      <td>@lit/context（~2KB）</td>
      <td>外部 store 套件</td>
      <td>無（或自製）</td>
    </tr>
  </tbody>
</table>

<book-callout variant="tip" title="決策樹">
  <p>「這份資料是整個應用程式的嗎？」→ 全域 Store。「這份資料只在某個子樹中共享？」→ Context API。「兩個元件需要一次性的事件通訊？」→ Custom Event / Event Bus。絕大多數的場景不需要全域 Store，Context API 已經足夠。</p>
</book-callout>

<h2 id="ch14-interview">面試題：Lit 的 Context API 和 React Context 有什麼異同？</h2>

<p>這是一道同時考驗你對 React 和 Web Components 生態的深度理解的面試題。以下是完整的比較分析：</p>

<h3>相同之處</h3>

<table>
  <thead>
    <tr><th>面向</th><th>Lit Context &amp; React Context 的共同點</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>問題解決</td>
      <td>都解決 Props Drilling 問題，讓深層元件直接存取祖先資料</td>
    </tr>
    <tr>
      <td>Provider / Consumer</td>
      <td>都使用 Provider 提供、Consumer 訂閱的架構</td>
    </tr>
    <tr>
      <td>自動訂閱</td>
      <td>Consumer 都能在資料變更時自動重新渲染</td>
    </tr>
    <tr>
      <td>型別安全</td>
      <td>都使用 TypeScript 泛型確保型別安全</td>
    </tr>
  </tbody>
</table>

<h3>關鍵差異</h3>

<table>
  <thead>
    <tr><th>面向</th><th>React Context</th><th>Lit Context</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>底層機制</td>
      <td>React 虛擬 DOM 樹的內部傳播</td>
      <td>Custom Event（context-request）在真實 DOM 樹上冒泡</td>
    </tr>
    <tr>
      <td>框架依賴</td>
      <td>必須在 React 元件樹中使用</td>
      <td>基於 Web 標準，可在任何框架中使用</td>
    </tr>
    <tr>
      <td>Shadow DOM</td>
      <td>不穿越 Shadow DOM</td>
      <td>使用 composed: true 的事件，可穿越 Shadow Boundary</td>
    </tr>
    <tr>
      <td>Provider 形式</td>
      <td>JSX 元素（&lt;Context.Provider value={...}&gt;）</td>
      <td>自訂元素（&lt;app-provider&gt;）或 ContextProvider 物件</td>
    </tr>
    <tr>
      <td>Consumer 形式</td>
      <td>useContext() Hook 或 Context.Consumer</td>
      <td>@consume Decorator 或 ContextConsumer Controller</td>
    </tr>
    <tr>
      <td>重新渲染範圍</td>
      <td>所有 Consumer 子樹重新渲染（需要 useMemo 優化）</td>
      <td>只有訂閱的 Consumer 元件重新渲染</td>
    </tr>
  </tbody>
</table>

<book-code-block language="typescript" label="Lit Context 底層的事件機制（非 @lit/context 使用者需要了解）">
// @lit/context 底層實際上使用了這個 Context Protocol
// Consumer 在連接時發出一個 context-request 事件
// Provider 監聽這個事件並提供資料

// 了解底層有助於在需要時手動實作或調試

// Consumer 發出的請求
const contextRequestEvent = new CustomEvent('context-request', {
  detail: {
    context: userContext,         // Context 物件（作為 key）
    callback: (value: AppUser, unsubscribe?: () =&gt; void) =&gt; {
      // Provider 呼叫這個 callback 來提供資料
      console.log('收到 Context 資料:', value)
      // unsubscribe 可以停止訂閱
    },
    subscribe: true,              // 是否在資料變更時持續通知
  },
  bubbles: true,
  composed: true,  // 可以穿越 Shadow Boundary！
})

element.dispatchEvent(contextRequestEvent)

// Provider 監聽並回應
document.addEventListener('context-request', (e: Event) =&gt; {
  const event = e as CustomEvent
  if (event.detail.context === userContext) {
    event.stopPropagation()  // 阻止繼續向上冒泡（由最近的 Provider 回應）
    event.detail.callback(currentUser)
  }
})
</book-code-block>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>Reactive Controllers 是 Lit 的 Hook 等效物，封裝有生命週期的可複用邏輯；Context API 基於 DOM 事件系統，讓跨層級的資料共享不需要 Props Drilling，且能穿越 Shadow Boundary——這是 React Context 做不到的。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch13">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">Lit Directives — 擴展 Template 引擎</span>
    </a>
    <a class="footer-link" href="#ch15">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">Lit Labs 與周邊生態系</span>
    </a>
  </div>
</div>
`
