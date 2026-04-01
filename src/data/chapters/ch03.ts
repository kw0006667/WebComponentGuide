export const metadata = {
  id: 3,
  part: 1,
  title: 'Shadow DOM — 真正的樣式與結構封裝',
  tags: ['面試重點'] as string[],
  sections: [
    { slug: 'ch03-s01', title: 'Open 與 Closed Shadow Root 的取捨，以及各自的適用時機' },
    { slug: 'ch03-s02', title: '樣式封裝：CSS Cascade 如何被切斷，又如何被重建' },
    { slug: 'ch03-s03', title: 'CSS Custom Properties 作為元件的樣式 API 介面' },
    { slug: 'ch03-s04', title: '::part() 與 ::slotted() — 封裝的逃生出口' },
    { slug: 'ch03-s05', title: 'Event retargeting 與 composedPath() 的運作原理' },
    { slug: 'ch03-s06', title: 'Shadow Root 內的 Focus 管理' },
    { slug: 'ch03-interview', title: '面試題：Event retargeting 跨越 Shadow Boundary 的機制' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 03 · 第一部：基礎篇 — Web 平台的原生能力</div>
  <h1>Shadow DOM — 真正的樣式與結構封裝</h1>
  <p>Shadow DOM 是 Web Components 中最強大也最容易引發困惑的特性。它在瀏覽器層級實現了真正的樣式與 DOM 封裝，讓元件的內部結構對外部世界不可見——但代價是需要理解一套全新的 CSS 規則和事件模型。本章深入每一個細節，包括 open/closed 的取捨、CSS Custom Properties 作為樣式 API，以及許多開發者在面試中被考倒的 Event retargeting。</p>
  <div class="chapter-tags"><span class="tag tag-interview">面試重點</span></div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch03-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">Open 與 Closed Shadow Root</span>
    </a>
    <a class="catalog-item" href="#ch03-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">樣式封裝：CSS Cascade 切斷與重建</span>
    </a>
    <a class="catalog-item" href="#ch03-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">CSS Custom Properties 樣式 API</span>
    </a>
    <a class="catalog-item" href="#ch03-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">::part() 與 ::slotted()</span>
    </a>
    <a class="catalog-item" href="#ch03-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">Event retargeting 與 composedPath()</span>
    </a>
    <a class="catalog-item" href="#ch03-s06">
      <span class="catalog-item-num">06</span>
      <span class="catalog-item-title">Shadow Root 內的 Focus 管理</span>
    </a>
    <a class="catalog-item" href="#ch03-interview">
      <span class="catalog-item-num">07</span>
      <span class="catalog-item-title">面試題：Event retargeting 機制</span>
    </a>
  </div>
</div>

<h2 id="ch03-s01">Open 與 Closed Shadow Root 的取捨，以及各自的適用時機</h2>

<p>呼叫 <code>attachShadow()</code> 時，必須指定 <code>mode</code> 參數為 <code>'open'</code> 或 <code>'closed'</code>。這個選擇決定了外部 JavaScript 是否能夠透過 <code>element.shadowRoot</code> 存取 Shadow DOM 的內部結構。這個決定比看起來更複雜，牽涉到安全性、可測試性和框架整合等多個面向。</p>

<p><strong>Open mode</strong> 讓 <code>element.shadowRoot</code> 回傳 <code>ShadowRoot</code> 物件，任何外部程式碼都能存取內部 DOM。這對開發工具（DevTools）、測試框架（Playwright、Cypress）、以及需要與元件互動的框架（如 React 的 ref）都更友好。</p>

<p><strong>Closed mode</strong> 讓 <code>element.shadowRoot</code> 回傳 <code>null</code>，外部程式碼無法直接存取內部 DOM。這提供了一定程度的「內部實作私有化」，但要注意：這並非真正的安全機制——有心人仍然可以透過 monkey-patching <code>HTMLElement.prototype.attachShadow</code> 來攔截並保存 shadow root 的參考。</p>

<book-code-block language="typescript" label="Open vs Closed Shadow Root 完整對比">
// ── Open Mode ──
class OpenCard extends HTMLElement {
  // shadowRoot 自動被設定為 ShadowRoot 型別
  // TypeScript 知道 this.shadowRoot 不為 null（在 attachShadow 後）
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = \`
      &lt;style&gt;:host { display: block; padding: 16px; }&lt;/style&gt;
      &lt;slot&gt;&lt;/slot&gt;
    \`
  }
}
customElements.define('open-card', OpenCard)

// 外部可以存取：
// const card = document.querySelector('open-card')
// card.shadowRoot  // ← 回傳 ShadowRoot
// card.shadowRoot.querySelector('slot')  // ← 可以存取內部元素

// ── Closed Mode ──
class ClosedCard extends HTMLElement {
  // 必須自己保存 shadow root 的參考，
  // 因為 this.shadowRoot 會回傳 null
  private shadow: ShadowRoot

  constructor() {
    super()
    // 保存 shadow 參考在 private 屬性中
    this.shadow = this.attachShadow({ mode: 'closed' })
  }

  connectedCallback() {
    this.shadow.innerHTML = \`
      &lt;style&gt;:host { display: block; padding: 16px; }&lt;/style&gt;
      &lt;slot&gt;&lt;/slot&gt;
    \`
  }

  // 仍然可以暴露公開方法
  setTheme(theme: 'light' | 'dark') {
    const style = this.shadow.querySelector('style')
    if (style) {
      style.textContent += \`:host { color-scheme: \${theme}; }\`
    }
  }
}
customElements.define('closed-card', ClosedCard)

// 外部無法存取：
// const card = document.querySelector('closed-card')
// card.shadowRoot  // ← 回傳 null
// card.shadow      // ← TypeScript 錯誤：private

// ── Closed mode 的破解（說明它不是安全邊界）──
const originalAttachShadow = HTMLElement.prototype.attachShadow
const shadowRoots = new WeakMap&lt;HTMLElement, ShadowRoot&gt;()

// 這只是演示，實際不要這樣做
HTMLElement.prototype.attachShadow = function(init: ShadowRootInit) {
  const shadow = originalAttachShadow.call(this, init)
  shadowRoots.set(this, shadow)  // 攔截並保存
  return shadow
}
// 之後：shadowRoots.get(card)  // 仍然可以拿到 shadow root
</book-code-block>

<div class="table-wrapper">
  <table>
    <thead>
      <tr>
        <th>比較項目</th>
        <th>Open</th>
        <th>Closed</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>this.shadowRoot</td>
        <td>回傳 ShadowRoot</td>
        <td>回傳 null</td>
      </tr>
      <tr>
        <td>DevTools 可見度</td>
        <td>完整可見</td>
        <td>可見，但不能 JS 存取</td>
      </tr>
      <tr>
        <td>測試框架相容性</td>
        <td>✅ 完整支援</td>
        <td>⚠️ 需要額外配置</td>
      </tr>
      <tr>
        <td>框架整合（React ref）</td>
        <td>✅ 正常運作</td>
        <td>⚠️ 需要公開方法替代</td>
      </tr>
      <tr>
        <td>真正的安全性</td>
        <td>❌</td>
        <td>❌（可被繞過）</td>
      </tr>
      <tr>
        <td>推薦使用情境</td>
        <td>一般應用、設計系統</td>
        <td>第三方嵌入 widget（心理層面隔離）</td>
      </tr>
    </tbody>
  </table>
</div>

<book-callout variant="tip" title="最佳實踐">
  <p>在絕大多數情況下，使用 <code>mode: 'open'</code>。Closed mode 帶來的「安全性」是虛假的，卻會造成真實的開發困難。唯一值得考慮 Closed mode 的場景是：你在開發第三方嵌入元件（如付款表單 widget），需要一定的心理隔離來防止意外存取，並且已接受無法使用常規測試工具的代價。</p>
</book-callout>

<h2 id="ch03-s02">樣式封裝：CSS Cascade 如何被切斷，又如何被重建</h2>

<p>Shadow DOM 最核心的特性是樣式封裝（Style Encapsulation）。它在 CSS Cascade 中建立了一個邊界，讓 Shadow DOM 內外的樣式互不干擾——但這個邊界不是完全不可穿越的，有幾個特定的「穿牆洞」需要理解。</p>

<h3>封裝規則</h3>
<ul>
  <li><strong>外部 CSS 不會進入 Shadow DOM：</strong>頁面上的 <code>.my-button { color: red }</code> 不會影響 Shadow DOM 內部的 <code>.my-button</code></li>
  <li><strong>Shadow DOM 內的 CSS 不會洩漏到外部：</strong>Shadow DOM 內的 <code>button { color: blue }</code> 不會影響頁面上的 <code>&lt;button&gt;</code> 元素</li>
  <li><strong>繼承屬性可以穿透：</strong><code>color</code>、<code>font-family</code>、<code>line-height</code> 等可繼承的 CSS 屬性，會從宿主元素（host element）繼承到 Shadow DOM 內部</li>
  <li><strong>CSS Custom Properties（變數）可以穿透：</strong>這是設計樣式 API 的關鍵機制（詳見下一節）</li>
</ul>

<book-code-block language="typescript" label="樣式封裝的完整示範">
class StyledCard extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = \`
      &lt;style&gt;
        /*
         * :host 選擇器指向宿主元素本身（&lt;styled-card&gt;）
         * 這是控制元件外層的唯一方式
         */
        :host {
          display: block;         /* 讓元件表現為區塊元素 */
          contain: content;       /* 效能優化：告訴瀏覽器內容封裝 */
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        /* :host() 可以傳入條件選擇器 */
        :host([variant="elevated"]) {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, .1);
        }

        :host([disabled]) {
          opacity: 0.5;
          pointer-events: none;
        }

        /* :host-context() 根據祖先元素改變樣式（較少用）*/
        :host-context(.dark-theme) {
          border-color: #374151;
          background: #1f2937;
        }

        /* Shadow DOM 內部的 CSS，不會影響外部 */
        .header {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          font-weight: 600;
        }

        .body {
          padding: 16px;
        }

        /* 繼承屬性：font-family 從宿主繼承，但你也可以明確設定 */
        :host {
          font-family: inherit; /* 明確繼承 */
        }

        /*
         * 重置：如果你不想繼承外部樣式，
         * 可以在 :host 上使用 all: initial（慎用，會重置所有屬性）
         */
        /* :host { all: initial; } */
      &lt;/style&gt;

      &lt;div class="header"&gt;
        &lt;slot name="header"&gt;Card Header&lt;/slot&gt;
      &lt;/div&gt;
      &lt;div class="body"&gt;
        &lt;slot&gt;&lt;/slot&gt;
      &lt;/div&gt;
    \`
  }
}

customElements.define('styled-card', StyledCard)
</book-code-block>

<book-callout variant="warning" title="繼承屬性會穿透 Shadow Boundary">
  <p>如果你的頁面上設定了 <code>body { font-size: 14px; color: #333 }</code>，這些樣式<strong>會</strong>影響 Shadow DOM 內部的文字。這是 CSS 繼承的正常行為，也是讓 Web Components 能融入現有設計系統的機制。如果你不想繼承，需要在 <code>:host</code> 上明確重置：<code>:host { color: initial; font-size: initial; }</code>。</p>
</book-callout>

<h2 id="ch03-s03">CSS Custom Properties 作為元件的樣式 API 介面</h2>

<p>CSS Custom Properties（CSS 變數）是 Shadow DOM 樣式封裝的「官方逃生出口」。它們能夠穿透 Shadow Boundary，讓元件的使用者在不破壞封裝的情況下客製化元件樣式。這是設計設計系統元件樣式 API 的標準做法。</p>

<book-code-block language="typescript" label="CSS Custom Properties 作為樣式 API">
class ThemedButton extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = \`
      &lt;style&gt;
        :host {
          display: inline-block;
        }

        /*
         * 使用 CSS Custom Properties 作為樣式介面
         * 格式：var(--元件名稱-屬性名稱, 預設值)
         * 命名慣例：--{component-name}-{property}
         */
        button {
          /* 顏色 API */
          background-color: var(--themed-button-bg, #4f46e5);
          color: var(--themed-button-color, white);
          border-color: var(--themed-button-border, transparent);

          /* 尺寸 API */
          padding: var(--themed-button-padding-y, 8px) var(--themed-button-padding-x, 16px);
          font-size: var(--themed-button-font-size, 0.875rem);
          border-radius: var(--themed-button-radius, 6px);

          /* 其他 */
          border-width: 1px;
          border-style: solid;
          cursor: pointer;
          font-family: inherit;
          font-weight: 600;
          transition: background-color 0.15s ease;
        }

        button:hover {
          /* 可以基於原有變數計算 hover 狀態 */
          background-color: var(--themed-button-bg-hover, #4338ca);
        }

        button:focus-visible {
          outline: 2px solid var(--themed-button-focus-ring, #818cf8);
          outline-offset: 2px;
        }

        /* 支援 size variant */
        :host([size="sm"]) button {
          --themed-button-padding-y: 4px;
          --themed-button-padding-x: 10px;
          --themed-button-font-size: 0.75rem;
        }

        :host([size="lg"]) button {
          --themed-button-padding-y: 12px;
          --themed-button-padding-x: 24px;
          --themed-button-font-size: 1rem;
        }
      &lt;/style&gt;
      &lt;button part="button"&gt;
        &lt;slot&gt;&lt;/slot&gt;
      &lt;/button&gt;
    \`
  }
}

customElements.define('themed-button', ThemedButton)

// ── 使用者如何客製化樣式 ──
// HTML/CSS 中：
// themed-button {
//   --themed-button-bg: #dc2626;          /* 紅色主題 */
//   --themed-button-bg-hover: #b91c1c;
//   --themed-button-radius: 999px;        /* 圓角 pill 樣式 */
// }
//
// 或針對特定情境：
// .dark-theme themed-button {
//   --themed-button-bg: #818cf8;
//   --themed-button-color: #1e1b4b;
// }

// ── JavaScript 動態設定 CSS Custom Properties ──
function applyTheme(element: HTMLElement, theme: Record&lt;string, string&gt;) {
  for (const [key, value] of Object.entries(theme)) {
    element.style.setProperty(key, value)
  }
}

const btn = document.querySelector('themed-button')!
applyTheme(btn, {
  '--themed-button-bg': '#059669',
  '--themed-button-bg-hover': '#047857',
  '--themed-button-radius': '0',
})
</book-code-block>

<h2 id="ch03-s04">::part() 與 ::slotted() — 封裝的逃生出口</h2>

<p>除了 CSS Custom Properties，還有兩個 CSS 偽元素可以讓外部樣式「有限度地」進入 Shadow DOM：<code>::part()</code> 和 <code>::slotted()</code>。它們各有不同的適用場景和限制。</p>

<book-code-block language="typescript" label="::part() 與 ::slotted() 的完整使用">
class ComplexForm extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = \`
      &lt;style&gt;
        :host { display: block; }

        /* 基礎樣式，可被外部 ::part() 覆蓋 */
        .input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        input {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          outline: none;
        }

        input:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        /* ::slotted() 選擇器：樣式化被 slot 的外部內容 */
        /* 只能選到直接子元素（不能選後代）*/
        ::slotted(label) {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          display: block;
          margin-bottom: 4px;
        }

        ::slotted([slot="helper-text"]) {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 4px;
          display: block;
        }

        ::slotted([slot="error"]) {
          font-size: 0.75rem;
          color: #dc2626;
          margin-top: 4px;
          display: block;
        }
      &lt;/style&gt;

      &lt;div class="input-wrapper"&gt;
        &lt;!-- slot="label" 的內容會被 ::slotted(label) 樣式化 --&gt;
        &lt;slot name="label"&gt;&lt;/slot&gt;

        &lt;!--
          part="input" 讓外部可以用 complex-form::part(input) 選取並樣式化
          這個 input 元素
        --&gt;
        &lt;input part="input" type="text" /&gt;

        &lt;slot name="helper-text"&gt;&lt;/slot&gt;
        &lt;slot name="error"&gt;&lt;/slot&gt;
      &lt;/div&gt;
    \`
  }
}

customElements.define('complex-form', ComplexForm)

// ── 外部如何使用 ::part() ──
// CSS：
// /* 選取 complex-form 的 shadow part "input" */
// complex-form::part(input) {
//   border-radius: 0;           /* 方形輸入框 */
//   border-color: #9333ea;      /* 紫色邊框 */
//   font-family: 'Monaco', monospace;
// }
//
// /* 甚至可以結合狀態偽類別！*/
// complex-form::part(input):focus {
//   border-color: #7e22ce;
//   box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.2);
// }
//
// /* ::part() 無法選取後代，但可以 exportparts 轉發 */
// /* 如果 complex-form 內部嵌套了其他 Shadow DOM，
//    需要用 exportparts attribute 將 part 轉發到外層 */

// ── exportparts 轉發範例 ──
class Wrapper extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })
    // exportparts 語法：內部part名稱:外部可見的名稱
    shadow.innerHTML = \`
      &lt;complex-form exportparts="input: wrapper-input"&gt;&lt;/complex-form&gt;
    \`
  }
}
// 外部現在可以用 wrapper::part(wrapper-input) 存取到最深層的 input
</book-code-block>

<div class="table-wrapper">
  <table>
    <thead>
      <tr>
        <th>特性</th>
        <th>::part()</th>
        <th>::slotted()</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>目標</td>
        <td>Shadow DOM 內部有 part 屬性的元素</td>
        <td>被插入 slot 的外部（Light DOM）元素</td>
      </tr>
      <tr>
        <td>選取深度</td>
        <td>只有宣告 part 的元素（需 exportparts 轉發）</td>
        <td>只有直接子元素（不能選後代）</td>
      </tr>
      <tr>
        <td>CSS 限制</td>
        <td>不能使用後代選擇器</td>
        <td>只能選複合選擇器，不能用後代</td>
      </tr>
      <tr>
        <td>控制權</td>
        <td>元件作者決定哪些 part 可被樣式化</td>
        <td>使用者插入的內容可被樣式化</td>
      </tr>
      <tr>
        <td>典型用途</td>
        <td>讓使用者客製化特定內部元素</td>
        <td>統一樣式化插入的 label、icon 等</td>
      </tr>
    </tbody>
  </table>
</div>

<h2 id="ch03-s05">Event retargeting 與 composedPath() 的運作原理</h2>

<p>Event retargeting 是 Shadow DOM 最精妙也最容易令人困惑的特性之一。當一個事件從 Shadow DOM 內部的元素冒泡到外部時，瀏覽器會修改事件的 <code>target</code> 屬性——讓外部觀察者看到的 <code>target</code> 是宿主元素（Custom Element 本身），而不是 Shadow DOM 內部的真實來源元素。這個機制叫做 Event Retargeting（事件重定向）。</p>

<book-code-block language="typescript" label="Event retargeting 完整示範">
class RetargetDemo extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = \`
      &lt;style&gt;
        :host { display: block; padding: 16px; border: 2px solid #e5e7eb; }
        button { padding: 8px 16px; background: #4f46e5; color: white; border: none; cursor: pointer; }
      &lt;/style&gt;
      &lt;div class="inner-wrapper"&gt;
        &lt;button id="inner-btn"&gt;Click me (inside shadow)&lt;/button&gt;
      &lt;/div&gt;
    \`

    // ── 在 Shadow DOM 內部監聽：看到真實的 target ──
    shadow.addEventListener('click', (e: Event) =&gt; {
      // 在 Shadow DOM 內部，target 是真實的 button 元素
      console.log('Shadow listener - e.target:', e.target)
      // HTMLButtonElement#inner-btn ← 真實來源

      // composedPath() 回傳完整的事件傳播路徑（穿越 Shadow Boundary）
      console.log('Shadow listener - composedPath():', e.composedPath())
      // [button#inner-btn, div.inner-wrapper, shadow-root, retarget-demo, body, html, document, window]
    })
  }
}

customElements.define('retarget-demo', RetargetDemo)

// ── 在 Shadow DOM 外部監聽：看到 retarget 後的 target ──
document.addEventListener('click', (e: Event) =&gt; {
  // 外部觀察者看到的 target 是宿主元素，不是內部的 button
  console.log('Document listener - e.target:', e.target)
  // HTMLElement (retarget-demo) ← 已被重定向！

  // composedPath() 在外部也能呼叫，但 Shadow DOM 內部的元素被隱藏了
  // （在 closed mode 下完全隱藏，open mode 下仍然可見）
  const path = e.composedPath()
  console.log('Document listener - composedPath():', path)
  // [button#inner-btn, div.inner-wrapper, shadow-root, retarget-demo, ...]
  // 注意：在 closed mode 下，shadow-root 和 button#inner-btn 不會出現
})

// ── composed 屬性：決定事件能否穿越 Shadow Boundary ──
class EventDemo extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = \`&lt;button id="btn"&gt;Dispatch Events&lt;/button&gt;\`

    const btn = shadow.querySelector('#btn')!
    btn.addEventListener('click', () =&gt; {
      // composed: false → 事件在 Shadow Boundary 停止，不會冒泡到外部
      const internalEvent = new CustomEvent('internal-action', {
        bubbles: true,
        composed: false,  // 只在 Shadow DOM 內部傳播
        detail: { source: 'internal' }
      })
      btn.dispatchEvent(internalEvent)

      // composed: true → 事件穿越 Shadow Boundary 冒泡到外部
      const publicEvent = new CustomEvent('button-clicked', {
        bubbles: true,
        composed: true,  // 穿越 Shadow Boundary
        detail: { timestamp: Date.now() }
      })
      btn.dispatchEvent(publicEvent)
      // 外部可以監聽：element.addEventListener('button-clicked', ...)
    })
  }
}
</book-code-block>

<h3>事件傳播規則總整理</h3>
<ul>
  <li><strong>原生事件（如 click、input）：</strong>大多數都是 <code>composed: true</code>，會穿越 Shadow Boundary 並 retarget</li>
  <li><strong>focus/blur 事件：</strong><code>composed: true</code> 但不 bubble，改用 focusin/focusout</li>
  <li><strong>自訂事件（CustomEvent）：</strong>預設 <code>composed: false</code>，需要明確設定 <code>composed: true</code> 才能穿越</li>
  <li><strong>retargeting 只發生在 host element 的外部：</strong>在 Shadow DOM 內部監聽時，<code>target</code> 永遠是真實來源</li>
</ul>

<h2 id="ch03-s06">Shadow Root 內的 Focus 管理</h2>

<p>Shadow DOM 對 focus 管理有特殊規則。瀏覽器在處理頁面焦點時，需要知道焦點目前在哪個元素上，而 Shadow DOM 的封裝讓這個判斷變得更複雜。</p>

<book-code-block language="typescript" label="Shadow DOM Focus 管理的最佳實踐">
class FocusableWidget extends HTMLElement {
  private shadow: ShadowRoot
  private inputEl: HTMLInputElement | null = null

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  connectedCallback() {
    this.shadow.innerHTML = \`
      &lt;style&gt;
        :host {
          display: block;
          /* delegatesFocus 讓宿主元素 :focus 時，樣式也能套用到內部 focused 元素 */
        }
        :host(:focus-within) {
          /* 當 Shadow DOM 內部有元素 focused 時，樣式化宿主 */
          outline: 2px solid #4f46e5;
          outline-offset: 2px;
        }
        input {
          width: 100%;
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          outline: none;
        }
        input:focus {
          border-color: #4f46e5;
        }
      &lt;/style&gt;
      &lt;input type="text" placeholder="Type here..." /&gt;
    \`

    this.inputEl = this.shadow.querySelector('input')
  }

  // ── delegatesFocus 的替代方案：手動 focus 委派 ──
  // 當使用者 tab 到宿主元素時，自動聚焦內部的 input
  focus(options?: FocusOptions): void {
    this.inputEl?.focus(options)
  }

  // ── 取得 Shadow DOM 內部的 focused 元素 ──
  static getActiveElementInShadow(): Element | null {
    let active: Element | null = document.activeElement
    // 向下穿越 Shadow DOM 找到真正的 active element
    while (active?.shadowRoot) {
      active = active.shadowRoot.activeElement
    }
    return active
  }
}

// ── attachShadow 的 delegatesFocus 選項 ──
class DelegatesFocusWidget extends HTMLElement {
  connectedCallback() {
    // delegatesFocus: true 讓瀏覽器自動將 focus 委派給
    // Shadow DOM 內第一個可 focus 的元素
    const shadow = this.attachShadow({ mode: 'open', delegatesFocus: true })

    shadow.innerHTML = \`
      &lt;style&gt;
        :host { display: block; }
        /* 使用 delegatesFocus 時，:focus 偽類別同時套用到 host 和 focused 子元素 */
        input { padding: 8px; border: 2px solid #d1d5db; border-radius: 4px; }
        :host(:focus) input { border-color: #4f46e5; }
      &lt;/style&gt;
      &lt;input type="text" /&gt;
      &lt;button&gt;Submit&lt;/button&gt;
    \`
    // 當宿主元素獲得 focus 時，自動將 focus 移給內部第一個 focusable 元素（input）
  }
}

customElements.define('focusable-widget', FocusableWidget)
customElements.define('delegates-focus-widget', DelegatesFocusWidget)
</book-code-block>

<h2 id="ch03-interview">面試題：Event retargeting 跨越 Shadow Boundary 的機制</h2>

<book-callout variant="info" title="面試題">
  <p><strong>問題：</strong>請解釋 Shadow DOM 的 Event retargeting 是什麼？為什麼需要這個機制？<code>composedPath()</code> 和 <code>event.target</code> 有什麼差別？</p>

  <p><strong>模範答案：</strong></p>

  <p><strong>為什麼需要 Event retargeting：</strong>Shadow DOM 的核心設計原則是「封裝」——外部觀察者不應該知道 Shadow DOM 的內部結構。如果一個 click 事件發生在 Shadow DOM 內部的某個 <code>&lt;button&gt;</code> 上，而外部的事件監聽器能直接看到這個 <code>&lt;button&gt;</code> 是 <code>event.target</code>，那封裝就被破壞了。因此，瀏覽器在事件冒泡穿越 Shadow Boundary 時，會「重定向（retarget）」<code>event.target</code>，讓外部看到的 target 是宿主元素（Custom Element）本身。</p>

  <p><strong>retargeting 的觸發條件：</strong>當事件從 Shadow DOM 內部冒泡到 Shadow Boundary 外部時，瀏覽器自動重定向 <code>event.target</code>。在 Shadow DOM 內部的監聽器中，<code>event.target</code> 仍然是真實的來源元素。</p>

  <p><strong>composedPath() 的用途：</strong><code>event.composedPath()</code> 回傳完整的事件傳播路徑陣列，包括穿越 Shadow Boundary 的所有節點。這讓你在需要時能看到完整的傳播鏈，而不只是 retarget 後的 target。在 open mode 的 Shadow Root 中，路徑包含所有節點；在 closed mode 下，Shadow DOM 內部的節點對外部不可見。</p>

  <p><strong>composed 屬性的重要性：</strong><code>new CustomEvent('my-event', { composed: true })</code> 中的 <code>composed: true</code> 決定了自訂事件是否能穿越 Shadow Boundary。原生事件（click、input）大多默認 <code>composed: true</code>，但自訂事件默認 <code>composed: false</code>，需要明確設定。</p>

  <p><strong>實際影響：</strong>這對事件委派（event delegation）有直接影響。如果你在宿主元素外部用 <code>event.target.closest('button')</code> 來判斷點擊了哪個按鈕，在 Shadow DOM 場景下可能會失敗，因為 <code>event.target</code> 已被 retarget 成宿主元素。正確做法是在 Shadow DOM 內部進行事件委派，或讓元件透過自訂事件向外通知操作結果。</p>
</book-callout>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>Shadow DOM 的樣式封裝在瀏覽器層級生效，CSS Custom Properties 是設計樣式 API 的標準方式，而 Event retargeting 則保護了封裝的一致性——外部只能看到宿主元素，不能直接存取 Shadow DOM 的內部結構。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch02">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">Custom Elements — 定義你自己的 HTML 標籤</span>
    </a>
    <a class="footer-link" href="#ch04">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">HTML Templates 與 Slots</span>
    </a>
  </div>
</div>
`
