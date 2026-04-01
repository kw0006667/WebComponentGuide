export const metadata = {
  id: 8,
  part: 2,
  title: '渲染策略 — 從 innerHTML 到 Virtual DOM',
  tags: ['面試重點'] as string[],
  sections: [
    { slug: 'ch08-s01', title: '直接操作 DOM：速度快但脆弱，適用時機的判斷' },
    { slug: 'ch08-s02', title: 'innerHTML：語法便利但成本高 — 何時可以接受' },
    { slug: 'ch08-s03', title: 'Tagged Template Literals 作為零依賴的渲染引擎' },
    { slug: 'ch08-s04', title: '理解 Lit 的 html tag 與「Sticky Binding」的設計技巧' },
    { slug: 'ch08-s05', title: 'Incremental DOM 與 Virtual DOM 的概念比較' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 08 · 第二部：TypeScript 優先的 Web Components 開發</div>
  <h1>渲染策略 — 從 innerHTML 到 Virtual DOM</h1>
  <p>當元件的 reactive property 改變後，我們如何高效地更新 DOM？這個問題沒有唯一正確答案——直接 DOM 操作、innerHTML、Tagged Template Literals、Virtual DOM，每種策略都有適用的場景和代價。本章系統性地比較這些策略，並深入解析 Lit 的 html tag 背後的「Sticky Binding」機制，以及 Incremental DOM 與 Virtual DOM 的設計哲學差異。</p>
  <div class="chapter-tags"><span class="tag tag-interview">面試重點</span></div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch08-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">直接操作 DOM</span>
    </a>
    <a class="catalog-item" href="#ch08-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">innerHTML：便利與成本</span>
    </a>
    <a class="catalog-item" href="#ch08-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">Tagged Template Literals 渲染引擎</span>
    </a>
    <a class="catalog-item" href="#ch08-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">Lit 的 html tag 與 Sticky Binding</span>
    </a>
    <a class="catalog-item" href="#ch08-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">Incremental DOM vs Virtual DOM</span>
    </a>
  </div>
</div>

<h2 id="ch08-s01">直接操作 DOM：速度快但脆弱，適用時機的判斷</h2>

<p>直接操作 DOM（<code>element.textContent = ...</code>、<code>element.style.display = ...</code>、<code>element.classList.toggle()</code>）是所有渲染策略中最快的方式。它直接修改目標元素，不需要任何中間層、不需要解析 HTML 字串、不需要比較虛擬節點。在明確知道要更新哪個元素的哪個屬性時，這是最佳選擇。</p>

<p>然而，這種方式的代價是程式碼的「脆弱性（fragility）」——DOM 結構和更新邏輯高度耦合。當 UI 複雜度增加時，命令式的 DOM 操作程式碼很快就會變成難以維護的「意大利麵條式程式碼」。</p>

<book-code-block language="typescript" label="直接操作 DOM 的適用模式">
// ── 場景一：只更新文字內容（永遠用 textContent）──
class StatusBadge extends HTMLElement {
  private textEl!: HTMLSpanElement
  private indicatorEl!: HTMLSpanElement

  connectedCallback() {
    // 建立一次 DOM 結構
    this.innerHTML = \`
      &lt;span class="indicator"&gt;&lt;/span&gt;
      &lt;span class="text"&gt;&lt;/span&gt;
    \`
    // 快取 DOM 參考
    this.indicatorEl = this.querySelector('.indicator')!
    this.textEl = this.querySelector('.text')!

    this.update()
  }

  static get observedAttributes() { return ['status', 'label'] }

  attributeChangedCallback() {
    if (this.isConnected) this.update()
  }

  private update() {
    const status = this.getAttribute('status') || 'default'
    const label = this.getAttribute('label') || status

    // ✅ 直接修改目標屬性，不重建 DOM
    this.textEl.textContent = label  // textContent，不是 innerHTML（安全）

    // ✅ 用 className 替換
    this.indicatorEl.className = \`indicator indicator--\${status}\`

    // ✅ 用 style.setProperty
    const colorMap: Record&lt;string, string&gt; = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      default: '#6b7280',
    }
    this.indicatorEl.style.setProperty('--color', colorMap[status] ?? colorMap.default)

    // ✅ ARIA 屬性
    this.setAttribute('aria-label', \`Status: \${label}\`)
  }
}
customElements.define('status-badge', StatusBadge)

// ── 場景二：顯示/隱藏（用 hidden 屬性或 CSS class）──
class TogglePanel extends HTMLElement {
  private panel!: HTMLDivElement

  connectedCallback() {
    this.innerHTML = \`
      &lt;button class="toggle"&gt;&lt;slot name="trigger"&gt;Toggle&lt;/slot&gt;&lt;/button&gt;
      &lt;div class="panel" hidden&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/div&gt;
    \`
    this.panel = this.querySelector('.panel')!
    this.querySelector('.toggle')!.addEventListener('click', () =&gt; {
      // ✅ 直接切換 hidden 屬性，比 display style 更語意化
      this.panel.hidden = !this.panel.hidden
      this.querySelector('.toggle')!.setAttribute(
        'aria-expanded',
        String(!this.panel.hidden)
      )
    })
  }
}
customElements.define('toggle-panel', TogglePanel)

// ── 場景三：動畫（用 CSS class 觸發 transition）──
class AnimatedCard extends HTMLElement {
  private card!: HTMLDivElement

  connectedCallback() {
    this.innerHTML = \`&lt;div class="card"&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/div&gt;\`
    this.card = this.querySelector('.card')!
  }

  show(animate = true) {
    if (animate) {
      // ✅ 透過 class 觸發 CSS transition，不用 JS 動畫
      requestAnimationFrame(() =&gt; {
        this.card.classList.add('is-visible')
      })
    } else {
      this.card.style.opacity = '1'
      this.card.style.transform = 'translateY(0)'
    }
  }

  hide() {
    this.card.classList.remove('is-visible')
  }
}
customElements.define('animated-card', AnimatedCard)

// ── 何時不該用直接 DOM 操作 ──
// ❌ 渲染一個列表（需要新增/移除/重排多個節點）
// ❌ 根據複雜條件渲染不同的 DOM 結構
// ❌ 需要頻繁且大規模地更新（10+ 個不同屬性）
// 這些場景改用 template clone 或聲明式渲染
</book-code-block>

<h3>直接 DOM 操作的原則</h3>
<ul>
  <li><strong>用 textContent，不用 innerHTML：</strong>textContent 自動轉義 HTML，避免 XSS，且比 innerHTML 更快</li>
  <li><strong>快取 DOM 參考：</strong>在 connectedCallback 中一次性查詢並儲存，不要每次更新都重新 querySelector</li>
  <li><strong>用 classList 和 toggleAttribute，不要直接操作 style：</strong>讓 CSS 負責視覺狀態，JS 只切換 class</li>
  <li><strong>批次 DOM 修改：</strong>多個修改包在一個 requestAnimationFrame 中，或使用 DocumentFragment</li>
</ul>

<h2 id="ch08-s02">innerHTML：語法便利但成本高 — 何時可以接受</h2>

<p>innerHTML 是目前最常見的 Web Component 渲染方式，因為它語法直觀、容易理解。但它有兩個重要的缺點需要正視：<strong>XSS 安全風險</strong>和<strong>重建整個 DOM 樹的效能成本</strong>。</p>

<book-code-block language="typescript" label="innerHTML 的安全與效能考量">
// ── XSS 漏洞示範 ──
class DangerousGreeting extends HTMLElement {
  connectedCallback() {
    const name = this.getAttribute('name') || ''

    // ❌ 極度危險：直接將 attribute 插入 innerHTML
    this.innerHTML = \`&lt;h1&gt;Hello, \${name}!&lt;/h1&gt;\`
    // 攻擊者可以設定 name = '&lt;img src=x onerror=alert(1)&gt;'
    // 或更危險的 Script injection
  }
}

// ── 安全的 innerHTML 使用方式 ──
// 方法一：只使用硬編碼的 HTML，不插入任何動態值
class SafeStaticGreeting extends HTMLElement {
  connectedCallback() {
    // ✅ 完全靜態的 HTML，沒有任何動態插值
    this.innerHTML = \`
      &lt;style&gt;.greeting { color: #4f46e5; }&lt;/style&gt;
      &lt;h1 class="greeting"&gt;&lt;span class="name"&gt;&lt;/span&gt;&lt;/h1&gt;
    \`
    // 然後用 textContent 設定動態值（安全！）
    const nameEl = this.querySelector('.name')!
    nameEl.textContent = this.getAttribute('name') || 'World'
  }
}

// 方法二：使用 HTML Sanitizer（需要 DOMPurify 或原生 Sanitizer API）
// 注意：原生 Sanitizer API 仍在標準化中，建議使用 DOMPurify
function safeInnerHTML(element: HTMLElement, unsafeHTML: string) {
  // 使用 DOMParser 解析，然後只取文字內容和安全的標籤
  const parser = new DOMParser()
  const doc = parser.parseFromString(unsafeHTML, 'text/html')

  // 移除所有 script 標籤
  doc.querySelectorAll('script').forEach(s =&gt; s.remove())
  // 移除所有事件屬性（onerror、onclick 等）
  doc.querySelectorAll('*').forEach(el =&gt; {
    for (const attr of [...el.attributes]) {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name)
      }
    }
  })

  element.innerHTML = doc.body.innerHTML
}

// 方法三：建立型別安全的 HTML 標記（Tagged Template + 自動轉義）
function escapeHTML(str: unknown): string {
  return String(str)
    .replace(/&amp;/g, '&amp;amp;')
    .replace(/&lt;/g, '&amp;lt;')
    .replace(/&gt;/g, '&amp;gt;')
    .replace(/"/g, '&amp;quot;')
    .replace(/'/g, '&#39;')
}

// ── 可信的 HTML 標記型別（防止意外插入未轉義內容）──
class TrustedHTML {
  constructor(readonly value: string) {}
  toString() { return this.value }
}

function html(strings: TemplateStringsArray, ...values: unknown[]): TrustedHTML {
  let result = ''
  strings.forEach((str, i) =&gt; {
    result += str
    if (i &lt; values.length) {
      const value = values[i]
      // TrustedHTML 值不轉義（已信任），其他值自動轉義
      result += value instanceof TrustedHTML
        ? value.value
        : escapeHTML(value)
    }
  })
  return new TrustedHTML(result)
}

// 使用：插入動態值時自動轉義，只有明確標記為 TrustedHTML 的才不轉義
function renderUser(name: string, avatarHtml: TrustedHTML) {
  const template = html\`
    &lt;div class="user"&gt;
      &lt;span&gt;\${name}&lt;/span&gt;
      \${avatarHtml}
    &lt;/div&gt;
  \`
  // name 會被轉義（安全），avatarHtml 不轉義（需要插入 HTML 結構）
  return template.value
}

// ── innerHTML 的效能成本 ──
function measureInnerHTML(container: HTMLElement, items: string[], runs = 100) {
  const start = performance.now()

  for (let i = 0; i &lt; runs; i++) {
    // 每次都：1) 解析 HTML 字串 2) 刪除所有舊節點 3) 建立新節點
    container.innerHTML = items.map(item =&gt;
      \`&lt;div class="item"&gt;&lt;span&gt;\${item}&lt;/span&gt;&lt;/div&gt;\`
    ).join('')
  }

  const end = performance.now()
  console.log(\`innerHTML x\${runs}: \${(end - start).toFixed(2)}ms\`)
  // 典型結果（100個項目 x 100次）：~150-300ms
}
</book-code-block>

<book-callout variant="warning" title="innerHTML 與使用者輸入">
  <p>任何時候你要將「使用者輸入的資料」（來自 URL 參數、表單、API 回應中的字串）插入 innerHTML，都必須先轉義或使用信任的 HTML 標記系統。<code>textContent</code> 是安全的替代品。如果確實需要插入 HTML，使用 DOMPurify 或原生 Sanitizer API 白名單過濾。</p>
</book-callout>

<h2 id="ch08-s03">Tagged Template Literals 作為零依賴的渲染引擎</h2>

<p>Tagged Template Literals 是 ES2015 的特性，讓你可以用自訂函式解析模板字串。利用這個特性，可以建立一個「零依賴的渲染引擎」——它比 innerHTML 安全（自動轉義），又比手動 DOM 操作更易讀。更重要的是，結合 DOM caching 技術，可以做到「只更新改變的部分」。</p>

<book-code-block language="typescript" label="Tagged Template Literal 渲染引擎實作">
// ── 第一步：安全的 HTML 標記系統 ──

// 安全 HTML 的型別標記
const SAFE_HTML = Symbol('safe-html')

interface SafeHTML {
  [SAFE_HTML]: true
  strings: TemplateStringsArray
  values: unknown[]
}

function html(strings: TemplateStringsArray, ...values: unknown[]): SafeHTML {
  return { [SAFE_HTML]: true, strings, values }
}

function isSafeHTML(val: unknown): val is SafeHTML {
  return typeof val === 'object' &amp;&amp; val !== null &amp;&amp; SAFE_HTML in val
}

// HTML 字元轉義
function escape(val: unknown): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'boolean') return ''
  return String(val)
    .replace(/&amp;/g, '&amp;amp;')
    .replace(/&lt;/g, '&amp;lt;')
    .replace(/&gt;/g, '&amp;gt;')
    .replace(/"/g, '&amp;quot;')
}

// ── 第二步：渲染到字串（基礎版本）──
function renderToString(template: SafeHTML): string {
  const { strings, values } = template
  let result = ''

  strings.forEach((str, i) =&gt; {
    result += str
    if (i &lt; values.length) {
      const value = values[i]
      if (isSafeHTML(value)) {
        // 巢狀的 html tag：遞迴渲染
        result += renderToString(value)
      } else if (Array.isArray(value)) {
        // 陣列：渲染每個元素
        result += value.map(item =&gt;
          isSafeHTML(item) ? renderToString(item) : escape(item)
        ).join('')
      } else {
        // 其他值：自動轉義
        result += escape(value)
      }
    }
  })

  return result
}

// ── 第三步：渲染到 DOM（進階版本，支援差異更新）──
// 關鍵技術：Marker Comments（標記注釋）
// 在動態值的位置插入 HTML 注釋（&lt;!--{{0}}--&gt;），
// 讓我們在下次更新時找到確切的位置

// 注意：以下是簡化示意，完整實作需要更複雜的 DOM 差異邏輯

class TemplateInstance {
  private container: DocumentFragment
  private markerPositions: Map&lt;number, Node[]&gt; = new Map()

  constructor(private template: SafeHTML) {
    this.container = document.createDocumentFragment()
    this.initialize()
  }

  private initialize() {
    const html = this.buildHTMLWithMarkers()
    const temp = document.createElement('div')
    temp.innerHTML = html

    // 找到所有 marker 注釋，記錄位置
    const walker = document.createTreeWalker(
      temp,
      NodeFilter.SHOW_COMMENT,
      null
    )

    let node: Comment | null
    while ((node = walker.nextNode() as Comment | null)) {
      const match = node.textContent?.match(/^\{\{(\d+)\}\}$/)
      if (match) {
        const index = parseInt(match[1]!)
        const markers = this.markerPositions.get(index) ?? []
        markers.push(node)
        this.markerPositions.set(index, markers)
      }
    }

    // 移動到 fragment
    while (temp.firstChild) {
      this.container.appendChild(temp.firstChild)
    }

    // 執行初始渲染
    this.updateValues()
  }

  private buildHTMLWithMarkers(): string {
    const { strings } = this.template
    let result = ''
    strings.forEach((str, i) =&gt; {
      result += str
      if (i &lt; strings.length - 1) {
        // 在動態值位置插入 marker 注釋
        result += \`&lt;!--{{\${i}}}--&gt;\`
      }
    })
    return result
  }

  private updateValues() {
    const { values } = this.template
    values.forEach((value, i) =&gt; {
      const markers = this.markerPositions.get(i)
      if (!markers) return

      const marker = markers[0] as Comment
      if (!marker.parentNode) return

      // 根據值的類型決定如何更新
      if (typeof value === 'string' || typeof value === 'number') {
        // 在 marker 後插入文字節點
        const textNode = document.createTextNode(escape(value))
        marker.parentNode.insertBefore(textNode, marker.nextSibling)
      }
    })
  }

  getFragment(): DocumentFragment {
    return this.container
  }
}

// ── 在 Custom Element 中使用 ──
class TemplateRenderedList extends HTMLElement {
  private items: string[] = ['Apple', 'Banana', 'Cherry']
  private container!: HTMLElement

  connectedCallback() {
    this.attachShadow({ mode: 'open' })
    this.shadowRoot!.innerHTML = \`
      &lt;style&gt;:host { display: block; } ul { list-style: none; padding: 0; } li { padding: 8px; border-bottom: 1px solid #e5e7eb; }&lt;/style&gt;
      &lt;div class="container"&gt;&lt;/div&gt;
    \`
    this.container = this.shadowRoot!.querySelector('.container')!
    this.render()
  }

  addItem(item: string) {
    this.items = [...this.items, item]
    this.render()
  }

  private render() {
    // 使用 html tag：動態值自動轉義
    const template = html\`
      &lt;ul&gt;
        \${this.items.map(item =&gt; html\`&lt;li&gt;\${item}&lt;/li&gt;\`)}
      &lt;/ul&gt;
    \`
    // 渲染到字串然後安全地設定（因為動態值已轉義）
    this.container.innerHTML = renderToString(template)
  }
}

customElements.define('template-list', TemplateRenderedList)
</book-code-block>

<h2 id="ch08-s04">理解 Lit 的 html tag 與「Sticky Binding」的設計技巧</h2>

<p>Lit 的渲染機制建立在 Tagged Template Literals 之上，但它的獨特之處在於「<strong>Sticky Binding</strong>」的設計——模板的靜態結構（HTML 字串部分）只需解析一次，之後只更新動態值（binding parts）的位置。這是 Lit 能夠比 innerHTML 快得多的核心原因。</p>

<book-code-block language="typescript" label="Sticky Binding 原理的簡化示範">
// ── 核心洞察：Template Strings Array 是靜態的 ──
// Tagged Template Literal 中的 strings 部分（靜態 HTML）
// 在所有呼叫之間都是「同一個陣列的同一個參考」！
// 這意味著我們可以用它作為快取 key。

function html(strings: TemplateStringsArray, ...values: unknown[]) {
  return { strings, values }
}

// 驗證：每次呼叫 render() 時，strings 是相同的參考
function render(name: string) {
  return html\`&lt;h1&gt;Hello \${name}!&lt;/h1&gt;\`
}

const r1 = render('Alice')
const r2 = render('Bob')

// r1.strings === r2.strings 是 true（相同陣列參考）
// r1.values[0] === 'Alice'，r2.values[0] === 'Bob'（只有值不同）
console.log(r1.strings === r2.strings) // true！

// ── Sticky Binding 快取機制（概念版）──
// 第一次渲染某個模板時，解析靜態 HTML，建立 DOM 節點，
// 並標記所有動態值（binding）的位置（用 TreeWalker 找到 marker）。
// 這些資訊快取起來（以 strings 陣列為 key）。
// 之後的每次渲染，直接重用快取的 DOM，只更新有變化的 binding 位置。

const templateCache = new WeakMap&lt;TemplateStringsArray, {
  template: HTMLTemplateElement
  bindingLocations: Array&lt;{ node: Node; type: 'attribute' | 'node' | 'property' }&gt;
}&gt;()

// 簡化版 commit（更新 binding 值）
function commitBinding(
  node: Node,
  type: 'text' | 'attribute' | 'property',
  value: unknown
): void {
  if (type === 'text') {
    if (node.nodeType === Node.TEXT_NODE) {
      // ✅ 只更新文字節點的值，不重建 DOM
      if (node.textContent !== String(value)) {
        node.textContent = String(value)
      }
    }
  } else if (type === 'attribute') {
    const el = node as Element
    const attrName = 'data-attr'
    const strVal = String(value)
    if (el.getAttribute(attrName) !== strVal) {
      el.setAttribute(attrName, strVal)
    }
  }
}

// ── Lit 渲染流程（概念說明）──
// 1. html\`...\$ {value}...\` 被呼叫
//    → 回傳 TemplateResult { strings, values }
// 2. render(TemplateResult, container) 被呼叫
//    → 用 strings 查詢快取
//    a. 快取命中（第二次以後渲染同一模板）：
//       → 取出之前快取的 Part 物件（binding 位置）
//       → 逐一比較每個 value 是否改變
//       → 只更新有改變的 Part
//       → DOM 操作最小化！
//    b. 快取未命中（第一次渲染）：
//       → 建立 &lt;template&gt; 元素，填入靜態 HTML（帶 marker）
//       → cloneNode 得到可用的 DOM 片段
//       → TreeWalker 找到所有 marker，建立 Part 物件
//       → 存入快取，執行初始賦值

// ── Part 型別（binding 的抽象）──
// Lit 定義了幾種 Part 型別：
// - ChildPart：文字節點和子元素（{{ value }} 在元素內容中）
// - AttributePart：HTML attribute 的值（attr="${'${value}'}"）
// - PropertyPart：DOM property（.prop="${'${value}'}"）
// - EventPart：事件監聽器（@event="${'${handler}'}"）
// - BooleanAttributePart：布林 attribute（?attr="${'${bool}'}"）

// ── 數字比較（說明 Lit 優於 innerHTML 的效能）──
interface BenchmarkResult {
  method: string
  initialRenderMs: number
  updateRenderMs: number
  description: string
}

const benchmarks: BenchmarkResult[] = [
  {
    method: 'innerHTML',
    initialRenderMs: 12,
    updateRenderMs: 10,
    description: '每次更新都重建整個 DOM 樹，破壞焦點和動畫',
  },
  {
    method: 'Lit html tag',
    initialRenderMs: 18,
    updateRenderMs: 0.5,
    description: '第一次稍慢（快取建立），之後只更新改變的 binding',
  },
  {
    method: '直接 DOM 操作',
    initialRenderMs: 2,
    updateRenderMs: 0.1,
    description: '最快但需要手動管理每個更新點，程式碼量最多',
  },
]

console.table(benchmarks)
// 結論：Lit 的 Sticky Binding 讓更新效能接近直接 DOM 操作，
// 同時保持聲明式的程式碼風格
</book-code-block>

<h2 id="ch08-s05">Incremental DOM 與 Virtual DOM 的概念比較</h2>

<p>Virtual DOM（由 React 普及）和 Incremental DOM（由 Google Closure 編譯器和 Angular Ivy 使用）是兩種截然不同的「DOM 差異化（diffing）」策略。理解它們的差異，能幫助你在選擇渲染策略時做出更有依據的決定。</p>

<book-code-block language="typescript" label="Virtual DOM 與 Incremental DOM 的概念對比">
// ── Virtual DOM 的工作原理（React 模型）──
// 每次渲染：
// 1. 呼叫 render() 函式，建立一整棵 Virtual DOM 樹（純 JS 物件）
// 2. 與上一次的 Virtual DOM 樹進行 Diff 比較
// 3. 計算出最小的 DOM 操作集合（Patch）
// 4. 將 Patch 應用到真實 DOM

// Virtual DOM 節點的簡化型別
interface VNode {
  type: string | Function
  props: Record&lt;string, unknown&gt;
  children: VNode[]
  key?: string | number
}

// 建立 VNode 的工廠函式（類似 React.createElement）
function h(
  type: string,
  props: Record&lt;string, unknown&gt;,
  ...children: (VNode | string)[]
): VNode {
  return {
    type,
    props,
    children: children.map(child =&gt;
      typeof child === 'string'
        ? { type: '#text', props: { content: child }, children: [] }
        : child
    ),
  }
}

// Virtual DOM Diff 的核心邏輯（超級簡化版）
function diff(oldVNode: VNode | null, newVNode: VNode | null): DOMPatch[] {
  const patches: DOMPatch[] = []

  if (!oldVNode &amp;&amp; newVNode) {
    patches.push({ type: 'INSERT', vnode: newVNode })
  } else if (oldVNode &amp;&amp; !newVNode) {
    patches.push({ type: 'REMOVE', vnode: oldVNode })
  } else if (oldVNode &amp;&amp; newVNode) {
    if (oldVNode.type !== newVNode.type) {
      // 節點型別不同：整個替換
      patches.push({ type: 'REPLACE', oldVNode, newVNode })
    } else {
      // 節點型別相同：比較 props 差異
      const propDiff = diffProps(oldVNode.props, newVNode.props)
      if (Object.keys(propDiff).length &gt; 0) {
        patches.push({ type: 'UPDATE_PROPS', vnode: newVNode, props: propDiff })
      }
      // 遞迴 diff 子節點
      const maxLen = Math.max(
        oldVNode.children.length,
        newVNode.children.length
      )
      for (let i = 0; i &lt; maxLen; i++) {
        patches.push(...diff(
          oldVNode.children[i] ?? null,
          newVNode.children[i] ?? null
        ))
      }
    }
  }

  return patches
}

function diffProps(
  oldProps: Record&lt;string, unknown&gt;,
  newProps: Record&lt;string, unknown&gt;
): Record&lt;string, unknown&gt; {
  const diff: Record&lt;string, unknown&gt; = {}
  const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)])
  for (const key of allKeys) {
    if (oldProps[key] !== newProps[key]) {
      diff[key] = newProps[key]
    }
  }
  return diff
}

type DOMPatch =
  | { type: 'INSERT'; vnode: VNode }
  | { type: 'REMOVE'; vnode: VNode }
  | { type: 'REPLACE'; oldVNode: VNode; newVNode: VNode }
  | { type: 'UPDATE_PROPS'; vnode: VNode; props: Record&lt;string, unknown&gt; }

// ── Incremental DOM 的工作原理（不同之處）──
// Incremental DOM 不建立中間的 Virtual DOM 樹。
// 它直接在真實 DOM 上「遍歷並比對」。
//
// 核心概念：
// - elementOpen(tag, key, props)：在真實 DOM 中找到/建立對應節點，移動「cursor」到它
// - elementClose(tag)：完成目前節點，cursor 移回父節點
// - text(value)：設定文字節點的值
//
// 優點：記憶體使用量更低（不需要儲存整棵虛擬 DOM 樹）
// 缺點：API 使用起來不如 JSX 直觀

// Incremental DOM 的概念示意：
// 等同於：
// &lt;div class="user"&gt;
//   &lt;h2&gt;{name}&lt;/h2&gt;
//   &lt;p&gt;{bio}&lt;/p&gt;
// &lt;/div&gt;
function renderUser_IncrementalDOM(
  cursor: { node: Node },
  name: string,
  bio: string
) {
  // 概念性的 Incremental DOM API
  // elementOpen(cursor, 'div', null, ['class', 'user'])
  //   elementOpen(cursor, 'h2')
  //     text(cursor, name)      // 只有值不同時，才實際更新 DOM
  //   elementClose(cursor, 'h2')
  //   elementOpen(cursor, 'p')
  //     text(cursor, bio)
  //   elementClose(cursor, 'p')
  // elementClose(cursor, 'div')
  console.log('Incremental DOM render:', name, bio, cursor)
}
</book-code-block>

<div class="table-wrapper">
  <table>
    <thead>
      <tr>
        <th>渲染策略</th>
        <th>第一次渲染</th>
        <th>更新渲染</th>
        <th>記憶體使用</th>
        <th>程式碼複雜度</th>
        <th>典型用途</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>直接 DOM 操作</td>
        <td>最快</td>
        <td>最快</td>
        <td>最低</td>
        <td>高（手動管理）</td>
        <td>局部更新、動畫</td>
      </tr>
      <tr>
        <td>innerHTML</td>
        <td>快</td>
        <td>中（全量重建）</td>
        <td>低</td>
        <td>低</td>
        <td>初始化、原型開發</td>
      </tr>
      <tr>
        <td>Template + clone</td>
        <td>中</td>
        <td>中（重建 DOM 但不解析 HTML）</td>
        <td>低</td>
        <td>中</td>
        <td>列表渲染</td>
      </tr>
      <tr>
        <td>Lit / Sticky Binding</td>
        <td>中</td>
        <td>快（只更新 binding）</td>
        <td>中（模板快取）</td>
        <td>低（聲明式）</td>
        <td>通用 Web Components</td>
      </tr>
      <tr>
        <td>Virtual DOM（React）</td>
        <td>慢</td>
        <td>中（diff + patch）</td>
        <td>高（兩棵 vdom 樹）</td>
        <td>低（JSX）</td>
        <td>複雜應用、頻繁更新</td>
      </tr>
      <tr>
        <td>Incremental DOM</td>
        <td>中</td>
        <td>快（就地比對）</td>
        <td>低（無虛擬樹）</td>
        <td>中</td>
        <td>Angular Ivy、大型模板</td>
      </tr>
    </tbody>
  </table>
</div>

<book-callout variant="tip" title="選擇渲染策略的決策框架">
  <p>1）元件狀態簡單、更新點固定（如 badge、tooltip）→ 直接 DOM 操作；2）初始化一次後不再更新（如 static card）→ innerHTML 可接受；3）列表渲染且項目會增刪 → Template + clone，或考慮 Lit；4）狀態複雜、頻繁更新、多個 binding → Lit 或 Virtual DOM；5）需要 SSR 且效能敏感 → Incremental DOM（Angular）或 Lit（支援 SSR）。</p>
</book-callout>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>渲染策略是效能與開發體驗的取捨——直接 DOM 操作最快但最脆弱，Virtual DOM 最易用但記憶體開銷最高，Lit 的 Sticky Binding 在兩者之間找到了最佳平衡點：以模板快取換取接近原生的更新效能。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch07">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">Reactive Properties — 自己打造響應式系統</span>
    </a>
    <a class="footer-link" href="#ch09">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">Lit — 站在原生 Web Components 上的輕量框架</span>
    </a>
  </div>
</div>
`
