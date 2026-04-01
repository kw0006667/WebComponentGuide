export const metadata = {
  id: 20,
  part: 4,
  title: '用 Web Components 建構 Micro-Frontend',
  tags: ['進階', '面試重點'] as string[],
  sections: [
    { slug: 'ch20-s01', title: '為什麼 Web Components 是 Micro-frontend 的天然原語' },
    { slug: 'ch20-s02', title: 'Module Federation 搭配 Web Components 的整合方式' },
    { slug: 'ch20-s03', title: '共享依賴管理 — 版本衝突的根本問題' },
    { slug: 'ch20-s04', title: '跨團隊契約：Custom Elements Manifest 的定義與使用' },
    { slug: 'ch20-s05', title: 'Single-SPA 整合實作' },
    { slug: 'ch20-interview', title: '面試題：為什麼 Web Components 適合用於 Micro-frontend 架構？' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 20 · 第四部：進階模式與系統架構</div>
  <h1>用 Web Components 建構 Micro-Frontend</h1>
  <p>Micro-Frontend 將大型前端應用拆分為可獨立部署的子應用，而 Web Components 的封裝性、框架無關性和瀏覽器原生支援，使其成為 Micro-Frontend 架構中最理想的整合邊界。本章探討完整的架構設計與實作策略。</p>
  <div class="chapter-tags">
    <span class="tag tag-advanced">進階</span>
    <span class="tag tag-interview">面試重點</span>
  </div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch20-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">為什麼 Web Components 是 Micro-frontend 的天然原語</span>
    </a>
    <a class="catalog-item" href="#ch20-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">Module Federation 搭配 Web Components 的整合方式</span>
    </a>
    <a class="catalog-item" href="#ch20-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">共享依賴管理 — 版本衝突的根本問題</span>
    </a>
    <a class="catalog-item" href="#ch20-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">跨團隊契約：Custom Elements Manifest 的定義與使用</span>
    </a>
    <a class="catalog-item" href="#ch20-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">Single-SPA 整合實作</span>
    </a>
    <a class="catalog-item" href="#ch20-interview">
      <span class="catalog-item-num">06</span>
      <span class="catalog-item-title">面試題：為什麼 Web Components 適合用於 Micro-frontend 架構？</span>
    </a>
  </div>
</div>

<h2 id="ch20-s01">為什麼 Web Components 是 Micro-frontend 的天然原語</h2>

<p>Micro-Frontend 架構的核心挑戰是讓不同團隊開發的子應用能夠在同一頁面中共存，且不互相干擾。Web Components 天然滿足這些需求：</p>

<ul>
  <li><strong>樣式隔離</strong>：Shadow DOM 讓每個子應用的 CSS 完全隔離，不同團隊的樣式不會互相污染</li>
  <li><strong>框架無關</strong>：A 團隊用 React，B 團隊用 Vue，C 團隊用 Angular，最終都包裝成 Custom Element，由 Shell App 統一使用</li>
  <li><strong>標準化介面</strong>：透過 HTML attributes、properties 和 CustomEvent，定義清晰的元件 API 契約</li>
  <li><strong>瀏覽器原生支援</strong>：不需要特殊的執行環境或框架協調層，直接用 <code>document.createElement()</code> 即可</li>
</ul>

<book-code-block language="text" label="架構示意 — Micro-Frontend with Web Components">
Shell Application（Host）
├── &lt;nav-menu&gt;          ← Team Navigation（React）
├── &lt;router-outlet&gt;
│   ├── &lt;product-app&gt;   ← Team Product（Vue 3）
│   │   ├── Shadow DOM（隔離樣式）
│   │   └── 完整的商品瀏覽 SPA
│   ├── &lt;checkout-app&gt;  ← Team Checkout（Angular）
│   │   ├── Shadow DOM（隔離樣式）
│   │   └── 完整的結帳流程 SPA
│   └── &lt;account-app&gt;   ← Team Account（Lit）
│       └── 帳號管理頁面
└── &lt;notification-center&gt; ← Team Platform（原生 WC）

跨應用通訊：
  - CustomEvent（冒泡至 Shell）
  - 共享 EventBus
  - URL（路由狀態）
</book-code-block>

<h2 id="ch20-s02">Module Federation 搭配 Web Components 的整合方式</h2>

<p>Webpack 5 的 Module Federation 允許在執行期動態載入來自不同伺服器的 JavaScript 模組。結合 Web Components，可以實現真正的獨立部署。</p>

<book-code-block language="javascript" label="JavaScript — Shell App 的 Webpack Module Federation 設定">
// shell/webpack.config.js
const { ModuleFederationPlugin } = require('webpack').container

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      // 從遠端載入子應用的 Web Components
      remotes: {
        // 格式：'別名': '遠端名稱@遠端URL/remoteEntry.js'
        productApp:  'product_app@https://products.myshop.com/remoteEntry.js',
        checkoutApp: 'checkout_app@https://checkout.myshop.com/remoteEntry.js',
        accountApp:  'account_app@https://account.myshop.com/remoteEntry.js',
      },
      // 共享依賴（避免重複載入）
      shared: {
        // lit 必須是單例，避免 Custom Elements 重複定義錯誤
        lit: { singleton: true, requiredVersion: '^3.0.0' },
        '@lit/reactive-element': { singleton: true },
      },
    }),
  ],
}
</book-code-block>

