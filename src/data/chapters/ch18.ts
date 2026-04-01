export const metadata = {
  id: 18,
  part: 4,
  title: '在 Web Component 應用中實作 Client-Side Routing',
  tags: ['進階'] as string[],
  sections: [
    { slug: 'ch18-s01', title: 'History API 與 Hash Routing — 基本原理' },
    { slug: 'ch18-s02', title: '從零打造一個最小可用的 <app-router> 元件' },
    { slug: 'ch18-s03', title: '用動態 import() 實現路由元件的 Lazy Loading' },
    { slug: 'ch18-s04', title: 'Vaadin Router — Web Components 生態的主流路由方案' },
    { slug: 'ch18-s05', title: 'Route Guard、巢狀路由與頁面切換動畫' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 18 · 第四部：進階模式與系統架構</div>
  <h1>在 Web Component 應用中實作 Client-Side Routing</h1>
  <p>Client-Side Routing 讓 Web 應用程式無需完整頁面重載即可切換視圖，是 SPA 架構的核心技術。本章從 History API 原理出發，帶您實作一個完整的路由器元件，並介紹 Web Components 生態中最成熟的路由解決方案。</p>
  <div class="chapter-tags">
    <span class="tag tag-advanced">進階</span>
  </div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch18-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">History API 與 Hash Routing — 基本原理</span>
    </a>
    <a class="catalog-item" href="#ch18-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">從零打造一個最小可用的 &lt;app-router&gt; 元件</span>
    </a>
    <a class="catalog-item" href="#ch18-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">用動態 import() 實現路由元件的 Lazy Loading</span>
    </a>
    <a class="catalog-item" href="#ch18-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">Vaadin Router — Web Components 生態的主流路由方案</span>
    </a>
    <a class="catalog-item" href="#ch18-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">Route Guard、巢狀路由與頁面切換動畫</span>
    </a>
  </div>
</div>

<h2 id="ch18-s01">History API 與 Hash Routing — 基本原理</h2>

<p>瀏覽器提供兩種 Client-Side Routing 機制，各有適用場景：</p>

<table>
  <thead>
    <tr>
      <th>特性</th>
      <th>History API（推薦）</th>
      <th>Hash Routing</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>URL 格式</td>
      <td><code>/products/123</code></td>
      <td><code>/#/products/123</code></td>
    </tr>
    <tr>
      <td>伺服器設定</td>
      <td>需要 catch-all 重導向</td>
      <td>不需要，# 後不送到伺服器</td>
    </tr>
    <tr>
      <td>SEO 友善度</td>
      <td>友善（標準 URL）</td>
      <td>較差（爬蟲可能忽略 #）</td>
    </tr>
    <tr>
      <td>監聽事件</td>
      <td><code>popstate</code></td>
      <td><code>hashchange</code></td>
    </tr>
    <tr>
      <td>程式導航</td>
      <td><code>history.pushState()</code></td>
      <td><code>location.hash = '...'</code></td>
    </tr>
    <tr>
      <td>適用場景</td>
      <td>正式產品、有伺服器控制時</td>
      <td>靜態部署、GitHub Pages</td>
    </tr>
  </tbody>
</table>

<book-code-block language="typescript" label="TypeScript — History API 基礎操作">
// pushState：新增歷史紀錄（不重新載入頁面）
history.pushState(
  { userId: 123 },      // state 物件（可儲存任何可序列化的資料）
  '',                   // title（目前大多數瀏覽器忽略此參數）
  '/users/123'          // 新的 URL
)

// replaceState：取代當前歷史紀錄（不新增）
history.replaceState(null, '', '/login?redirect=/dashboard')

// 監聽瀏覽器的前進/後退
window.addEventListener('popstate', (event) =&gt; {
  console.log('URL 變更為:', location.pathname)
  console.log('State 物件:', event.state)
  renderCurrentRoute()
})

// 注意：pushState 不會觸發 popstate
// 需要自行呼叫 render 函式
function navigate(path: string, state?: unknown) {
  history.pushState(state, '', path)
  renderCurrentRoute() // 手動觸發
}

function renderCurrentRoute() {
  const path = location.pathname
  // 根據 path 決定渲染哪個元件
}
</book-code-block>

<h2 id="ch18-s02">從零打造一個最小可用的 &lt;app-router&gt; 元件</h2>

<p>理解原理後，讓我們實作一個完整的 <code>&lt;app-router&gt;</code> 自訂元件。它支援動態路由參數（<code>/users/:id</code>）、404 fallback，並與 <code>&lt;app-link&gt;</code> 元件協同工作。</p>

<book-code-block language="typescript" label="TypeScript — 完整 AppRouter 實作（~60 行核心邏輯）">
// app-router.ts

interface RouteDefinition {
  path: string
  component: string           // Custom Element 的 tag name
  loader?: () =&gt; Promise&lt;void&gt; // 動態 import loader
}

interface MatchResult {
  route: RouteDefinition
  params: Record&lt;string, string&gt;
}

// 路由比對：支援 /users/:id 等動態參數
function matchRoute(routes: RouteDefinition[], pathname: string): MatchResult | null {
  for (const route of routes) {
    const pattern = route.path.replace(/:([^/]+)/g, '(?&lt;$1&gt;[^/]+)')
    const regex = new RegExp(\`^\${pattern}$\`)
    const match = pathname.match(regex)
    if (match) {
      return { route, params: match.groups ?? {} }
    }
  }
  return null
}

class AppRouter extends HTMLElement {
  private _routes: RouteDefinition[] = []
  private _currentComponent: HTMLElement | null = null

  // 允許從 JS 設定路由表
  set routes(value: RouteDefinition[]) {
    this._routes = value
  }

  connectedCallback() {
    // 監聽瀏覽器前進/後退
    window.addEventListener('popstate', this._handleRouteChange)
    // 監聽自訂的 navigate 事件（來自 app-link 元件）
    window.addEventListener('router:navigate', this._handleRouteChange as EventListener)
    // 初始渲染
    this._handleRouteChange()
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this._handleRouteChange)
    window.removeEventListener('router:navigate', this._handleRouteChange as EventListener)
  }

  private _handleRouteChange = async () =&gt; {
    const pathname = location.pathname
    const result = matchRoute(this._routes, pathname)

    if (!result) {
      this._render404()
      return
    }

    const { route, params } = result

    // 如果有 loader（lazy import），先等待載入
    if (route.loader) {
      this.setAttribute('loading', '')
      await route.loader()
      this.removeAttribute('loading')
    }

    // 確保 Custom Element 已被定義
    await customElements.whenDefined(route.component)

    // 移除舊元件
    this._currentComponent?.remove()

    // 建立新元件並傳入 params
    const el = document.createElement(route.component) as HTMLElement &amp; { params?: Record&lt;string, string&gt; }
    el.params = params
    this.appendChild(el)
    this._currentComponent = el
  }

  private _render404() {
    this._currentComponent?.remove()
    this.innerHTML = \`
      &lt;div class="not-found"&gt;
        &lt;h1&gt;404&lt;/h1&gt;
        &lt;p&gt;找不到頁面：\${location.pathname}&lt;/p&gt;
        &lt;a href="/"&gt;回首頁&lt;/a&gt;
      &lt;/div&gt;
    \`
  }
}

customElements.define('app-router', AppRouter)

// ===== app-link.ts — 攔截點擊，使用 history.pushState =====
class AppLink extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', this._handleClick)
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._handleClick)
  }

  private _handleClick = (e: Event) =&gt; {
    e.preventDefault()
    const href = this.getAttribute('href')
    if (!href) return

    history.pushState(null, '', href)
    window.dispatchEvent(new CustomEvent('router:navigate'))
  }
}

customElements.define('app-link', AppLink)
</book-code-block>

<book-code-block language="html" label="HTML — 使用 app-router">
&lt;!-- 設定路由表 --&gt;
&lt;app-router id="router"&gt;&lt;/app-router&gt;

&lt;script type="module"&gt;
  const router = document.getElementById('router')
  router.routes = [
    { path: '/',           component: 'home-page' },
    { path: '/products',   component: 'product-list' },
    { path: '/products/:id', component: 'product-detail',
      loader: () =&gt; import('./pages/product-detail.js') },
    { path: '/about',      component: 'about-page' },
  ]
&lt;/script&gt;

&lt;!-- 導航連結 --&gt;
&lt;nav&gt;
  &lt;app-link href="/"&gt;首頁&lt;/app-link&gt;
  &lt;app-link href="/products"&gt;商品列表&lt;/app-link&gt;
  &lt;app-link href="/about"&gt;關於我們&lt;/app-link&gt;
&lt;/nav&gt;
</book-code-block>

<h2 id="ch18-s03">用動態 import() 實現路由元件的 Lazy Loading</h2>

<p>大型應用程式應避免在初始載入時引入所有頁面元件。動態 <code>import()</code> 搭配路由系統，可以實現按需載入，顯著改善首屏效能。</p>

<book-code-block language="typescript" label="TypeScript — 路由定義中的 Lazy Loading 模式">
// routes.ts — 集中管理路由定義

export interface LazyRoute {
  path: string
  component: string
  // 動態 import 函式，只在導航到此路由時才執行
  loader: () =&gt; Promise&lt;unknown&gt;
  // 可選：進入前預載入（hover 時觸發）
  preload?: () =&gt; Promise&lt;unknown&gt;
}

export const routes: LazyRoute[] = [
  {
    path: '/',
    component: 'home-page',
    // 首頁可能需要立即載入
    loader: () =&gt; import('./pages/home-page'),
  },
  {
    path: '/dashboard',
    component: 'dashboard-page',
    loader: () =&gt; import('./pages/dashboard-page'),
    preload: () =&gt; import('./pages/dashboard-page'), // 登入後預載入
  },
  {
    path: '/products/:id',
    component: 'product-detail',
    loader: async () =&gt; {
      // 可以同時載入多個依賴
      await Promise.all([
        import('./pages/product-detail'),
        import('./components/product-gallery'),
        import('./components/review-section'),
      ])
    },
  },
  {
    path: '/admin/:section',
    component: 'admin-panel',
    loader: () =&gt; import('./pages/admin-panel'),
  },
]

// ===== 搭配 prefetch 的 app-link 增強版 =====
class SmartLink extends HTMLElement {
  private _prefetchTimer?: number

  connectedCallback() {
    this.addEventListener('click', this._handleClick)
    // 滑鼠懸停 200ms 後預載入
    this.addEventListener('mouseenter', this._schedulePrefetch)
    this.addEventListener('mouseleave', this._cancelPrefetch)
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._handleClick)
    this.removeEventListener('mouseenter', this._schedulePrefetch)
    this.removeEventListener('mouseleave', this._cancelPrefetch)
  }

  private _schedulePrefetch = () =&gt; {
    const href = this.getAttribute('href')
    if (!href) return

    this._prefetchTimer = window.setTimeout(async () =&gt; {
      const matched = routes.find(r =&gt; r.path === href)
      if (matched?.preload) {
        console.log(\`[SmartLink] Prefetching \${href}\`)
        await matched.preload()
      }
    }, 200)
  }

  private _cancelPrefetch = () =&gt; {
    clearTimeout(this._prefetchTimer)
  }

  private _handleClick = (e: Event) =&gt; {
    e.preventDefault()
    clearTimeout(this._prefetchTimer)
    const href = this.getAttribute('href')
    if (!href) return
    history.pushState(null, '', href)
    window.dispatchEvent(new CustomEvent('router:navigate'))
  }
}

customElements.define('smart-link', SmartLink)
</book-code-block>

<h2 id="ch18-s04">Vaadin Router — Web Components 生態的主流路由方案</h2>

<p>Vaadin Router 是專為 Web Components 設計的路由函式庫，支援巢狀路由、動畫、Guards 等進階功能，是目前 Web Components 生態中最成熟的路由解決方案。</p>

<book-code-block language="typescript" label="TypeScript — Vaadin Router 完整設定">
// npm install @vaadin/router
import { Router } from '@vaadin/router'

// 1. 取得路由出口元素
const outlet = document.getElementById('router-outlet')!

// 2. 建立路由器實例
const router = new Router(outlet)

// 3. 設定路由表
await router.setRoutes([
  {
    path: '/',
    component: 'home-page',
    action: async () =&gt; { await import('./pages/home-page') },
  },
  {
    path: '/login',
    component: 'login-page',
    action: async () =&gt; { await import('./pages/login-page') },
  },
  {
    // 巢狀路由：需要認證的區域
    path: '/app',
    component: 'app-layout',
    action: async (context, commands) =&gt; {
      await import('./layouts/app-layout')
      // Guard：未登入重導向
      if (!isAuthenticated()) {
        return commands.redirect('/login')
      }
    },
    children: [
      {
        path: '/dashboard',
        component: 'dashboard-page',
        action: async () =&gt; { await import('./pages/dashboard-page') },
      },
      {
        path: '/profile',
        component: 'profile-page',
        action: async () =&gt; { await import('./pages/profile-page') },
      },
      {
        path: '/settings/:tab',
        component: 'settings-page',
        action: async () =&gt; { await import('./pages/settings-page') },
      },
    ],
  },
  {
    path: '(.*)',          // 萬用 404
    component: 'not-found-page',
  },
])

// 4. 在頁面元件中讀取路由資訊
class SettingsPage extends HTMLElement {
  // Vaadin Router 會注入 location 屬性
  location?: { params: { tab?: string }; pathname: string }

  connectedCallback() {
    const tab = this.location?.params.tab ?? 'general'
    this.innerHTML = \`&lt;h1&gt;設定 - \${tab}&lt;/h1&gt;\`
  }
}

customElements.define('settings-page', SettingsPage)

function isAuthenticated(): boolean {
  return !!sessionStorage.getItem('authToken')
}
</book-code-block>

<h2 id="ch18-s05">Route Guard、巢狀路由與頁面切換動畫</h2>

<p>Route Guard 是在路由切換前執行的攔截邏輯，常用於權限驗證。配合 CSS View Transitions API，可以實現流暢的頁面切換動畫。</p>

<book-code-block language="typescript" label="TypeScript — Route Guard 與 View Transitions 整合">
// router-with-transitions.ts

type GuardFn = (to: string, from: string) =&gt; boolean | string | Promise&lt;boolean | string&gt;

class EnhancedRouter extends HTMLElement {
  private _routes: Array&lt;{ path: RegExp; component: string; guards?: GuardFn[] }&gt; = []
  private _currentPath = ''

  connectedCallback() {
    window.addEventListener('popstate', this._handleNavigate)
    window.addEventListener('router:navigate', this._handleNavigate as EventListener)
    this._currentPath = location.pathname
    this._render(location.pathname, false)
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this._handleNavigate)
    window.removeEventListener('router:navigate', this._handleNavigate as EventListener)
  }

  private _handleNavigate = async () =&gt; {
    const to = location.pathname
    const from = this._currentPath

    // 執行 View Transition（瀏覽器支援時）
    if ('startViewTransition' in document) {
      await (document as any).startViewTransition(() =&gt; this._render(to, true, from))
    } else {
      await this._render(to, true, from)
    }

    this._currentPath = to
  }

  private async _render(pathname: string, animate: boolean, fromPath = '') {
    // Guard 驗證
    for (const routeConfig of this._routes) {
      if (!routeConfig.path.test(pathname)) continue
      if (!routeConfig.guards) break

      for (const guard of routeConfig.guards) {
        const result = await guard(pathname, fromPath)
        if (result === false) {
          // Guard 攔截，不切換
          history.replaceState(null, '', fromPath)
          return
        }
        if (typeof result === 'string') {
          // Guard 重導向
          history.pushState(null, '', result)
          return
        }
      }
    }

    // 找到匹配的路由並渲染（省略完整比對邏輯）
    this.innerHTML = \`&lt;div class="\${animate ? 'page-enter' : ''}"&gt;Loading...&lt;/div&gt;\`
  }
}

// CSS — View Transitions 頁面切換動畫
// 在全域 CSS 中加入：
const transitionStyles = \`
  /* 舊頁面淡出 */
  ::view-transition-old(root) {
    animation: 200ms ease-out fade-out;
  }
  /* 新頁面滑入 */
  ::view-transition-new(root) {
    animation: 300ms ease-in slide-in;
  }
  @keyframes fade-out {
    to { opacity: 0; transform: translateX(-20px); }
  }
  @keyframes slide-in {
    from { opacity: 0; transform: translateX(20px); }
  }
\`

// 注入樣式
const styleEl = document.createElement('style')
styleEl.textContent = transitionStyles
document.head.appendChild(styleEl)

customElements.define('enhanced-router', EnhancedRouter)
</book-code-block>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>Client-Side Routing 的核心是 <code>history.pushState</code> + <code>popstate</code> 事件；實際產品推薦使用 Vaadin Router，並搭配動態 <code>import()</code> 實現按需載入，以 View Transitions API 提升使用者體驗。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch17">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">大規模狀態管理</span>
    </a>
    <a class="footer-link" href="#ch19">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">Server-Side Rendering 與 Declarative Shadow DOM</span>
    </a>
  </div>
</div>
`
