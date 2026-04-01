export const metadata = {
  id: 5,
  part: 1,
  title: 'ES Modules、Import Maps 與現代開發工具鏈',
  tags: [] as string[],
  sections: [
    { slug: 'ch05-s01', title: '瀏覽器原生 ES Modules — 何時不需要 Bundler，何時才該加入' },
    { slug: 'ch05-s02', title: 'Import Maps：在瀏覽器原生解析 Bare Specifiers' },
    { slug: 'ch05-s03', title: '建立 TypeScript + Vite 的 Web Components 專案' },
    { slug: 'ch05-s04', title: 'tsconfig 中與 DOM 型別相關的重要設定' },
    { slug: 'ch05-s05', title: 'Decorators：experimentalDecorators 與 TC39 Stage 3 Decorators 的差異' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 05 · 第一部：基礎篇 — Web 平台的原生能力</div>
  <h1>ES Modules、Import Maps 與現代開發工具鏈</h1>
  <p>Web Components 可以完全無需建置工具地在瀏覽器中運作，但在真實的生產環境中，TypeScript 型別安全、程式碼分割和開發熱更新仍然不可或缺。本章梳理從「零工具」到「完整工具鏈」的決策思路，深入 Import Maps 的使用，並建立一個開箱即用的 TypeScript + Vite 開發環境。</p>
  <div class="chapter-tags"><span class="tag tag-core">核心觀念</span></div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch05-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">瀏覽器原生 ES Modules</span>
    </a>
    <a class="catalog-item" href="#ch05-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">Import Maps</span>
    </a>
    <a class="catalog-item" href="#ch05-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">TypeScript + Vite 專案建立</span>
    </a>
    <a class="catalog-item" href="#ch05-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">tsconfig DOM 型別設定</span>
    </a>
    <a class="catalog-item" href="#ch05-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">Decorators 差異比較</span>
    </a>
  </div>
</div>

<h2 id="ch05-s01">瀏覽器原生 ES Modules — 何時不需要 Bundler，何時才該加入</h2>

<p>自 2018 年起，所有主流瀏覽器都支援原生 ES Modules（<code>&lt;script type="module"&gt;</code>）。這意味著在某些場景下，你完全不需要 Webpack、Vite 或任何打包工具，就能開發和部署使用 ES Modules 的 Web Components。</p>

<p>瀏覽器原生 ES Modules 的運作方式是：當遇到 <code>import</code> 語法時，瀏覽器會向網路發出額外的 HTTP 請求取得對應的模組檔案。這非常直觀，但也帶來了問題：如果你有幾十個模組，瀏覽器就會發出幾十個 HTTP 請求，即使在 HTTP/2 的多路複用下，大量小請求的開銷仍然不可忽視。</p>

<book-code-block language="typescript" label="原生 ES Modules 的基本用法">
// ── 不需要 Bundler 的完整 Web Component 範例 ──

// 檔案：src/components/my-button.ts（直接在瀏覽器執行）
export class MyButton extends HTMLElement {
  static get observedAttributes() { return ['variant', 'disabled'] }

  connectedCallback() {
    this.attachShadow({ mode: 'open' })
    this.render()
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render()
  }

  private render() {
    if (!this.shadowRoot) return
    const variant = this.getAttribute('variant') || 'primary'
    const disabled = this.hasAttribute('disabled')

    this.shadowRoot.innerHTML = \`
      &lt;style&gt;
        :host { display: inline-block; }
        button {
          padding: 8px 16px; border: none; border-radius: 6px;
          cursor: \${disabled ? 'not-allowed' : 'pointer'};
          opacity: \${disabled ? 0.5 : 1};
          background: \${variant === 'danger' ? '#dc2626' : '#4f46e5'};
          color: white; font-size: 0.875rem;
        }
      &lt;/style&gt;
      &lt;button \${disabled ? 'disabled' : ''}&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/button&gt;
    \`
  }
}

customElements.define('my-button', MyButton)

// 檔案：src/main.ts（入口點）
// import { MyButton } from './components/my-button.js'  // ← 注意：瀏覽器需要 .js 副檔名
// customElements.define('my-button', MyButton)

// HTML 入口：
// &lt;script type="module" src="/src/main.ts"&gt;&lt;/script&gt;
// （Vite 會自動轉換 .ts，純瀏覽器需要先編譯為 .js）
</book-code-block>

<h3>何時不需要 Bundler</h3>
<ul>
  <li>開發/原型階段：使用 Vite 的 dev server（它做的是即時轉譯，不是打包）</li>
  <li>小型內部工具（少於 20 個 JS 檔案）：HTTP/2 + CDN 足以處理請求數量</li>
  <li>使用 CDN 直接載入的情境（如 esm.sh、unpkg）</li>
  <li>不需要 TypeScript 轉譯的純 JS 專案</li>
</ul>

<h3>何時必須加入 Bundler</h3>
<ul>
  <li>使用 TypeScript（需要編譯步驟）</li>
  <li>生產環境部署（需要最小化、tree-shaking、程式碼分割）</li>
  <li>大型應用（多於 50 個模組，HTTP 請求數量影響 FCP）</li>
  <li>需要 CSS Modules、圖片匯入等非標準特性</li>
  <li>需要 SSR/SSG 支援</li>
</ul>

<book-callout variant="tip" title="Vite 是最佳選擇">
  <p>對於 Web Components 開發，Vite 是目前最推薦的工具。開發環境它使用 esbuild 做即時轉譯（不打包，速度極快），生產環境用 Rollup 打包（小 bundle 體積）。更重要的是，Vite 的 lib 模式天生支援輸出純 ESM 的元件庫，非常適合發布 Web Components 設計系統。</p>
</book-callout>

<h2 id="ch05-s02">Import Maps：在瀏覽器原生解析 Bare Specifiers</h2>

<p>一個「Bare Specifier」是指不含路徑前綴的 import 路徑，如 <code>import 'lit'</code> 或 <code>import { html } from 'lit/html.js'</code>。瀏覽器本來不支援 Bare Specifiers——它不知道要去哪裡找 <code>lit</code>。Import Maps 解決了這個問題，讓你告訴瀏覽器如何解析這些名稱。</p>

<book-code-block language="typescript" label="Import Maps 完整使用指南">
// ── HTML 中的 Import Map 定義 ──
// &lt;script type="importmap"&gt;
// {
//   "imports": {
//     "lit": "https://esm.sh/lit@3.1.0",
//     "lit/": "https://esm.sh/lit@3.1.0/",
//     "@my-org/design-system": "/dist/design-system.js",
//     "@my-org/design-system/": "/dist/design-system/"
//   },
//   "scopes": {
//     "/legacy-app/": {
//       "lit": "https://esm.sh/lit@2.0.0"
//     }
//   }
// }
// &lt;/script&gt;

// ── 使用 Import Map 後，JS 可以這樣寫 ──
// import { LitElement, html, css } from 'lit'       // ← 瀏覽器解析為 esm.sh URL
// import { repeat } from 'lit/directives/repeat.js' // ← 尾斜線匹配

// ── scopes：為特定路徑下的程式碼設定不同的解析規則 ──
// 這讓你可以在同一頁面中同時使用 lit 2.x 和 lit 3.x（不推薦，但在 migration 期間有用）

// ── 程式碼範例：搭配 Import Map 使用 Lit ──
// 以下程式碼需要上面的 Import Map 才能在純瀏覽器環境執行
// （使用 Vite 時不需要 Import Map，Vite 負責解析 bare specifiers）

// import { LitElement, html, css } from 'lit'
// import { property, customElement } from 'lit/decorators.js'

// @customElement('my-greeting')
// class MyGreeting extends LitElement {
//   @property() name = 'World'
//
//   static styles = css\`
//     :host { display: block; }
//     h1 { color: #4f46e5; }
//   \`
//
//   render() {
//     return html\`&lt;h1&gt;Hello, \${this.name}!&lt;/h1&gt;\`
//   }
// }

// ── 動態 Import Map（JavaScript API）──
// 注意：Import Map 必須在所有 module scripts 之前定義，
// 目前不支援動態修改（這是規範的設計決策）

// ── 使用 @jsenv/importmap-node-module 生成 Import Map ──
// 這個工具可以自動從 node_modules 生成 Import Map，
// 讓你在不用打包工具的情況下使用 npm 套件

// 模擬 esm.sh 的 URL 結構：
function getEsmShUrl(pkg: string, version: string, path?: string): string {
  const base = \`https://esm.sh/\${pkg}@\${version}\`
  return path ? \`\${base}/\${path}\` : base
}

console.log(getEsmShUrl('lit', '3.1.0'))           // https://esm.sh/lit@3.1.0
console.log(getEsmShUrl('lit', '3.1.0', 'html.js')) // https://esm.sh/lit@3.1.0/html.js
</book-code-block>

<book-callout variant="warning" title="Import Map 的限制">
  <p>Import Map 必須是 HTML 頁面中唯一的，且必須在任何 <code>&lt;script type="module"&gt;</code> 之前定義。目前不支援動態修改或多個 Import Map 的合併。如果你使用 Vite 或其他打包工具，通常不需要手動寫 Import Map——工具鏈會在打包時解析所有 Bare Specifiers。</p>
</book-callout>

<h2 id="ch05-s03">建立 TypeScript + Vite 的 Web Components 專案</h2>

<p>以下是一個完整的、開箱即用的 TypeScript + Vite Web Components 專案結構，包含所有必要的設定檔案。</p>

<book-code-block language="typescript" label="Vite 設定檔：vite.config.ts">
import { defineConfig } from 'vite'

export default defineConfig({
  // ── 開發伺服器設定 ──
  server: {
    port: 3000,
    open: true,
    hmr: true,  // Hot Module Replacement
  },

  // ── 建置設定 ──
  build: {
    // 輸出為 ES Module 程式庫（適合發布為設計系統）
    lib: {
      entry: 'src/index.ts',     // 入口：匯出所有元件
      formats: ['es'],            // 只輸出 ESM 格式
      fileName: (format) =&gt; \`my-components.\${format}.js\`,
    },

    // Rollup 選項
    rollupOptions: {
      // 外部依賴（不打包進去，讓使用者自行提供）
      external: [/^lit/],  // 如果你使用 Lit，讓使用者自行安裝

      output: {
        // 確保 CSS Custom Properties 的順序正確
        assetFileNames: 'my-components.[ext]',
      }
    },

    // 目標瀏覽器：現代瀏覽器，支援 ES2020
    target: 'es2020',

    // 啟用程式碼分割（僅在非 lib 模式下）
    // sourcemap: true,  // 生產環境 sourcemap（可選）
  },

  // ── 插件 ──
  plugins: [
    // 如果使用 Lit Decorators，需要啟用
    // litTransform(),  // from @lit/localize-tools 或 vite-plugin-lit

    // 如果需要在元件內 import CSS 檔案
    // 預設 Vite 支援 ?inline 查詢字串
  ],

  // ── 解析設定 ──
  resolve: {
    // 讓 .ts 導入不需要副檔名
    extensions: ['.ts', '.js', '.json'],
  },

  // ── CSS 設定 ──
  css: {
    // 如果使用 CSS Modules
    modules: {
      localsConvention: 'camelCase',
    },
  },
})
</book-code-block>

<book-code-block language="typescript" label="專案結構與 src/index.ts 入口">
// ── 推薦的專案目錄結構 ──
//
// my-web-components/
// ├── src/
// │   ├── components/
// │   │   ├── button/
// │   │   │   ├── my-button.ts       # 元件實作
// │   │   │   ├── my-button.css.ts   # CSS 模板（as const 字串）
// │   │   │   └── my-button.test.ts  # 單元測試
// │   │   ├── card/
// │   │   │   └── my-card.ts
// │   │   └── dialog/
// │   │       └── my-dialog.ts
// │   ├── utils/
// │   │   ├── reactive-element.ts    # Reactive base class
// │   │   └── typed-event.ts         # 型別安全事件工具
// │   └── index.ts                   # 公開 API 入口
// ├── stories/                       # Storybook 故事（可選）
// ├── test/                          # E2E 測試
// ├── index.html                     # 開發用 HTML
// ├── vite.config.ts
// ├── tsconfig.json
// └── package.json

// ── src/index.ts（公開 API）──
// 匯出所有元件，同時執行 customElements.define
export { MyButton } from './components/button/my-button.js'
export { MyCard } from './components/card/my-card.js'
export { MyDialog } from './components/dialog/my-dialog.js'

// ── 型別自動注冊：讓使用 import 就自動 define 元件 ──
// 方式一：副作用 import（在元件檔案中執行 define）
// // my-button.ts 最後一行：
// customElements.define('my-button', MyButton)

// 方式二：在 index.ts 集中 define
import { MyButton } from './components/button/my-button.js'
import { MyCard } from './components/card/my-card.js'

function defineComponents() {
  const components = [
    ['my-button', MyButton],
    ['my-card', MyCard],
  ] as const

  for (const [name, ctor] of components) {
    if (!customElements.get(name)) {
      customElements.define(name, ctor)
    }
  }
}

defineComponents()
</book-code-block>

<book-code-block language="typescript" label="package.json 的關鍵設定">
// ── package.json（重要欄位）──
// {
//   "name": "@my-org/design-system",
//   "version": "1.0.0",
//   "type": "module",           // ← 讓 Node.js 把 .js 當 ESM 處理
//   "main": "./dist/my-components.es.js",
//   "module": "./dist/my-components.es.js",
//   "types": "./dist/index.d.ts",
//   "exports": {
//     ".": {
//       "import": "./dist/my-components.es.js",
//       "types": "./dist/index.d.ts"
//     },
//     "./my-button": {
//       "import": "./dist/components/button/my-button.js",
//       "types": "./dist/components/button/my-button.d.ts"
//     }
//   },
//   "files": ["dist"],
//   "scripts": {
//     "dev": "vite",
//     "build": "tsc --noEmit &amp;&amp; vite build",
//     "build:types": "tsc --declaration --emitDeclarationOnly",
//     "test": "vitest",
//     "test:e2e": "playwright test"
//   },
//   "devDependencies": {
//     "typescript": "^5.4.0",
//     "vite": "^5.2.0",
//     "vitest": "^1.4.0",
//     "@playwright/test": "^1.43.0"
//   }
// }

// ── package.json 的 scripts 型別定義輔助工具 ──
// 確保 tsc --noEmit 在 build 前執行，可以在 CI/CD 中
// 提前捕捉型別錯誤

const packageJsonNote = {
  keyPoints: [
    '"type": "module" 讓整個套件使用 ESM',
    '"exports" 欄位支援 subpath exports（如 import from "@org/ds/button"）',
    '"types" 欄位讓 TypeScript 找到型別宣告',
    'build 前先跑 tsc --noEmit 確保型別正確',
  ]
}

console.log(packageJsonNote)
</book-code-block>

<h2 id="ch05-s04">tsconfig 中與 DOM 型別相關的重要設定</h2>

<p>TypeScript 的 DOM 型別（<code>lib: ["dom"]</code>）包含了所有 Web API 的型別定義，包括 <code>HTMLElement</code>、<code>CustomElementRegistry</code>、<code>ShadowRoot</code> 等。正確設定 tsconfig 能讓 Web Components 開發獲得完整的型別支援。</p>

<book-code-block language="typescript" label="完整的 tsconfig.json 設定與說明">
// ── tsconfig.json（Web Components 推薦設定）──
// {
//   "compilerOptions": {
//     // ── 基礎設定 ──
//     "target": "ES2020",           // 輸出 ES2020 語法（支援 private class fields）
//     "module": "ESNext",           // 使用 ESNext 模組系統（保留 import/export）
//     "moduleResolution": "bundler", // Vite 5 推薦：讓 TS 使用 bundler 模式解析
//     // 或 "moduleResolution": "node16" 如果是 Node.js 後端
//
//     // ── DOM 型別設定 ──
//     "lib": [
//       "ES2020",                   // ES 標準函式庫
//       "DOM",                      // 核心 DOM API（HTMLElement、Document 等）
//       "DOM.Iterable",             // DOM 集合的迭代器（NodeList、HTMLCollection 等）
//       // "DOM.AsyncIterable",     // 非同步 DOM 迭代（較少用）
//     ],
//
//     // ── 嚴格模式 ──
//     "strict": true,               // 啟用所有嚴格型別檢查
//     "noUncheckedIndexedAccess": true, // array[0] 型別包含 undefined
//     "exactOptionalPropertyTypes": true, // 可選屬性不允許明確設為 undefined
//
//     // ── 模組設定 ──
//     "baseUrl": ".",
//     "paths": {
//       "@components/*": ["src/components/*"],
//       "@utils/*": ["src/utils/*"]
//     },
//
//     // ── 輸出設定 ──
//     "outDir": "dist",
//     "declaration": true,          // 生成 .d.ts 型別定義檔
//     "declarationMap": true,       // 生成 .d.ts.map（方便跳轉到原始碼）
//     "sourceMap": true,
//
//     // ── Decorator 設定（如果使用 TC39 Stage 3 Decorators）──
//     // "experimentalDecorators": false, // 不需要了（預設關閉）
//     // "emitDecoratorMetadata": false,  // TC39 Stage 3 不需要
//
//     // 如果使用舊版 TypeScript Decorators（如 Lit 舊版）：
//     // "experimentalDecorators": true,
//     // "useDefineForClassFields": false,  // ← 重要！防止 class field 與 decorator 衝突
//
//     // ── 其他建議設定 ──
//     "skipLibCheck": true,         // 跳過 node_modules 中的 .d.ts 檢查
//     "forceConsistentCasingInFileNames": true,
//     "resolveJsonModule": true,    // 允許 import JSON 檔案
//     "isolatedModules": true,      // 確保每個檔案可以獨立轉譯（Vite/esbuild 需要）
//   },
//   "include": ["src/**/*.ts"],
//   "exclude": ["node_modules", "dist"]
// }

// ── 重要：useDefineForClassFields 與 Decorator 的衝突 ──
// TypeScript 4.3+ 預設 useDefineForClassFields: true
// 這會讓 class field 使用 Object.defineProperty 語意
// 而不是舊版的賦值語意
// 當使用 @property() decorator 時，這會導致 decorator 被 class field 覆蓋！

class ExampleWithDecorator extends HTMLElement {
  // 在 useDefineForClassFields: true 的情況下（預設）
  // 這個 class field 的初始化會在 constructor 結束時執行
  // 如果同時有 decorator，decorator 的效果可能被覆蓋

  // 解決方案 1：設定 useDefineForClassFields: false（在使用 experimentalDecorators 時）
  // 解決方案 2：使用 declare 關鍵字聲明但不初始化
  // declare name: string  // ← 告訴 TS 這個屬性存在，但不生成初始化程式碼

  // 解決方案 3：使用 TC39 Stage 3 Decorators（TypeScript 5.0+），完全相容
  name: string = ''  // 在 TC39 Stage 3 模式下沒有衝突
}
</book-code-block>

<h2 id="ch05-s05">Decorators：experimentalDecorators 與 TC39 Stage 3 Decorators 的差異</h2>

<p>Decorators 是讓 Web Components（尤其是 Lit）的程式碼更簡潔的重要特性。但在 TypeScript 的發展史中，Decorators 有兩個完全不同的實作：舊版的 <code>experimentalDecorators</code> 和新版的 TC39 Stage 3 Decorators（TypeScript 5.0+ 支援）。理解它們的差異能避免許多莫名的 bug。</p>

<book-code-block language="typescript" label="兩種 Decorator 系統的對比">
// ── 舊版：experimentalDecorators（TypeScript 4.x 及以下的 Lit）──
// tsconfig: { "experimentalDecorators": true, "useDefineForClassFields": false }

// 舊版 Decorator 是一個「函式」，接收 target、propertyKey 等參數
// 舊版 @property decorator（Lit 舊版 API）：
// function property(options?: PropertyDeclaration) {
//   return (proto: Object, name: string) =&gt; {
//     // 在 prototype 上定義 getter/setter
//     Object.defineProperty(proto, name, {
//       get() { ... },
//       set(value) { ... }
//     })
//   }
// }
//
// class MyElement extends LitElement {
//   @property({ type: String })
//   name = 'World'
//   // 舊版：@property 在 prototype 上定義，class field 賦值不覆蓋它
//   // 因為 useDefineForClassFields: false
// }

// ── 新版：TC39 Stage 3 Decorators（TypeScript 5.0+）──
// tsconfig: 不需要任何特殊設定（默認啟用）
// 注意：不能同時啟用 experimentalDecorators

// TC39 Stage 3 Decorator 語法更明確，接收 context 物件：
function logAccess&lt;T&gt;(
  _target: undefined,
  context: ClassFieldDecoratorContext
): (initialValue: T) =&gt; T {
  return function(initialValue: T) {
    console.log(\`Field "\${String(context.name)}" initialized with:\`, initialValue)
    return initialValue
  }
}

// 自訂 @reactive 裝飾器（模擬 Lit 的 @property）
function reactive(
  _target: undefined,
  context: ClassFieldDecoratorContext
): void {
  // Stage 3 Decorator 使用 addInitializer 來設定邏輯
  context.addInitializer(function(this: HTMLElement) {
    // 'this' 是元素實例
    const name = context.name as string

    // 在 prototype 上定義 getter/setter
    Object.defineProperty(Object.getPrototypeOf(this), name, {
      get(this: any) {
        return this[\`_\${name}\`]
      },
      set(this: any, value: unknown) {
        const oldValue = this[\`_\${name}\`]
        if (oldValue !== value) {
          this[\`_\${name}\`] = value
          // 觸發更新
          if (typeof this.requestUpdate === 'function') {
            this.requestUpdate(name, oldValue)
          }
        }
      },
      configurable: true,
    })
  })
}

// ── 實際使用 Stage 3 Decorator（Lit 4.x 風格）──
// @customElement('my-greeting')
// class MyGreeting extends LitElement {
//   @reactive
//   name = 'World'
//
//   @reactive
//   count = 0
//
//   render() {
//     return html\`&lt;h1&gt;Hello, \${this.name}! Count: \${this.count}&lt;/h1&gt;\`
//   }
// }

// ── 差異對照表 ──
const decoratorComparison = {
  experimentalDecorators: {
    typescriptVersion: '&lt; 5.0（或啟用 experimentalDecorators flag）',
    tcConfig: 'experimentalDecorators: true, useDefineForClassFields: false',
    runtime: '執行時機在 class 定義時',
    compatibility: '廣泛用於 Angular、NestJS、Lit（舊版）',
    standardStatus: '非標準（TypeScript 私有特性）',
  },
  tc39Stage3: {
    typescriptVersion: '5.0+（默認啟用，無需 flag）',
    tcConfig: '不需要特殊設定',
    runtime: '執行時機更明確，語意更清晰',
    compatibility: 'Lit 4.x、現代 JavaScript 框架',
    standardStatus: '即將成為 ECMAScript 標準',
  },
}

console.log(decoratorComparison)
</book-code-block>

<div class="table-wrapper">
  <table>
    <thead>
      <tr>
        <th>特性</th>
        <th>experimentalDecorators</th>
        <th>TC39 Stage 3</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>TypeScript 版本</td>
        <td>1.5+（需要 flag）</td>
        <td>5.0+（默認支援）</td>
      </tr>
      <tr>
        <td>useDefineForClassFields</td>
        <td>需要設為 false</td>
        <td>不受影響</td>
      </tr>
      <tr>
        <td>emitDecoratorMetadata</td>
        <td>可選（DI 框架用）</td>
        <td>不支援</td>
      </tr>
      <tr>
        <td>Lit 版本</td>
        <td>Lit 2.x/3.x（舊版）</td>
        <td>Lit 4.x（新版）</td>
      </tr>
      <tr>
        <td>標準狀態</td>
        <td>非標準，TypeScript 私有</td>
        <td>TC39 Stage 3，即將標準化</td>
      </tr>
      <tr>
        <td>推薦程度</td>
        <td>⚠️ 維護現有專案</td>
        <td>✅ 新專案首選</td>
      </tr>
    </tbody>
  </table>
</div>

<book-callout variant="tip" title="新專案的 Decorator 建議">
  <p>新專案一律使用 TypeScript 5.0+ 的 TC39 Stage 3 Decorators。不要加 <code>"experimentalDecorators": true</code>，不要加 <code>"useDefineForClassFields": false</code>。如果你使用 Lit，請使用 Lit 3.x（支援 TC39 Decorators）或以上版本。舊版設定只應在維護現有 Angular/NestJS 專案時使用。</p>
</book-callout>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>瀏覽器已能直接執行 ES Modules，Import Maps 補上了 Bare Specifier 的缺口，而 TypeScript + Vite 則在保持開發體驗的前提下，讓 Web Components 獲得型別安全與生產級效能——三者合用構成了 2024 年最現代的 Web Components 工具鏈。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch04">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">HTML Templates 與 Slots</span>
    </a>
    <a class="footer-link" href="#ch06">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">Custom Elements 的完整型別設計</span>
    </a>
  </div>
</div>
`
