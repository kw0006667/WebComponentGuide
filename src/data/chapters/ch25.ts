export const metadata = {
  id: 25,
  part: 5,
  title: '效能優化',
  tags: ['進階', '面試重點'] as string[],
  sections: [
    { slug: 'ch25-s01', title: '量測方法：Core Web Vitals 與元件設計的關聯' },
    { slug: 'ch25-s02', title: '降低 Shadow DOM 的成本：何時應該跳過它' },
    { slug: 'ch25-s03', title: 'Lazy Loading 元件與 Element Upgrade 策略' },
    { slug: 'ch25-s04', title: '用 Constructable Stylesheets 在大量實例間共享樣式' },
    { slug: 'ch25-s05', title: '避免在 updated() Callback 中造成 Layout Thrash' },
    { slug: 'ch25-s06', title: 'Web Components 在 PWA 中的 Caching 與離線策略' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 25 · 第五部：品質保證：測試、無障礙與效能</div>
  <h1>效能優化</h1>
  <p>Web Components 的效能特性與框架元件截然不同，Shadow DOM、元件升級、大量實例的樣式計算都有各自的成本。本章系統性介紹量測方法、關鍵決策點，以及在 PWA 場景下的快取策略，讓你的元件在真實使用者裝置上表現卓越。</p>
  <div class="chapter-tags"><span class="tag tag-advanced">進階</span><span class="tag tag-interview">面試重點</span></div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch25-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">量測方法：Core Web Vitals 與元件設計的關聯</span>
    </a>
    <a class="catalog-item" href="#ch25-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">降低 Shadow DOM 的成本：何時應該跳過它</span>
    </a>
    <a class="catalog-item" href="#ch25-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">Lazy Loading 元件與 Element Upgrade 策略</span>
    </a>
    <a class="catalog-item" href="#ch25-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">用 Constructable Stylesheets 在大量實例間共享樣式</span>
    </a>
    <a class="catalog-item" href="#ch25-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">避免在 updated() Callback 中造成 Layout Thrash</span>
    </a>
    <a class="catalog-item" href="#ch25-s06">
      <span class="catalog-item-num">06</span>
      <span class="catalog-item-title">Web Components 在 PWA 中的 Caching 與離線策略</span>
    </a>
  </div>
</div>

<h2 id="ch25-s01">量測方法：Core Web Vitals 與元件設計的關聯</h2>

<p>效能優化的第一步永遠是量測，而非猜測。Google 的 Core Web Vitals（CWV）提供了以使用者體驗為中心的量測框架，直接影響 SEO 排名與實際用戶留存率。</p>

<p>三大核心指標分別是：</p>

<table>
  <thead>
    <tr><th>指標</th><th>全名</th><th>目標值</th><th>Web Components 的關聯</th></tr>
  </thead>
  <tbody>
    <tr><td>LCP</td><td>Largest Contentful Paint</td><td>&lt; 2.5s</td><td>Hero 元件如使用 Shadow DOM，其內容對 SSR 不友善，影響首屏渲染</td></tr>
    <tr><td>FID / INP</td><td>Interaction to Next Paint</td><td>&lt; 200ms</td><td>大量元件 upgrade 與 connectedCallback 執行會阻塞主執行緒</td></tr>
    <tr><td>CLS</td><td>Cumulative Layout Shift</td><td>&lt; 0.1</td><td>未定義尺寸的自訂元素在升級前後尺寸突變，造成版面偏移</td></tr>
  </tbody>
</table>

<p>使用 <code>PerformanceObserver</code> 可以在元件內部直接量測 CWV，讓元件自帶可觀察性：</p>

<book-code-block language="typescript" label="TypeScript — 在元件中量測 Core Web Vitals">
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('perf-observer')
class PerfObserver extends LitElement {
  private lcpObserver?: PerformanceObserver;
  private clsObserver?: PerformanceObserver;
  private inpObserver?: PerformanceObserver;

  connectedCallback() {
    super.connectedCallback();
    this.observeLCP();
    this.observeCLS();
    this.observeINP();
  }

  private observeLCP() {
    this.lcpObserver = new PerformanceObserver((list) =&gt; {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry &amp; { startTime: number };
      console.log('[LCP]', lastEntry.startTime.toFixed(0), 'ms');
      this.dispatchEvent(new CustomEvent('lcp-measured', {
        detail: { value: lastEntry.startTime },
        bubbles: true, composed: true,
      }));
    });
    this.lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  }

  private observeCLS() {
    let clsValue = 0;
    this.clsObserver = new PerformanceObserver((list) =&gt; {
      for (const entry of list.getEntries()) {
        const e = entry as PerformanceEntry &amp; { hadRecentInput: boolean; value: number };
        if (!e.hadRecentInput) clsValue += e.value;
      }
      console.log('[CLS]', clsValue.toFixed(4));
    });
    this.clsObserver.observe({ type: 'layout-shift', buffered: true });
  }

  private observeINP() {
    this.inpObserver = new PerformanceObserver((list) =&gt; {
      for (const entry of list.getEntries()) {
        const e = entry as PerformanceEntry &amp; { processingStart: number; startTime: number };
        const inp = e.processingStart - e.startTime;
        if (inp &gt; 200) {
          console.warn('[INP] Slow interaction:', inp.toFixed(0), 'ms');
        }
      }
    });
    this.inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 16 });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.lcpObserver?.disconnect();
    this.clsObserver?.disconnect();
    this.inpObserver?.disconnect();
  }

  render() { return html\`<slot></slot>\`; }
}
</book-code-block>

<p>針對 CLS，解決方案是為自訂元素預先定義尺寸佔位，避免升級前後的版面跳動：</p>

<book-code-block language="css" label="CSS — 防止自訂元素升級前造成 CLS">
/* 使用 :not(:defined) 為未升級元件設定佔位尺寸 */
my-card:not(:defined) {
  display: block;
  min-height: 200px;
  background: #f0f0f0;
  border-radius: 8px;
  /* 避免內容在升級前後的版面偏移 */
}

/* 或使用 content-visibility 推遲視窗外元素的渲染 */
my-card {
  content-visibility: auto;
  contain-intrinsic-size: 0 200px; /* 預估尺寸 */
}
</book-code-block>

<book-callout variant="tip" title="量測優先原則">
  <p>在開始任何效能優化前，先在 Chrome DevTools 的 Performance 面板錄製真實互動，使用 CPU 4x slowdown 模擬中低階裝置。Web Components 的升級成本在高效能機器上難以察覺，但在 Moto G4 等裝置上可能造成數百毫秒的阻塞。</p>
</book-callout>

<h2 id="ch25-s02">降低 Shadow DOM 的成本：何時應該跳過它</h2>

<p>Shadow DOM 提供了樣式封裝與 DOM 隔離，但這些特性並非免費。每個 Shadow Root 都會增加瀏覽器的記憶體使用量，並使事件冒泡、CSS 繼承變得更複雜。以下決策表幫助你判斷是否應該跳過 Shadow DOM：</p>

<table>
  <thead>
    <tr><th>情境</th><th>是否使用 Shadow DOM</th><th>理由</th></tr>
  </thead>
  <tbody>
    <tr><td>頁面上有 1000+ 個實例（如表格行）</td><td>❌ 跳過</td><td>記憶體與樣式計算成本倍增</td></tr>
    <tr><td>需要嚴格樣式封裝（第三方嵌入）</td><td>✅ 使用</td><td>防止宿主頁面樣式污染</td></tr>
    <tr><td>元件需要全域 CSS 套用（表單元素）</td><td>❌ 跳過</td><td>Shadow DOM 阻擋全域樣式繼承</td></tr>
    <tr><td>Design System 的底層原子元件</td><td>✅ 使用</td><td>保證跨應用的樣式一致性</td></tr>
    <tr><td>SSR + Hydration 場景</td><td>⚠️ 謹慎</td><td>Declarative Shadow DOM 有助於 SSR，但支援度需確認</td></tr>
    <tr><td>需要全域 ARIA landmark 被無障礙樹感知</td><td>❌ 跳過或用 DSD</td><td>Shadow DOM 邊界可能截斷 ARIA 關係</td></tr>
  </tbody>
</table>

<book-code-block language="typescript" label="TypeScript — 不使用 Shadow DOM 的 Light DOM 元件">
// 不呼叫 attachShadow()，直接操作 Light DOM
class LightDomRow extends HTMLElement {
  static observedAttributes = ['label', 'value'];

  connectedCallback() {
    // 直接渲染到 Light DOM，繼承全域樣式
    this.innerHTML = \`
      &lt;div class="row"&gt;
        &lt;span class="label"&gt;\${this.getAttribute('label') ?? ''}&lt;/span&gt;
        &lt;span class="value"&gt;\${this.getAttribute('value') ?? ''}&lt;/span&gt;
      &lt;/div&gt;
    \`;
  }

  attributeChangedCallback(name: string, _: string, newValue: string) {
    const el = this.querySelector(\`.\${name}\`);
    if (el) el.textContent = newValue;
  }
}

customElements.define('light-dom-row', LightDomRow);
</book-code-block>

<book-callout variant="warning" title="Light DOM 的取捨">
  <p>跳過 Shadow DOM 代表放棄樣式封裝。任何 <code>.row</code>、<code>.label</code> 的全域樣式都會影響你的元件。建議在 class name 前加上元件前綴（如 <code>ldr-row</code>）來降低衝突風險。</p>
</book-callout>

<h2 id="ch25-s03">Lazy Loading 元件與 Element Upgrade 策略</h2>

<p>並非所有元件都需要在頁面載入時立即定義。利用 <code>IntersectionObserver</code> 搭配動態 <code>import()</code>，可以實現「進入視窗才升級」的 Lazy Upgrade 策略，大幅縮短初始載入時間。</p>

<book-code-block language="typescript" label="TypeScript — IntersectionObserver Lazy Upgrade">
// lazy-upgrade.ts — 通用工具函式
type ComponentLoader = () =&gt; Promise&lt;void&gt;;

const componentLoaders = new Map&lt;string, ComponentLoader&gt;([
  ['heavy-chart', () =&gt; import('./components/heavy-chart.js').then(() =&gt; {})],
  ['video-player', () =&gt; import('./components/video-player.js').then(() =&gt; {})],
  ['data-table', () =&gt; import('./components/data-table.js').then(() =&gt; {})],
]);

function lazyUpgrade(tagName: string, loader: ComponentLoader) {
  // 若瀏覽器已支援該元素，直接載入
  if (customElements.get(tagName)) return;

  const elements = document.querySelectorAll(tagName);
  if (elements.length === 0) return;

  const observer = new IntersectionObserver(
    async (entries) =&gt; {
      const visible = entries.some(e =&gt; e.isIntersecting);
      if (!visible) return;

      observer.disconnect();
      await loader();
      // 觸發所有已存在元素的升級
      await customElements.whenDefined(tagName);
      console.log(\`[lazy-upgrade] \${tagName} upgraded\`);
    },
    { rootMargin: '200px' } // 提前 200px 開始載入
  );

  elements.forEach(el =&gt; observer.observe(el));
}

// 初始化所有懶載入元件
componentLoaders.forEach((loader, tagName) =&gt; lazyUpgrade(tagName, loader));
</book-code-block>

<p>另一種策略是使用 <code>customElements.whenDefined()</code> 讓渲染等待元件就緒，避免在升級前顯示未樣式化的內容（FOUCE — Flash of Unupgraded Custom Elements）：</p>

<book-code-block language="typescript" label="TypeScript — 防止 FOUCE 的等待策略">
// 在關鍵元件渲染前等待其定義完成
async function waitForCriticalComponents(tagNames: string[]) {
  await Promise.all(
    tagNames.map(tag =&gt; customElements.whenDefined(tag))
  );
  // 解除隱藏
  document.body.removeAttribute('data-components-loading');
}

// HTML 端：&lt;body data-components-loading&gt;
// CSS 端：[data-components-loading] { visibility: hidden; }
waitForCriticalComponents(['app-header', 'app-nav']);
</book-code-block>

<h2 id="ch25-s04">用 Constructable Stylesheets 在大量實例間共享樣式</h2>

<p>當頁面上有數百個相同元件的實例時，若每個 Shadow Root 都有獨立的 <code>&lt;style&gt;</code> 標籤，瀏覽器需要分別解析、儲存這些樣式——這是一筆巨大的記憶體開銷。Constructable Stylesheets 讓多個 Shadow Root 共享同一個已解析的 <code>CSSStyleSheet</code> 物件。</p>

<book-code-block language="typescript" label="TypeScript — Constructable Stylesheets 共享樣式">
// shared-styles.ts — 單次建立，全域共享
const sharedSheet = new CSSStyleSheet();
sharedSheet.replaceSync(\`
  :host {
    display: block;
    box-sizing: border-box;
  }
  .container {
    padding: var(--spacing-md, 16px);
    border-radius: var(--radius-md, 8px);
    background: var(--color-surface, #fff);
  }
  button {
    cursor: pointer;
    font-family: inherit;
  }
\`);

// 額外的主題樣式表
const themeSheet = new CSSStyleSheet();
themeSheet.replaceSync(\`
  :host {
    --color-primary: #3b82f6;
    --color-surface: #ffffff;
    --spacing-md: 16px;
    --radius-md: 8px;
  }
  @media (prefers-color-scheme: dark) {
    :host {
      --color-surface: #1e293b;
      --color-primary: #60a5fa;
    }
  }
\`);

export { sharedSheet, themeSheet };

// ============================================
// my-card.ts — 消費共享樣式表
import { sharedSheet, themeSheet } from './shared-styles.js';

class MyCard extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    // 直接參照已解析的 CSSStyleSheet 物件，無需重複解析
    shadow.adoptedStyleSheets = [themeSheet, sharedSheet];
    shadow.innerHTML = \`&lt;div class="container"&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/div&gt;\`;
  }
}

customElements.define('my-card', MyCard);
</book-code-block>

<p>在 Lit 中，使用 <code>static styles</code> 屬性時，Lit 會自動採用 Constructable Stylesheets（在支援的瀏覽器中），因此你通常無需手動管理：</p>

<book-code-block language="typescript" label="TypeScript — Lit 自動使用 Constructable Stylesheets">
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

// Lit 內部會將 static styles 轉換為 CSSStyleSheet，
// 所有實例共享同一個已解析的樣式物件
@customElement('my-button')
class MyButton extends LitElement {
  static styles = css\`
    :host { display: inline-flex; }
    button {
      padding: 8px 16px;
      background: var(--color-primary, #3b82f6);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: opacity 0.2s;
    }
    button:hover { opacity: 0.9; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
  \`;

  render() {
    return html\`&lt;button&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/button&gt;\`;
  }
}
</book-code-block>

<book-callout variant="tip" title="效能提升數據">
  <p>根據 Google Chrome 工程師的測試，在頁面有 500 個相同元件實例的情況下，使用 Constructable Stylesheets 相比獨立 &lt;style&gt; 標籤，可降低約 30% 的記憶體使用量，並縮短約 20% 的樣式計算時間。</p>
</book-callout>

<h2 id="ch25-s05">避免在 updated() Callback 中造成 Layout Thrash</h2>

<p>Layout Thrash（版面抖動）是效能的隱形殺手。它發生在你交替執行「讀取 DOM 幾何尺寸」與「寫入 DOM 樣式/屬性」的操作時，迫使瀏覽器在每次讀取前都重新計算版面（強制同步版面）。</p>

<book-code-block language="typescript" label="TypeScript — 錯誤示範：造成 Layout Thrash">
// ❌ 壞範例：在 Lit 的 updated() 中反覆讀寫 DOM
import { LitElement, html } from 'lit';
import { customElement, queryAll } from 'lit/decorators.js';

@customElement('bad-grid')
class BadGrid extends LitElement {
  @queryAll('.item') items!: NodeListOf&lt;HTMLElement&gt;;

  updated() {
    // 每次迴圈都會觸發強制同步版面（Forced Synchronous Layout）
    this.items.forEach(item =&gt; {
      const width = item.offsetWidth;  // 讀取 → 觸發 reflow
      item.style.height = \`\${width}px\`; // 寫入 → 讓下次讀取失效
    });
  }

  render() {
    return html\`\${[1,2,3,4].map(i =&gt; html\`&lt;div class="item"&gt;\${i}&lt;/div&gt;\`)}\`;
  }
}
</book-code-block>

<book-code-block language="typescript" label="TypeScript — 正確做法：批次讀取再批次寫入">
// ✅ 好範例：先批次讀取，再批次寫入
import { LitElement, html } from 'lit';
import { customElement, queryAll } from 'lit/decorators.js';

@customElement('good-grid')
class GoodGrid extends LitElement {
  @queryAll('.item') items!: NodeListOf&lt;HTMLElement&gt;;

  updated() {
    // 步驟一：批次讀取（一次性觸發 reflow）
    const widths = Array.from(this.items).map(item =&gt; item.offsetWidth);

    // 步驟二：批次寫入（不觸發額外 reflow）
    Array.from(this.items).forEach((item, i) =&gt; {
      item.style.height = \`\${widths[i]}px\`;
    });
  }

  render() {
    return html\`\${[1,2,3,4].map(i =&gt; html\`&lt;div class="item"&gt;\${i}&lt;/div&gt;\`)}\`;
  }
}

// 更進一步：使用 requestAnimationFrame 延遲到下一個 paint 前
@customElement('raf-grid')
class RafGrid extends LitElement {
  @queryAll('.item') items!: NodeListOf&lt;HTMLElement&gt;;

  updated() {
    // 推遲到瀏覽器下次繪製前，與渲染流水線對齊
    requestAnimationFrame(() =&gt; {
      const widths = Array.from(this.items).map(item =&gt; item.offsetWidth);
      Array.from(this.items).forEach((item, i) =&gt; {
        item.style.height = \`\${widths[i]}px\`;
      });
    });
  }

  render() {
    return html\`\${[1,2,3,4].map(i =&gt; html\`&lt;div class="item"&gt;\${i}&lt;/div&gt;\`)}\`;
  }
}
</book-code-block>

<book-callout variant="tip" title="使用 ResizeObserver 取代輪詢">
  <p>如果你需要響應元件尺寸變化，應使用 <code>ResizeObserver</code> 而非在每次 <code>updated()</code> 中手動讀取尺寸。ResizeObserver 的回調在 paint 之後、下一個 frame 開始前觸發，不會造成 Layout Thrash。</p>
</book-callout>

<h2 id="ch25-s06">Web Components 在 PWA 中的 Caching 與離線策略</h2>

<p>PWA（Progressive Web App）的核心是 Service Worker，而 Web Components 函式庫的快取策略直接影響離線體驗與首次載入效能。</p>

<book-code-block language="javascript" label="JavaScript — Service Worker 快取策略（sw.js）">
// sw.js — 分層快取策略

const CORE_CACHE = 'core-v1';
const COMPONENT_CACHE = 'components-v1';
const DATA_CACHE = 'data-v1';

// 核心資源：App Shell 與 Web Components 定義
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/dist/components/core.js',      // 核心元件包
  '/dist/components/styles.css',
];

// 安裝時預快取核心資源
self.addEventListener('install', (event) =&gt; {
  event.waitUntil(
    caches.open(CORE_CACHE).then(cache =&gt; cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// 啟動時清理舊快取
self.addEventListener('activate', (event) =&gt; {
  event.waitUntil(
    caches.keys().then(keys =&gt;
      Promise.all(
        keys
          .filter(k =&gt; k !== CORE_CACHE &amp;&amp; k !== COMPONENT_CACHE &amp;&amp; k !== DATA_CACHE)
          .map(k =&gt; caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// 攔截請求：分層路由策略
self.addEventListener('fetch', (event) =&gt; {
  const url = new URL(event.request.url);

  // 元件 JS 檔案：Cache First（帶版本的靜態資源）
  if (url.pathname.startsWith('/dist/components/')) {
    event.respondWith(cacheFirst(event.request, COMPONENT_CACHE));
    return;
  }

  // API 資料：Network First（保持資料新鮮）
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request, DATA_CACHE));
    return;
  }

  // 其他資源：Stale While Revalidate
  event.respondWith(staleWhileRevalidate(event.request, CORE_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  const cache = await caches.open(cacheName);
  cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch {
    return caches.match(request);
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response =&gt; {
    cache.put(request, response.clone());
    return response;
  });
  return cached ?? fetchPromise;
}
</book-code-block>

<p>在 Web Components 中整合 Service Worker 更新通知，提醒使用者重新載入以獲取新版元件：</p>

<book-code-block language="typescript" label="TypeScript — PWA 更新通知元件">
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('pwa-update-banner')
class PwaUpdateBanner extends LitElement {
  @state() private showUpdate = false;
  private registration?: ServiceWorkerRegistration;

  static styles = css\`
    .banner {
      position: fixed;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: #1e293b;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      display: flex;
      gap: 12px;
      align-items: center;
      z-index: 9999;
      box-shadow: 0 4px 16px rgba(0,0,0,.3);
    }
    button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      cursor: pointer;
    }
  \`;

  async connectedCallback() {
    super.connectedCallback();
    if ('serviceWorker' in navigator) {
      this.registration = await navigator.serviceWorker.ready;
      navigator.serviceWorker.addEventListener('controllerchange', () =&gt; {
        this.showUpdate = true;
      });
      this.registration.addEventListener('updatefound', () =&gt; {
        const newWorker = this.registration!.installing;
        newWorker?.addEventListener('statechange', () =&gt; {
          if (newWorker.state === 'installed' &amp;&amp; navigator.serviceWorker.controller) {
            this.showUpdate = true;
          }
        });
      });
    }
  }

  private applyUpdate() {
    this.registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }

  render() {
    if (!this.showUpdate) return html\`\`;
    return html\`
      &lt;div class="banner"&gt;
        &lt;span&gt;新版本已就緒！&lt;/span&gt;
        &lt;button @click=\${this.applyUpdate}&gt;立即更新&lt;/button&gt;
      &lt;/div&gt;
    \`;
  }
}
</book-code-block>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>效能優化從量測開始，Shadow DOM 不是萬靈丹而是取捨，Lazy Upgrade 延後成本，Constructable Stylesheets 共享樣式，批次讀寫避免 Layout Thrash，Service Worker 分層快取確保離線體驗。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch24">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">無障礙設計（Accessibility）深探</span>
    </a>
    <a class="footer-link" href="#ch26">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">偵錯 Web Components</span>
    </a>
  </div>
</div>
`
