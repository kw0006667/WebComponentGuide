export const metadata = {
  id: 10,
  part: 2,
  title: 'Web Components 的樣式架構設計',
  tags: ['進階'] as string[],
  sections: [
    { slug: 'ch10-s01', title: 'Design Token 透過 CSS Custom Properties 對外開放樣式 API' },
    { slug: 'ch10-s02', title: 'Constructable Stylesheets 與 adoptedStyleSheets' },
    { slug: 'ch10-s03', title: '主題化策略：Host、Part 與 Token 三種方式的比較' },
    { slug: 'ch10-s04', title: '在 Shadow DOM 內實作深色模式（Dark Mode）' },
    { slug: 'ch10-s05', title: 'CSS @layer 與封裝樣式的交互影響' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 10 · 第二部：TypeScript 優先的 Web Components 開發</div>
  <h1>Web Components 的樣式架構設計</h1>
  <p>Shadow DOM 的樣式封裝是一把雙刃劍：它保護元件的內部樣式，卻也阻礙了外部的客製化。本章探討如何透過 CSS Custom Properties、Constructable Stylesheets 和 CSS Part 等機制，設計出既封裝又可主題化的樣式 API。</p>
  <div class="chapter-tags">
    <span class="tag tag-advanced">進階</span>
  </div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch10-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">Design Token 透過 CSS Custom Properties 對外開放樣式 API</span>
    </a>
    <a class="catalog-item" href="#ch10-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">Constructable Stylesheets 與 adoptedStyleSheets</span>
    </a>
    <a class="catalog-item" href="#ch10-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">主題化策略：Host、Part 與 Token 三種方式的比較</span>
    </a>
    <a class="catalog-item" href="#ch10-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">在 Shadow DOM 內實作深色模式（Dark Mode）</span>
    </a>
    <a class="catalog-item" href="#ch10-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">CSS @layer 與封裝樣式的交互影響</span>
    </a>
  </div>
</div>

<h2 id="ch10-s01">Design Token 透過 CSS Custom Properties 對外開放樣式 API</h2>

<p>CSS Custom Properties（CSS 變數）是唯一能從外部穿越 Shadow Boundary 的樣式機制。它們不受 Shadow DOM 的封裝影響，會從文件的根部一路繼承到 Shadow Root 內部。這使得它們成為設計 Token 系統、暴露樣式 API 的完美工具。</p>

<h3>三層 Token 架構</h3>

<p>成熟的 Design System 通常將 Token 分為三層：<strong>原始值 Token</strong>（Primitive）→ <strong>語義 Token</strong>（Semantic）→ <strong>元件 Token</strong>（Component）。元件只消費自己層級的 Token，並在 <code>var()</code> 第二參數提供合理備用值，確保沒有 Token 注入時也能正確顯示。</p>

<book-code-block language="typescript" label="Design Token 系統：元件消費端實作">
class AppButton extends HTMLElement {
  private static STYLES = [
    ':host { display: inline-flex; }',
    'button {',
    '  background: var(--button-bg, var(--color-brand, #3b82f6));',
    '  color: var(--button-color, #fff);',
    '  padding: var(--button-padding-y, 8px) var(--button-padding-x, 16px);',
    '  border-radius: var(--button-radius, var(--radius-md, 6px));',
    '  font-size: var(--button-font-size, 1rem);',
    '  border: var(--button-border, none);',
    '  cursor: pointer; font-weight: 600;',
    '  transition: background 0.15s, transform 0.1s;',
    '}',
    'button:hover:not(:disabled) {',
    '  background: var(--button-bg-hover, var(--color-brand-dark, #2563eb));',
    '}',
    'button:active:not(:disabled) { transform: scale(0.97); }',
    ':host([disabled]) button {',
    '  background: var(--button-bg-disabled, #e5e7eb);',
    '  color: var(--button-color-disabled, #9ca3af);',
    '  cursor: not-allowed;',
    '}',
    ':host([variant="outline"]) button {',
    '  background: transparent;',
    '  border: 2px solid var(--button-bg, #3b82f6);',
    '  color: var(--button-bg, #3b82f6);',
    '}',
  ].join('\n')

  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = AppButton.STYLES
    const btn = document.createElement('button')
    btn.setAttribute('part', 'button')
    btn.appendChild(document.createElement('slot'))
    shadow.appendChild(style)
    shadow.appendChild(btn)
  }
}
customElements.define('app-button', AppButton)
</book-code-block>

<book-code-block language="css" label="外部 Token 定義與情境覆蓋">
/* :root 定義全域基礎 Token */
:root {
  --color-brand: #3b82f6;
  --color-brand-dark: #2563eb;
  --radius-md: 6px;
}

/* 針對特定元件設定元件層 Token — 品牌化 */
app-button {
  --button-radius: 999px;
  --button-padding-x: 24px;
}

/* 情境覆蓋：sidebar 裡的按鈕使用不同顏色 */
.sidebar app-button {
  --button-bg: #7c3aed;
  --button-bg-hover: #6d28d9;
}

/* 深色主題覆蓋 */
[data-theme="dark"] app-button {
  --button-bg: #818cf8;
  --button-color: #1e1b4b;
}
</book-code-block>

<book-callout variant="tip" title="Token 命名慣例">
  <p>元件層 Token 建議使用 <code>--[component]-[property]-[state]</code> 的命名格式，例如 <code>--button-bg-hover</code>、<code>--card-border-focus</code>。這讓 Token 的用途一目了然，也方便透過 Custom Elements Manifest 自動生成樣式 API 文件。</p>
</book-callout>

<h2 id="ch10-s02">Constructable Stylesheets 與 adoptedStyleSheets</h2>

<p>傳統的 Shadow DOM 樣式做法是在每個元件實例的 Shadow Root 內插入 <code>&lt;style&gt;</code> 標籤。當頁面有 100 個相同元件的實例時，就有 100 份獨立的 CSSOM 物件，造成不必要的記憶體開銷。Constructable Stylesheets 允許建立單一 stylesheet 物件，並在所有 Shadow Root 之間共享。</p>

<book-code-block language="typescript" label="Constructable Stylesheets：共享樣式的高效做法">
// 建立一個模組層級的共享 stylesheet，只建立一次
const cardBaseSheet = new CSSStyleSheet()
cardBaseSheet.replaceSync(\`
  :host { display: block; box-sizing: border-box; }
  .card {
    background: var(--card-bg, #fff);
    border: 1px solid var(--card-border, #e5e7eb);
    border-radius: var(--card-radius, 8px);
    padding: var(--card-padding, 16px);
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .card-title { font-size: 1.125rem; font-weight: 600; margin: 0 0 8px; }
\`)

// 主題切換用的動態 stylesheet
const themeSheet = new CSSStyleSheet()

async function setDarkTheme(dark: boolean) {
  // replace() 更新後，所有 adopt 此 sheet 的 Shadow Root 立即生效
  await themeSheet.replace(dark
    ? ':host { --card-bg: #1f2937; --card-border: #374151; color: #f9fafb; }'
    : ':host { --card-bg: #ffffff; --card-border: #e5e7eb; color: #111827; }'
  )
}

class AppCard extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })

    // adoptedStyleSheets 接受 CSSStyleSheet 陣列
    // 所有 AppCard 實例共享同一個 CSSOM 物件，大幅節省記憶體
    shadow.adoptedStyleSheets = [cardBaseSheet, themeSheet]

    shadow.innerHTML = \`
      &lt;div class="card"&gt;
        &lt;div class="card-title"&gt;&lt;slot name="title"&gt;&lt;/slot&gt;&lt;/div&gt;
        &lt;slot&gt;&lt;/slot&gt;
      &lt;/div&gt;
    \`
  }
}
customElements.define('app-card', AppCard)

// 當使用者切換主題時，所有 AppCard 實例同時更新，無需重新建立 style 標籤
document.querySelector('#theme-toggle')?.addEventListener('click', () => {
  setDarkTheme(document.documentElement.dataset.theme !== 'dark')
})
</book-code-block>

<book-callout variant="warning" title="adoptedStyleSheets 的陣列操作">
  <p><code>adoptedStyleSheets</code> 必須以陣列整體賦值，不能直接呼叫 <code>push()</code>。若要新增一個 sheet，應寫成 <code>shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, newSheet]</code>。在舊版瀏覽器 polyfill 中，這個屬性是 frozen array，需要額外處理。</p>
</book-callout>

<h2 id="ch10-s03">主題化策略：Host、Part 與 Token 三種方式的比較</h2>

<p>讓元件支援外部主題化有三種主要策略，各有其能力邊界與適用情境：</p>

<table>
  <thead>
    <tr>
      <th>策略</th>
      <th>選擇器範例</th>
      <th>能修改的範圍</th>
      <th>粒度</th>
      <th>適用情境</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>:host 樣式</strong></td>
      <td><code>app-btn { display: block }</code></td>
      <td>Shadow Host 本身</td>
      <td>低（僅外殼）</td>
      <td>佈局、display、margin</td>
    </tr>
    <tr>
      <td><strong>::part()</strong></td>
      <td><code>app-btn::part(btn) { ... }</code></td>
      <td>有 part 標記的內部元素</td>
      <td>高（任意 CSS）</td>
      <td>深度客製化的元件庫</td>
    </tr>
    <tr>
      <td><strong>CSS Token</strong></td>
      <td><code>app-btn { --btn-bg: red }</code></td>
      <td>元件預先設計的可變屬性</td>
      <td>中（僅暴露的變數）</td>
      <td>主題切換、品牌化</td>
    </tr>
  </tbody>
</table>

<book-code-block language="typescript" label="::part() 深度主題化範例">
class AppDialog extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })
    // 在需要外部客製化的元素上標記 part 屬性
    shadow.innerHTML = \`
      &lt;style&gt;
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: grid; place-items: center; }
        .dialog { background: white; border-radius: 8px; padding: 24px; min-width: 320px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
        .close { background: none; border: none; font-size: 1.25rem; cursor: pointer; }
      &lt;/style&gt;
      &lt;div class="overlay" part="overlay"&gt;
        &lt;div class="dialog" part="dialog"&gt;
          &lt;div class="header" part="header"&gt;
            &lt;slot name="title"&gt;&lt;/slot&gt;
            &lt;button class="close" part="close-button"&gt;&amp;times;&lt;/button&gt;
          &lt;/div&gt;
          &lt;div class="body" part="body"&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/div&gt;
          &lt;div class="footer" part="footer"&gt;&lt;slot name="actions"&gt;&lt;/slot&gt;&lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    \`
  }
}
customElements.define('app-dialog', AppDialog)

/*
  外部可以透過 ::part() 修改任何已標記的元素：

  app-dialog::part(dialog) {
    border-radius: 0;
    border-left: 4px solid #7c3aed;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  }
  app-dialog::part(close-button) {
    background: #fee2e2;
    color: #ef4444;
    border-radius: 50%;
    padding: 4px 8px;
  }

  注意限制：::part() 無法使用嵌套選擇器，
  例如 app-dialog::part(dialog) .title 是無效的。
*/
</book-code-block>

<h2 id="ch10-s04">在 Shadow DOM 內實作深色模式（Dark Mode）</h2>

<p>Shadow DOM 內的深色模式最健壯的做法是同時支援 <code>prefers-color-scheme</code> 媒體查詢（系統自動）和 <code>:host([dark])</code> attribute（使用者手動切換），並用 CSS Token 作為橋接層。</p>

<book-code-block language="typescript" label="Shadow DOM 深色模式完整實作">
class ThemedCard extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })
    const style = document.createElement('style')

    // 使用 CSS Token 作為橋接層，讓深色模式只需修改 Token 值
    style.textContent = [
      ':host {',
      '  --surface: #ffffff;',
      '  --text-primary: #111827;',
      '  --text-muted: #6b7280;',
      '  --border: #e5e7eb;',
      '}',
      // 方法 1：回應系統偏好（自動）
      '@media (prefers-color-scheme: dark) {',
      '  :host { --surface: #1f2937; --text-primary: #f9fafb; --text-muted: #9ca3af; --border: #374151; }',
      '}',
      // 方法 2：回應手動切換（透過 attribute）
      ':host([dark]) {',
      '  --surface: #1f2937;',
      '  --text-primary: #f9fafb;',
      '  --text-muted: #9ca3af;',
      '  --border: #374151;',
      '}',
      '.card { background: var(--surface); color: var(--text-primary);',
      '  border: 1px solid var(--border); border-radius: 8px; padding: 16px; }',
      '.subtitle { color: var(--text-muted); font-size: 0.875rem; margin: 4px 0 0; }',
    ].join('\n')

    shadow.appendChild(style)
    shadow.innerHTML += \`
      &lt;div class="card"&gt;
        &lt;slot name="title"&gt;&lt;/slot&gt;
        &lt;p class="subtitle"&gt;&lt;slot name="subtitle"&gt;&lt;/slot&gt;&lt;/p&gt;
        &lt;slot&gt;&lt;/slot&gt;
      &lt;/div&gt;
    \`
  }
}
customElements.define('themed-card', ThemedCard)

// 全局主題管理器：在 document 和所有元件上同步切換
class ThemeManager {
  private static _dark = window.matchMedia('(prefers-color-scheme: dark)').matches

  static get isDark() { return this._dark }

  static setDark(dark: boolean) {
    this._dark = dark
    document.documentElement.toggleAttribute('data-dark', dark)
    // 廣播給所有元件
    document.querySelectorAll('themed-card').forEach(el => {
      el.toggleAttribute('dark', dark)
    })
    document.dispatchEvent(
      new CustomEvent('theme-change', { detail: { dark } })
    )
  }

  static toggle() { this.setDark(!this._dark) }
}
</book-code-block>

<book-callout variant="tip" title="為什麼不用 :host-context()">
  <p><code>:host-context()</code> 原本可讓 Shadow Root 感知祖先的狀態（如 <code>:host-context([data-theme="dark"])</code>），但 Firefox 長期缺乏支援，且規格尚在變動中。目前最可靠的做法是：在祖先設定 CSS Custom Properties，再透過 CSS 繼承傳入 Shadow Root；或在 JavaScript 層直接更新元件的 attribute。</p>
</book-callout>

<h2 id="ch10-s05">CSS @layer 與封裝樣式的交互影響</h2>

<p>CSS <code>@layer</code> 允許開發者明確控制樣式的層疊優先順序。理解它與 Shadow DOM 的互動關係，對設計可靠的元件樣式架構至關重要。</p>

<h3>關鍵原則：Shadow Root 有獨立的層疊上下文</h3>

<p>Shadow Root 內部的 <code>@layer</code> 定義是完全獨立的——它不會影響外部文件的 layer 排序，外部文件的 layer 也無法影響 Shadow Root 內部的樣式。唯一的例外是 CSS Custom Properties（繼承穿透）和 <code>::part()</code> 選擇器（外部可直接修改標記的元素）。</p>

<book-code-block language="typescript" label="@layer 在 Shadow DOM 中的使用模式">
class LayeredButton extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })
    const style = document.createElement('style')

    // Shadow Root 內建立獨立的 layer 順序
    // base < theme < states（後宣告的 layer 優先級更高）
    style.textContent = [
      '@layer base, theme, states;',
      '@layer base {',
      '  button { padding: 8px 16px; border: none; cursor: pointer; font-size: 1rem; font-family: inherit; }',
      '}',
      '@layer theme {',
      '  button { background: var(--button-bg, #3b82f6); color: var(--button-color, white); border-radius: var(--button-radius, 6px); }',
      '}',
      '@layer states {',
      '  button:disabled { opacity: 0.5; cursor: not-allowed; }',
      '  button:focus-visible { outline: 2px solid var(--focus-ring, #3b82f6); outline-offset: 2px; }',
      '  button:hover:not(:disabled) { filter: brightness(1.1); }',
      '}',
      // 未放入 layer 的規則優先級高於所有 layer，可用於緊急覆蓋
      '.urgent { background: #ef4444; }',
    ].join('\n')

    const btn = document.createElement('button')
    btn.setAttribute('part', 'button')
    btn.appendChild(document.createElement('slot'))
    shadow.appendChild(style)
    shadow.appendChild(btn)
  }
}
customElements.define('layered-button', LayeredButton)
</book-code-block>

<book-code-block language="css" label="外部 @layer 與 Shadow DOM 互動規則">
/* 外部文件的 @layer 設定 */
@layer reset, base, components, utilities;

@layer components {
  /* 只能影響 Shadow Host 本身，無法穿透 Shadow Boundary */
  layered-button {
    display: inline-flex;
    /* CSS Custom Properties 依然可以穿透傳入 Shadow Root */
    --button-bg: #7c3aed;
    --button-radius: 999px;
  }
}

@layer utilities {
  /* ::part() 在外部 @layer 中同樣有效，可以穿透 Shadow Boundary */
  layered-button::part(button) {
    font-weight: 700;
    letter-spacing: 0.025em;
    text-transform: uppercase;
  }
}

/*
  總結 @layer 與 Shadow DOM 的互動規則：
  1. Shadow Root 內部的 @layer 是獨立的層疊上下文
  2. 外部 @layer 無法影響 Shadow Root 內部樣式
  3. CSS Custom Properties 不受 @layer 限制，可自由繼承穿透
  4. ::part() 選擇器可在外部 @layer 中穿透 Shadow Boundary
  5. 未放入 layer 的規則優先級高於所有 layer 中的規則
*/
</book-code-block>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>CSS Custom Properties 是 Shadow DOM 的樣式 API 入口，Constructable Stylesheets 解決多實例的效能問題，而 ::part() 則是深度主題化的逃生艙——三者組合使用，才能建構出既封裝又靈活的 Web Component 樣式架構。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch09">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">Events、組合模式與元件契約設計</span>
    </a>
    <a class="footer-link" href="#ch11">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">用一章理解 Lit — 核心思維模型</span>
    </a>
  </div>
</div>
`
