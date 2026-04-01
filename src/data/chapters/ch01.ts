export const metadata = {
  id: 1,
  part: 1,
  title: '為什麼選 Web Components？對 Web 平台的長期押注',
  tags: [] as string[],
  sections: [
    { slug: 'ch01-s01', title: 'Component model 的演進史：jQuery → Angular → React → 瀏覽器原生' },
    { slug: 'ch01-s02', title: '瀏覽器已內建的能力，以及各大框架重複發明了什麼' },
    { slug: 'ch01-s03', title: 'Web Components 四大規格總覽' },
    { slug: 'ch01-s04', title: '何時該用 Web Components，何時該用框架的 component' },
    { slug: 'ch01-s05', title: '瀏覽器支援矩陣與 Progressive Enhancement 策略' },
    { slug: 'ch01-interview', title: '面試題：Web Components 解決了 React 解決不了的什麼問題？' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 01 · 第一部：基礎篇 — Web 平台的原生能力</div>
  <h1>為什麼選 Web Components？對 Web 平台的長期押注</h1>
  <p>在前端框架更迭如走馬燈的時代，Web Components 提供了一個不同的思考視角：直接押注瀏覽器平台本身。本章從歷史脈絡出發，理解 Component model 的演進，進而認識四大規格如何協作，以及在實際專案中做出明智選擇的判斷依據。</p>
  <div class="chapter-tags"><span class="tag tag-core">核心觀念</span></div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch01-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">Component model 的演進史</span>
    </a>
    <a class="catalog-item" href="#ch01-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">瀏覽器內建能力與框架重複發明</span>
    </a>
    <a class="catalog-item" href="#ch01-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">Web Components 四大規格總覽</span>
    </a>
    <a class="catalog-item" href="#ch01-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">何時用 Web Components，何時用框架</span>
    </a>
    <a class="catalog-item" href="#ch01-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">瀏覽器支援矩陣與 Progressive Enhancement</span>
    </a>
    <a class="catalog-item" href="#ch01-interview">
      <span class="catalog-item-num">06</span>
      <span class="catalog-item-title">面試題：Web Components vs React</span>
    </a>
  </div>
</div>

<h2 id="ch01-s01">Component model 的演進史：jQuery → Angular → React → 瀏覽器原生</h2>

<p>前端開發的「Component model」並非一開始就存在。2006 年 jQuery 問世時，開發者的心智模型還是「選取元素、操作 DOM」——元件化的概念幾乎付之闕如。想重用一段 UI，你只能複製貼上 HTML，然後再呼叫一次相同的 jQuery 初始化邏輯。這種方式在小型專案可行，卻在規模化後迅速崩潰。</p>

<p>2010 年 AngularJS 帶來了第一個真正普及的 Component model。透過 Directive 與 Controller，開發者首次能夠定義具有獨立作用域、可複用的 UI 單元。但 AngularJS 的雙向綁定（two-way binding）機制造成了難以追蹤的狀態流動，加上 Digest Cycle 的效能問題，使其在 2016 年後快速被 Angular 2+ 與 React 取代。</p>

<p>React 在 2013 年改變了整個遊戲規則。它引入了 Virtual DOM 與單向資料流，讓元件的狀態管理變得可預測。JSX 語法雖然在初期備受爭議，但最終成為前端開發的主流模式。然而，React 本質上是一個在瀏覽器之上重新發明 UI 管理的函式庫——它的 Component 只存在於 React 的虛擬世界，無法被其他框架或純 HTML 直接使用。</p>

<p>Web Components 的標準化工作從 2011 年就開始，Chrome 在 2013 年最早實作，但直到 2018-2019 年，Firefox 與 Safari 才完成支援。這段漫長的等待讓許多人誤以為 Web Components 是一個「過時的嘗試」——實際上，它才剛剛成熟。</p>

<h3>演進時間軸</h3>
<book-code-block language="typescript" label="各時期的元件定義方式對比">
// ── jQuery 時代（2006-2012）──
// 「元件」就是一個函式 + 約定俗成的 HTML 結構
function initTabs(container: HTMLElement) {
  const tabs = container.querySelectorAll('.tab')
  const panels = container.querySelectorAll('.panel')
  tabs.forEach((tab, i) =&gt; {
    tab.addEventListener('click', () =&gt; {
      tabs.forEach(t =&gt; t.classList.remove('active'))
      panels.forEach(p =&gt; (p as HTMLElement).hidden = true)
      tab.classList.add('active')
      ;(panels[i] as HTMLElement).hidden = false
    })
  })
}
// 使用：initTabs(document.querySelector('.my-tabs')!)
// 問題：沒有封裝，全域函式，HTML 結構與邏輯分離

// ── AngularJS 時代（2010-2016）──
// Directive 提供了元件化，但 scope 機制複雜
// app.directive('myTabs', function() {
//   return { restrict: 'E', templateUrl: 'tabs.html', controller: ... }
// })

// ── React 時代（2013-今）──
// JSX + Hooks，但只存在於 React 虛擬世界
// function Tabs({ items }: { items: string[] }) {
//   const [active, setActive] = useState(0)
//   return &lt;div&gt;{items.map((item, i) =&gt; &lt;button onClick={() =&gt; setActive(i)}&gt;{item}&lt;/button&gt;)}&lt;/div&gt;
// }

// ── Web Components 時代（2018-今）──
// 瀏覽器原生，任何框架都能使用
class MyTabs extends HTMLElement {
  private activeIndex = 0

  connectedCallback() {
    this.render()
  }

  private render() {
    // 完全原生，零依賴
    const tabs = this.querySelectorAll('[slot="tab"]')
    tabs.forEach((tab, i) =&gt; {
      tab.addEventListener('click', () =&gt; {
        this.activeIndex = i
        this.render()
      })
    })
  }
}

customElements.define('my-tabs', MyTabs)
// 使用：&lt;my-tabs&gt;&lt;button slot="tab"&gt;Tab 1&lt;/button&gt;&lt;/my-tabs&gt;
// 優點：任何框架、純 HTML 都能直接使用
</book-code-block>

<h3>關鍵轉變</h3>
<ul>
  <li><strong>從約定到標準：</strong>jQuery 時代靠約定（conventions），Web Components 時代靠標準（standards）</li>
  <li><strong>從虛擬到真實：</strong>React 的 Component 存在於 JS 記憶體中，Web Components 的元素就在真實 DOM 裡</li>
  <li><strong>從框架鎖定到互通性：</strong>React Component 只能在 React 裡用，Custom Element 可以在任何環境使用</li>
</ul>

<h2 id="ch01-s02">瀏覽器已內建的能力，以及各大框架重複發明了什麼</h2>

<p>理解 Web Components 的價值，必須先認識各大框架實際上「重複發明」了什麼。這不是在批評框架——有時重新發明是有道理的。但了解這些重疊之處，能幫助你做出更明智的技術決策。</p>

<p>瀏覽器從一開始就內建了許多強大的能力，但在 Web Components 規範出現前，這些能力散落各處、缺乏組合性。Shadow DOM 讓樣式封裝成為可能；Custom Elements 讓你定義自己的 HTML 標籤；HTML Template 讓 DOM 片段可以複用；ES Modules 讓程式碼模組化。</p>

<h3>框架解決了什麼，原生又提供了什麼</h3>
<book-code-block language="typescript" label="框架能力 vs 原生能力對照">
// ── React 解決的問題 vs 原生能力 ──

// 1. 元件封裝
// React 的解法：function component + JSX
// 原生解法：Custom Elements + Shadow DOM

// 2. 樣式隔離
// React 的解法：CSS Modules、Styled Components、CSS-in-JS
// 原生解法：Shadow DOM 的 CSS 封裝

// 3. 模板複用
// React 的解法：JSX render function
// 原生解法：&lt;template&gt; 元素 + cloneNode()

// 4. 狀態管理（這是原生目前較弱的地方）
// React 的解法：useState、useReducer、Context、Redux
// 原生解法：需要自己實作，或使用 Signals 等新規範

// 5. 模組化
// React 的解法：依賴 Webpack/Vite 打包 CommonJS/ESM
// 原生解法：ES Modules（import/export），瀏覽器直接支援

// 範例：用原生能力實現樣式隔離
class IsolatedButton extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })

    // 這裡的 CSS 完全不會影響外部，也不受外部 CSS 影響
    shadow.innerHTML = \`
      &lt;style&gt;
        button {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }
        button:hover {
          background: #4338ca;
        }
      &lt;/style&gt;
      &lt;button&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/button&gt;
    \`
  }
}

customElements.define('isolated-button', IsolatedButton)
// 無論頁面上有什麼 CSS，這個按鈕的樣式都不會被污染
</book-code-block>

<h3>框架仍然不可或缺的地方</h3>
<ul>
  <li><strong>聲明式渲染（Declarative Rendering）：</strong>原生 DOM API 是命令式的，React/Vue 的聲明式渲染大幅降低心智負擔</li>
  <li><strong>細粒度響應式（Fine-grained Reactivity）：</strong>Vue 的 Composition API、Solid 的 Signals，都比原生的 MutationObserver 更易用</li>
  <li><strong>伺服器端渲染（SSR）：</strong>Web Components 的 SSR 支援（Declarative Shadow DOM）仍在普及中</li>
  <li><strong>生態系統：</strong>React 龐大的元件庫、工具鏈、社群資源，短期內原生無法複製</li>
</ul>

<h2 id="ch01-s03">Web Components 四大規格總覽</h2>

<p>Web Components 並非單一規格，而是四個相互協作的 Web 標準的集合。理解每個規格的職責邊界，是掌握整個技術棧的關鍵。</p>

<book-code-block language="typescript" label="四大規格的基本使用範例">
// ── 規格一：Custom Elements ──
// 讓你定義自己的 HTML 標籤，並賦予它行為
class CounterElement extends HTMLElement {
  private count = 0

  static get observedAttributes() {
    return ['initial-value']
  }

  attributeChangedCallback(name: string, _old: string, newVal: string) {
    if (name === 'initial-value') {
      this.count = parseInt(newVal, 10) || 0
    }
  }

  connectedCallback() {
    this.render()
  }

  private render() {
    this.textContent = \`Count: \${this.count}\`
  }
}
customElements.define('my-counter', CounterElement)
// HTML: &lt;my-counter initial-value="5"&gt;&lt;/my-counter&gt;

// ── 規格二：Shadow DOM ──
// 提供 DOM 樹和 CSS 的封裝邊界
class CardElement extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = \`
      &lt;style&gt;
        :host { display: block; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
        .title { font-weight: bold; font-size: 1.1em; }
      &lt;/style&gt;
      &lt;div class="title"&gt;&lt;slot name="title"&gt;標題&lt;/slot&gt;&lt;/div&gt;
      &lt;slot&gt;&lt;/slot&gt;
    \`
  }
}
customElements.define('my-card', CardElement)

// ── 規格三：HTML Templates ──
// 定義可複用的 DOM 片段，不會被立即渲染
// HTML: &lt;template id="row-tpl"&gt;&lt;tr&gt;&lt;td&gt;&lt;/td&gt;&lt;td&gt;&lt;/td&gt;&lt;/tr&gt;&lt;/template&gt;
const template = document.getElementById('row-tpl') as HTMLTemplateElement
function createRow(name: string, value: string): DocumentFragment {
  const fragment = template.content.cloneNode(true) as DocumentFragment
  const cells = fragment.querySelectorAll('td')
  cells[0].textContent = name
  cells[1].textContent = value
  return fragment
}

// ── 規格四：ES Modules ──
// 瀏覽器原生的模組系統，不需要打包工具
// counter.ts:
export class Counter extends HTMLElement {
  // ...
}
// main.ts:
// import { Counter } from './counter.js'
// customElements.define('my-counter', Counter)
</book-code-block>

<h3>四大規格對照表</h3>
<div class="table-wrapper">
  <table>
    <thead>
      <tr>
        <th>規格</th>
        <th>核心職責</th>
        <th>主要 API</th>
        <th>能否單獨使用</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Custom Elements</td>
        <td>定義自訂 HTML 標籤與其生命週期</td>
        <td>customElements.define()、HTMLElement 繼承</td>
        <td>能</td>
      </tr>
      <tr>
        <td>Shadow DOM</td>
        <td>DOM 樹與 CSS 的封裝隔離</td>
        <td>attachShadow()、:host、::part()</td>
        <td>能（但通常與 Custom Elements 搭配）</td>
      </tr>
      <tr>
        <td>HTML Templates</td>
        <td>定義可複用的惰性 DOM 片段</td>
        <td>&lt;template&gt;、content.cloneNode()</td>
        <td>能</td>
      </tr>
      <tr>
        <td>ES Modules</td>
        <td>瀏覽器原生的 JS 模組系統</td>
        <td>import/export、&lt;script type="module"&gt;</td>
        <td>能（現代前端的基礎）</td>
      </tr>
    </tbody>
  </table>
</div>

<book-callout variant="tip" title="最佳實踐">
  <p>這四個規格可以獨立使用，但組合起來才能發揮最大威力。一個完整的 Web Component 通常同時使用 Custom Elements（定義標籤）、Shadow DOM（封裝樣式）、HTML Template（定義結構），並透過 ES Modules 匯出。</p>
</book-callout>

<h2 id="ch01-s04">何時該用 Web Components，何時該用框架的 component</h2>

<p>Web Components 不是「取代框架」的銀彈，而是在特定場景下比框架更合適的工具。做出正確選擇的關鍵是理解各自的優勢範圍。</p>

<h3>Web Components 是最佳選擇的場景</h3>
<ul>
  <li><strong>設計系統（Design System）：</strong>你需要讓不同框架（React、Vue、Angular）的專案都能使用同一套 UI 元件庫</li>
  <li><strong>Micro Frontend：</strong>多個團隊各自維護不同技術棧的應用，需要透過標準 HTML 介面整合</li>
  <li><strong>長期維護的嵌入式 Widget：</strong>要嵌入客戶網站的聊天框、追蹤像素等，需要樣式隔離且不影響宿主頁面</li>
  <li><strong>與 CMS 整合：</strong>WordPress、Drupal 等 CMS 直接在 HTML 中使用自訂標籤</li>
  <li><strong>Progressive Enhancement：</strong>需要在 JavaScript 載入前就有基本功能</li>
</ul>

<h3>框架 Component 是更好選擇的場景</h3>
<ul>
  <li><strong>複雜的應用狀態管理：</strong>多層巢狀元件共享狀態、需要時間旅行除錯（Redux DevTools）</li>
  <li><strong>SSR / SSG 需求：</strong>Next.js、Nuxt 的 SSR 生態系統目前仍然比 Web Components 成熟</li>
  <li><strong>快速開發 SPA：</strong>React/Vue 的開發體驗、熱更新、豐富的第三方元件庫</li>
  <li><strong>需要強型別的模板：</strong>TypeScript 與 JSX/TSX 的整合比 Template Literal HTML 更好</li>
</ul>

<book-code-block language="typescript" label="判斷框架選擇的決策邏輯">
// 這不是真正的程式碼，而是決策邏輯的偽碼
type ProjectContext = {
  teamSize: 'small' | 'large'
  multiFramework: boolean  // 是否需要跨框架共用元件
  hasSSRNeeds: boolean
  isDesignSystem: boolean
  longTermMaintenance: boolean  // 5年以上？
}

function chooseTechnology(ctx: ProjectContext): string {
  // 跨框架共用 = Web Components 核心優勢
  if (ctx.isDesignSystem &amp;&amp; ctx.multiFramework) {
    return 'Web Components（考慮 Lit 作為輔助）'
  }

  // SSR 優先 = 框架仍然更成熟
  if (ctx.hasSSRNeeds) {
    return 'React/Next.js 或 Vue/Nuxt'
  }

  // 長期維護，避免框架升級風險
  if (ctx.longTermMaintenance &amp;&amp; !ctx.hasSSRNeeds) {
    return 'Web Components（框架不會消失，但原生平台更持久）'
  }

  // 預設：框架提供更好的 DX
  return 'React 或 Vue（具體取決於團隊熟悉度）'
}
</book-code-block>

<book-callout variant="warning" title="常見誤解">
  <p>「Web Components 和 React 是競爭關係」是一個常見的錯誤認知。實際上，React 元件可以渲染 Web Components（Custom Elements），而 Web Components 也可以在內部使用 React 來實作複雜的 UI 邏輯。它們是互補的，不是互斥的。</p>
</book-callout>

<h2 id="ch01-s05">瀏覽器支援矩陣與 Progressive Enhancement 策略</h2>

<p>截至 2024 年，Web Components 的四大核心規格在所有現代瀏覽器中都已獲得完整支援。真正需要關注的問題不再是「瀏覽器支不支援」，而是「如何優雅降級」以及「哪些進階功能還在演進中」。</p>

<h3>瀏覽器支援現況</h3>
<div class="table-wrapper">
  <table>
    <thead>
      <tr>
        <th>功能</th>
        <th>Chrome</th>
        <th>Firefox</th>
        <th>Safari</th>
        <th>Edge</th>
        <th>備註</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Custom Elements v1</td>
        <td>✅ 67+</td>
        <td>✅ 63+</td>
        <td>✅ 10.1+</td>
        <td>✅ 79+</td>
        <td>全面支援</td>
      </tr>
      <tr>
        <td>Shadow DOM v1</td>
        <td>✅ 53+</td>
        <td>✅ 63+</td>
        <td>✅ 10+</td>
        <td>✅ 79+</td>
        <td>全面支援</td>
      </tr>
      <tr>
        <td>HTML Templates</td>
        <td>✅ 35+</td>
        <td>✅ 22+</td>
        <td>✅ 8+</td>
        <td>✅ 13+</td>
        <td>支援最早</td>
      </tr>
      <tr>
        <td>ES Modules</td>
        <td>✅ 61+</td>
        <td>✅ 60+</td>
        <td>✅ 10.1+</td>
        <td>✅ 16+</td>
        <td>全面支援</td>
      </tr>
      <tr>
        <td>Customized Built-ins</td>
        <td>✅ 67+</td>
        <td>✅ 63+</td>
        <td>❌ 未支援</td>
        <td>✅ 79+</td>
        <td>Safari 例外，需 Polyfill</td>
      </tr>
      <tr>
        <td>Declarative Shadow DOM</td>
        <td>✅ 111+</td>
        <td>✅ 123+</td>
        <td>✅ 16.4+</td>
        <td>✅ 111+</td>
        <td>SSR 關鍵特性</td>
      </tr>
    </tbody>
  </table>
</div>

<h3>Progressive Enhancement 實作策略</h3>

<book-code-block language="typescript" label="Progressive Enhancement 的三層策略">
// ── 第一層：純 HTML（無 JavaScript）──
// Custom Element 在 JS 未載入時，瀏覽器會將其視為未知元素（類似 &lt;span&gt;）
// 仍然可以顯示文字內容和基本 CSS 樣式
// &lt;my-button&gt;Click me&lt;/my-button&gt; ← 在 JS 載入前仍顯示文字

// ── 第二層：:defined 偽類別控制樣式 ──
// CSS：
// my-button:not(:defined) {
//   display: inline-block;
//   padding: 8px 16px;
//   background: #e5e7eb; /* fallback 樣式 */
// }
// my-button:defined {
//   /* 正式樣式在 JS 載入後生效 */
// }

// ── 第三層：customElements.whenDefined() 等待升級 ──
async function waitForComponents() {
  // 等待所有關鍵元件載入完成
  await Promise.all([
    customElements.whenDefined('my-button'),
    customElements.whenDefined('my-card'),
    customElements.whenDefined('my-tabs'),
  ])

  // 元件就緒後才執行需要元件 API 的邏輯
  const button = document.querySelector('my-button') as HTMLElement
  if (button &amp;&amp; 'setVariant' in button) {
    ;(button as any).setVariant('primary')
  }
}

waitForComponents()

// ── Polyfill 策略（主要為了舊版 Safari 的 Customized Built-ins）──
// 使用 @webcomponents/polyfills 或只針對需要的功能：
// &lt;script&gt;
//   if (!('customElements' in window)) {
//     document.write('&lt;script src="webcomponents-bundle.js"&gt;&lt;\/script&gt;')
//   }
// &lt;/script&gt;

// 或現代做法：使用 feature detection + dynamic import
async function loadPolyfillIfNeeded() {
  if (!customElements.define) {
    const { applyPolyfills } = await import('@webcomponents/webcomponentsjs')
    await applyPolyfills()
  }
}
</book-code-block>

<book-callout variant="tip" title="最佳實踐">
  <p>在 2024 年的新專案中，除非需要支援 IE11（幾乎不再需要），否則不需要使用 Polyfill。唯一的例外是「Customized Built-ins」在 Safari 中不被支援——但這個功能使用場景有限，通常可以用 Autonomous Custom Elements 替代。</p>
</book-callout>

<h2 id="ch01-interview">面試題：Web Components 解決了 React 解決不了的什麼問題？</h2>

<book-callout variant="info" title="面試題">
  <p><strong>問題：</strong>請解釋 Web Components 和 React Component 的本質差異。Web Components 解決了哪些 React 解決不了（或解決得不夠好）的問題？</p>

  <p><strong>模範答案：</strong></p>

  <p>這個問題的核心在於「原生 vs 抽象層」的差異。</p>

  <p><strong>React Component 的本質限制：</strong>React Component 是 React 框架的私有概念，它只在 React 的 Virtual DOM 中存在，無法被其他框架直接識別或使用。當你在 Vue 專案中需要使用一個 React 元件時，你必須將它包裝成 Custom Element 或重寫一遍。</p>

  <p><strong>Web Components 解決的核心問題：</strong></p>
  <p>1. <strong>跨框架互通性（Cross-framework Interoperability）：</strong>一個 Custom Element 就是一個 HTML 標籤。Angular、Vue、Svelte、React，甚至純 HTML，都能直接使用 <code>&lt;my-button&gt;</code>，無需適配層。這是 React Component 做不到的。</p>
  <p>2. <strong>真正的樣式封裝：</strong>CSS Modules 和 Styled Components 依賴打包工具，在 runtime 插入 style 標籤。Shadow DOM 的樣式封裝是瀏覽器層級的，不依賴任何工具鏈，無法被外部 CSS 意外覆蓋。</p>
  <p>3. <strong>不需要框架執行時（Runtime-free）：</strong>Web Components 本身不需要載入任何框架 JS。一個 React 應用最小也需要載入 ~40KB 的 React + ReactDOM。Web Components 直接使用瀏覽器原生 API，零框架開銷。</p>
  <p>4. <strong>長期穩定性：</strong>Web 標準的向後相容性由 W3C/WHATWG 維護，幾乎不會 breaking change。React 從 v15 到 v18 有多次需要修改程式碼的重大變更。</p>

  <p><strong>React 仍然優於原生 Web Components 的地方：</strong>複雜狀態管理、伺服器端渲染生態、聲明式渲染語法、豐富的第三方元件庫。</p>

  <p><strong>最佳答案的結論：</strong>它們解決不同層次的問題。Web Components 解決的是「元件的標準化、可互通性和長期維護性」，React 解決的是「應用程式的狀態管理和渲染效率」。一個成熟的設計系統會用 Web Components 定義跨框架的 UI 原語，然後在各個框架應用中消費它。</p>
</book-callout>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>Web Components 是 Web 平台本身的能力，不是框架——押注它就是押注瀏覽器的未來，而不是某個公司的生態系統。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch02">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">Custom Elements — 定義你自己的 HTML 標籤</span>
    </a>
  </div>
</div>
`