<book-code-block language="javascript" label="JavaScript — Product Sub-App 的 Module Federation 設定">
// product-app/webpack.config.js
const { ModuleFederationPlugin } = require('webpack').container

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'product_app',
      filename: 'remoteEntry.js',  // 進入點，供 Shell 載入
      // 暴露 Web Components 的定義模組
      exposes: {
        './ProductApp': './src/bootstrap.js', // 定義並 export &lt;product-app&gt; element
      },
      shared: {
        lit: { singleton: true, requiredVersion: '^3.0.0' },
      },
    }),
  ],
}
</book-code-block>

<book-code-block language="typescript" label="TypeScript — Shell App 動態載入並使用子應用">
// shell/src/app-loader.ts

// 載入並使用 Module Federation 的遠端元件
async function loadMicroApp(appName: string, elementTag: string): Promise&lt;void&gt; {
  // 動態 import 觸發 Module Federation 載入遠端 bundle
  try {
    switch (appName) {
      case 'product':
        await import('productApp/ProductApp')
        break
      case 'checkout':
        await import('checkoutApp/CheckoutApp')
        break
      case 'account':
        await import('accountApp/AccountApp')
        break
    }
    // import 完成後，Custom Element 已被 define
    // 直接使用 HTML tag 即可
    console.log(\`[Shell] \${elementTag} loaded successfully\`)
  } catch (err) {
    console.error(\`[Shell] Failed to load \${appName}:\`, err)
    // 顯示 fallback UI
    document.querySelector('#app-container')!.innerHTML = \`
      &lt;div class="error"&gt;子應用載入失敗，請稍後再試&lt;/div&gt;
    \`
  }
}

// 路由切換時按需載入
window.addEventListener('router:navigate', async (e) =&gt; {
  const path = location.pathname
  if (path.startsWith('/products') &amp;&amp; !customElements.get('product-app')) {
    await loadMicroApp('product', 'product-app')
  } else if (path.startsWith('/checkout') &amp;&amp; !customElements.get('checkout-app')) {
    await loadMicroApp('checkout', 'checkout-app')
  }
})
</book-code-block>

<h2 id="ch20-s03">共享依賴管理 — 版本衝突的根本問題</h2>

<p>Micro-Frontend 中最棘手的問題是共享依賴的版本衝突。Custom Elements Registry 是全域的，同一個 tag name 只能被定義一次，若不同子應用嘗試定義同名元件，會拋出 <code>DOMException</code>。</p>

<book-code-block language="typescript" label="TypeScript — 安全的 customElements.define 版本檢查模式">
// safe-define.ts

interface VersionedElement extends HTMLElement {
  readonly version?: string
}

/**
 * 安全的元件定義函式
 * 若 tag 已被定義，檢查版本相容性並決定是否覆蓋或警告
 */
export function safeDefine(
  tagName: string,
  constructor: CustomElementConstructor &amp; { version?: string },
  options?: ElementDefinitionOptions
): void {
  const existing = customElements.get(tagName)

  if (!existing) {
    // 尚未定義，直接定義
    customElements.define(tagName, constructor, options)
    return
  }

  const existingVersion = (existing as any).version
  const newVersion = constructor.version

  if (existingVersion === newVersion) {
    // 相同版本，忽略（重複載入同版本是安全的）
    console.debug(\`[safeDefine] &lt;\${tagName}&gt; v\${newVersion} already defined, skipping.\`)
    return
  }

  // 版本不同：根據語意版本決定
  const [existMaj] = (existingVersion ?? '0.0.0').split('.').map(Number)
  const [newMaj] = (newVersion ?? '0.0.0').split('.').map(Number)

  if (newMaj &gt; existMaj) {
    // 主版本更新：警告但不覆蓋（Custom Elements 無法重新定義）
    console.warn(
      \`[safeDefine] &lt;\${tagName}&gt; version conflict: \` +
      \`existing=\${existingVersion}, requested=\${newVersion}. \` +
      \`Cannot redefine — will use existing version.\`
    )
  } else {
    // 次版本或修訂版本：靜默使用已有版本
    console.info(\`[safeDefine] &lt;\${tagName}&gt; v\${existingVersion} &gt;= v\${newVersion}, using existing.\`)
  }
}

// 使用範例
class ProductCard extends HTMLElement {
  static version = '2.1.0'
  // ...
}

safeDefine('product-card', ProductCard)
</book-code-block>

<h2 id="ch20-s04">跨團隊契約：Custom Elements Manifest 的定義與使用</h2>

<p>Custom Elements Manifest（CEM）是一個機器可讀的 JSON 格式，描述 Web Component 的完整 API：屬性、事件、Slot、CSS 變數等。它是跨團隊協作的正式契約，可用於自動生成文件、IDE 提示和型別檢查。</p>

<book-code-block language="json" label="JSON — Custom Elements Manifest 範例（custom-elements.json）">
{
  "schemaVersion": "1.0.0",
  "readme": "",
  "modules": [
    {
      "kind": "javascript-module",
      "path": "src/components/product-card.js",
      "declarations": [
        {
          "kind": "class",
          "description": "商品卡片元件，顯示商品圖片、名稱、價格",
          "name": "ProductCard",
          "tagName": "product-card",
          "customElement": true,
          "version": "2.1.0",
          "attributes": [
            {
              "name": "product-id",
              "type": { "text": "string" },
              "description": "商品的唯一識別碼",
              "fieldName": "productId"
            },
            {
              "name": "currency",
              "type": { "text": "'TWD' | 'USD' | 'JPY'" },
              "default": "'TWD'",
              "description": "顯示貨幣"
            }
          ],
          "properties": [
            {
              "name": "product",
              "type": { "text": "Product | null" },
              "description": "完整商品物件，透過 JS property 設定"
            }
          ],
          "events": [
            {
              "name": "add-to-cart",
              "type": { "text": "CustomEvent&lt;{ productId: string; quantity: number }&gt;" },
              "description": "使用者點擊加入購物車時觸發"
            },
            {
              "name": "product-view",
              "type": { "text": "CustomEvent&lt;{ productId: string }&gt;" },
              "description": "元件進入視窗時觸發（用於分析）"
            }
          ],
          "slots": [
            {
              "name": "",
              "description": "預設 slot，放置額外的操作按鈕"
            },
            {
              "name": "badge",
              "description": "商品標籤（如「新品」、「特價」）"
            }
          ],
          "cssProperties": [
            {
              "name": "--product-card-radius",
              "default": "12px",
              "description": "卡片圓角半徑"
            },
            {
              "name": "--product-card-shadow",
              "default": "0 2px 8px rgba(0,0,0,0.1)",
              "description": "卡片陰影"
            }
          ]
        }
      ]
    }
  ]
}
</book-code-block>

<book-code-block language="bash" label="Shell — 使用 @custom-elements-manifest/analyzer 自動生成 CEM">
# 安裝分析工具
npm install --save-dev @custom-elements-manifest/analyzer

# 自動分析原始碼生成 custom-elements.json
npx cem analyze --globs "src/**/*.ts" --outdir .

# 搭配 JSDoc 標註可生成更詳細的文件
# @element product-card
# @fires {CustomEvent&lt;{productId: string}&gt;} add-to-cart
# @cssprop --product-card-radius
</book-code-block>

<h2 id="ch20-s05">Single-SPA 整合實作</h2>

<p>Single-SPA 是最成熟的 Micro-Frontend 框架，支援多種整合模式。搭配 Web Components 可以實現「以 WC 為介面，Single-SPA 管理生命週期」的混合架構。</p>

<book-code-block language="typescript" label="TypeScript — Single-SPA 整合 Web Components">
// npm install single-spa

// ===== shell/src/main.ts — Shell Application =====
import { registerApplication, start } from 'single-spa'

registerApplication({
  name: 'product-app',
  // 動態載入子應用的 lifecycle 函式
  app: () =&gt; import('productApp/lifecycle'),
  // 此路由時啟動
  activeWhen: ['/products'],
  // 傳遞給子應用的 props
  customProps: {
    domElement: document.getElementById('product-container'),
    authToken: () =&gt; sessionStorage.getItem('token'),
  },
})

registerApplication({
  name: 'checkout-app',
  app: () =&gt; import('checkoutApp/lifecycle'),
  activeWhen: ['/checkout'],
  customProps: {
    domElement: document.getElementById('checkout-container'),
  },
})

// 啟動 Single-SPA
start()

// ===== product-app/src/lifecycle.ts — 子應用 Lifecycle =====
// 子應用暴露 Single-SPA 標準 lifecycle 函式

let productAppElement: HTMLElement | null = null

// bootstrap：只執行一次，用於初始化
export async function bootstrap() {
  // 動態載入 Web Components 定義
  await import('./components/product-list')
  await import('./components/product-detail')
  console.log('[ProductApp] Bootstrap complete')
}

// mount：每次路由激活時呼叫
export async function mount(props: { domElement: HTMLElement; authToken: () =&gt; string | null }) {
  const { domElement, authToken } = props

  // 建立根元件並掛載到 Shell 提供的容器
  productAppElement = document.createElement('product-list')

  // 注入認證 token（透過 property）
  ;(productAppElement as any).authToken = authToken()

  domElement.appendChild(productAppElement)
  console.log('[ProductApp] Mounted')
}

// unmount：路由離開時呼叫
export async function unmount(props: { domElement: HTMLElement }) {
  productAppElement?.remove()
  productAppElement = null
  console.log('[ProductApp] Unmounted')
}

// update（可選）：props 變更時呼叫
export async function update(props: { authToken: () =&gt; string | null }) {
  if (productAppElement) {
    ;(productAppElement as any).authToken = props.authToken()
  }
}
</book-code-block>

<h2 id="ch20-interview">面試題：為什麼 Web Components 適合用於 Micro-frontend 架構？</h2>

<div class="interview-qa">
  <p><strong>Q：你們公司有多個團隊分別開發不同的前端子應用，技術棧不統一。你會如何設計 Micro-Frontend 架構，Web Components 在其中扮演什麼角色？</strong></p>

  <p><strong>A（分層回答）：</strong></p>

  <p><strong>為什麼選 Web Components：</strong>Web Components 是瀏覽器標準，不依賴任何框架。無論子應用用 React、Vue 還是 Angular 開發，最終都可以包裝成 Custom Element 暴露給 Shell。Shadow DOM 提供天然的樣式隔離，防止子應用間的 CSS 污染。</p>

  <p><strong>架構設計：</strong>我會採用三層架構：(1) <strong>Shell Application</strong> 負責路由、認證、全域狀態和子應用的載入協調；(2) <strong>各子應用</strong> 以 Web Component 為介面（透過 Module Federation 動態載入），暴露 <code>mount/unmount</code> 生命週期（或使用 Single-SPA）；(3) <strong>共享設計系統</strong> 作為獨立套件，提供統一的 UI 元件庫。</p>

  <p><strong>關鍵難題與解法：</strong>(1) 版本衝突 → 使用 <code>safeDefine</code> 模式 + Module Federation singleton 設定；(2) 跨應用通訊 → CustomEvent 冒泡 + 全域 EventBus；(3) 契約管理 → Custom Elements Manifest 作為正式 API 文件；(4) 效能 → 路由切換時才動態載入子應用。</p>
</div>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>Web Components 的框架無關性和 Shadow DOM 隔離使其成為 Micro-Frontend 最理想的整合邊界，搭配 Module Federation 實現獨立部署，Custom Elements Manifest 建立跨團隊契約，Single-SPA 管理生命週期協調。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch19">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">Server-Side Rendering 與 Declarative Shadow DOM</span>
    </a>
    <a class="footer-link" href="#ch21">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">跨框架互通性 — 在 React / Angular / Vue 的世界裡生存</span>
    </a>
  </div>
</div>
`
