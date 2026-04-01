export const metadata = {
  id: 32,
  part: 7,
  title: '面試完全攻略',
  tags: ['面試重點', '實用技巧'] as string[],
  sections: [
    { slug: 'ch32-s01', title: '50 道精選面試題與模範解答，依難易度分組' },
    { slug: 'ch32-s02', title: '現場 Coding 挑戰：「25 分鐘內實作一個自訂 Modal」' },
    { slug: 'ch32-s03', title: '系統設計題：為五個產品團隊設計共用 Component Library' },
    { slug: 'ch32-s04', title: '觀念陷阱：Lifecycle 順序、Event Retargeting、FACE API' },
    { slug: 'ch32-s05', title: '如何跟只懂 React 的面試官談論 Web Components' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 32 · 第七部：真實世界專案與面試完全攻略</div>
  <h1>面試完全攻略</h1>
  <p>本章是全書的最後壓軸，也是最實用的一章。我們將 Web Components 的所有知識凝縮為面試場景中可以直接使用的答案框架：從入門到資深的 50 道精選題目、25 分鐘 Coding 挑戰的完整解法、系統設計題的架構思路，以及如何用 React 工程師熟悉的語言解釋 Web Components 的價值。</p>
  <div class="chapter-tags"><span class="tag tag-interview">面試重點</span><span class="tag tag-practical">實用技巧</span></div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch32-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">50 道精選面試題與模範解答，依難易度分組</span>
    </a>
    <a class="catalog-item" href="#ch32-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">現場 Coding 挑戰：「25 分鐘內實作一個自訂 Modal」</span>
    </a>
    <a class="catalog-item" href="#ch32-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">系統設計題：為五個產品團隊設計共用 Component Library</span>
    </a>
    <a class="catalog-item" href="#ch32-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">觀念陷阱：Lifecycle 順序、Event Retargeting、FACE API</span>
    </a>
    <a class="catalog-item" href="#ch32-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">如何跟只懂 React 的面試官談論 Web Components</span>
    </a>
  </div>
</div>

<h2 id="ch32-s01">50 道精選面試題與模範解答，依難易度分組</h2>

<p>以下面試題依難易度分為四組，每題附有模範解答要點。</p>

<h3>入門級（適合 0-1 年經驗）</h3>

<ol>
  <li>
    <strong>Q：Web Components 由哪四大技術規格組成？</strong><br>
    A：Custom Elements（自訂元素）、Shadow DOM（陰影 DOM）、HTML Templates（&lt;template&gt;/&lt;slot&gt;）、ES Modules。Declarative Shadow DOM（DSD）是近年新增的第五個重要規格，用於 SSR。
  </li>
  <li>
    <strong>Q：Custom Element 的 constructor 有哪些限制？</strong><br>
    A：必須先呼叫 super()；不能讀取 attribute（此時尚未掛載）；不能操作 Light DOM 子節點；attachShadow() 只能呼叫一次；不能 return 非元素物件。
  </li>
  <li>
    <strong>Q：observedAttributes 的作用是什麼？</strong><br>
    A：靜態宣告哪些 attribute 的變化需要觸發 attributeChangedCallback。若不宣告，即使屬性改變，回調也不會觸發。
  </li>
  <li>
    <strong>Q：什麼是 Element Upgrade？</strong><br>
    A：當 HTML 解析器遇到自訂元素標籤時，若對應的 customElements.define() 尚未執行，元素暫時以 HTMLElement 存在（未升級狀態）。當 define() 執行後，瀏覽器將所有現存的對應元素升級為對應的 class，觸發 constructor 和 connectedCallback。
  </li>
  <li>
    <strong>Q：Shadow DOM 的 open 與 closed 模式有何差別？</strong><br>
    A：open 模式下，外部可以透過 element.shadowRoot 取得 Shadow Root；closed 模式下返回 null。closed 模式提供額外的封裝性，但也造成測試困難，且實際上並非安全邊界（開發者工具仍可存取）。
  </li>
  <li>
    <strong>Q：如何讓自訂元素在 CSS 中表現為 block 元素？</strong><br>
    A：在 Shadow DOM 的樣式中加入 <code>:host { display: block; }</code>。自訂元素預設是 inline 元素。
  </li>
  <li>
    <strong>Q：&lt;slot&gt; 與 &lt;template&gt; 的差別是什麼？</strong><br>
    A：&lt;template&gt; 是靜態的 HTML 片段，瀏覽器解析但不渲染，可被 JS 複製使用；&lt;slot&gt; 是 Shadow DOM 中的插槽，讓 Light DOM 的子節點投影（project）到 Shadow DOM 的指定位置顯示。
  </li>
  <li>
    <strong>Q：customElements.whenDefined() 的用途是什麼？</strong><br>
    A：返回一個 Promise，在指定的自訂元素被定義（customElements.define() 被呼叫）後 resolve。常用於防止 FOUCE（Flash of Unupgraded Custom Elements）。
  </li>
</ol>

<h3>中級（適合 1-3 年經驗）</h3>

<ol start="9">
  <li>
    <strong>Q：說明 attribute 與 property 的差別，以及如何在兩者間保持同步。</strong><br>
    A：Attribute 是 HTML 標籤上的字串（<code>getAttribute</code>/<code>setAttribute</code>），property 是 JavaScript 物件屬性（<code>element.value</code>）。同步方式：在 property setter 中呼叫 setAttribute 更新 attribute，在 attributeChangedCallback 中更新對應 property；使用 reflect: true（Lit）讓 property 自動反映到 attribute。
  </li>
  <li>
    <strong>Q：什麼是事件重新定向（Event Retargeting）？如何取得 Shadow DOM 內真正的事件目標？</strong><br>
    A：當事件從 Shadow DOM 內部冒泡到外部時，event.target 會被重新設為宿主元素，以保護封裝性。使用 event.composedPath() 可以取得完整的事件傳播路徑，composedPath()[0] 是實際的事件源頭。
  </li>
  <li>
    <strong>Q：Constructable Stylesheets 解決了什麼問題？</strong><br>
    A：當頁面有大量相同元件實例時，傳統的 &lt;style&gt; 標籤在每個 Shadow Root 中各自佔用記憶體並重複解析。Constructable Stylesheets 允許多個 Shadow Root 透過 adoptedStyleSheets 共享同一個已解析的 CSSStyleSheet 物件，大幅降低記憶體用量與樣式計算成本。
  </li>
  <li>
    <strong>Q：解釋 Lit 的 reactive update cycle（響應式更新週期）。</strong><br>
    A：當 reactive property 改變 → requestUpdate() 被呼叫 → 進入微任務佇列（microtask queue），批次處理 → shouldUpdate() 決定是否更新 → performUpdate() 觸發 → update() 呼叫 render() 並 patch DOM → updated() 生命週期執行。這個批次機制避免了同一 tick 內多次 property 變更造成的多次渲染。
  </li>
  <li>
    <strong>Q：CSS ::part() 偽元素如何使用？有哪些限制？</strong><br>
    A：在元件內部，用 part="name" 標記可樣式化的元素；在外部，用 <code>element-name::part(name) { ... }</code> 樣式化它。限制：只能穿透一層 Shadow DOM（不能跨越巢狀 Shadow DOM）；不能用於偽類組合如 ::part(btn):hover（需改為 ::part(btn hover) 的多名稱寫法）。
  </li>
  <li>
    <strong>Q：什麼是 Declarative Shadow DOM（DSD）？它解決了什麼問題？</strong><br>
    A：DSD 允許在 HTML 中直接宣告 Shadow Root，無需 JavaScript：<code>&lt;template shadowrootmode="open"&gt;</code>。它解決了 Web Components 在 SSR 場景下的問題：傳統 Shadow DOM 需要 JS 執行才能建立，DSD 讓伺服器端渲染的 Shadow DOM 直接嵌在 HTML 中，在 JS 載入前即可呈現正確的樣式。
  </li>
  <li>
    <strong>Q：如何在 Lit 中實作 conditional rendering（條件渲染）？</strong><br>
    A：使用三元運算子（<code>condition ? html\`...\` : html\`...\`</code>）或短路求值（<code>condition &amp;&amp; html\`...\`</code>）。若要完全移除 DOM 節點（而非隱藏），使用 <code>nothing</code>（<code>import { nothing } from 'lit'</code>）替代 null/undefined/false，確保對應的 DOM 節點被移除而非保留空白文字節點。
  </li>
  <li>
    <strong>Q：解釋 FACE API（Form-Associated Custom Elements）的核心概念。</strong><br>
    A：FACE API 讓自訂元素可以參與原生 &lt;form&gt; 的 submit、reset、validity 等行為。需要：<code>static formAssociated = true</code>；在 constructor 中呼叫 <code>this.attachInternals()</code>；使用 internals.setFormValue() 設定值；使用 internals.setValidity() 設定驗證狀態。
  </li>
</ol>

<h3>進階（適合 3-5 年經驗）</h3>

<ol start="17">
  <li>
    <strong>Q：比較 Web Components 在 React、Vue 3、Angular 中的整合摩擦點。</strong><br>
    A：React（18 以前）：不能直接傳遞非字串 property、自訂事件需手動 addEventListener，解決方案是 @lit/react 的 createComponent wrapper。Vue 3：需設定 compilerOptions.isCustomElement，其餘幾乎無摩擦。Angular：需在 @NgModule 加入 CUSTOM_ELEMENTS_SCHEMA，否則編譯器會報錯。React 19 大幅改善了對 Custom Elements 的支援，自訂事件可直接綁定。
  </li>
  <li>
    <strong>Q：描述 Web Components 效能優化的主要策略。</strong><br>
    A：(1) Lazy Upgrade：用 IntersectionObserver 在元件進入視窗前才動態 import；(2) Constructable Stylesheets：共享已解析的 CSSStyleSheet；(3) content-visibility: auto：讓瀏覽器跳過視窗外元素的渲染；(4) 避免 Layout Thrash：批次讀取再批次寫入 DOM；(5) 在大量實例場景跳過 Shadow DOM 改用 Light DOM；(6) 用 PerformanceObserver 量測 Core Web Vitals 並找出瓶頸。
  </li>
  <li>
    <strong>Q：如何實作 Web Components 的 SSR（Server-Side Rendering）？</strong><br>
    A：使用 @lit-labs/ssr 在 Node.js 環境中渲染 Lit 元件為 Declarative Shadow DOM HTML 字串。搭配 @lit-labs/ssr-client 在瀏覽器端 hydrate。關鍵是理解 DSD 的 shadowrootmode="open" 讓瀏覽器在 JS 未載入前就能解析 Shadow Root；hydration 時 Lit 會識別已存在的 Shadow Root 而不重建。
  </li>
  <li>
    <strong>Q：解釋 Custom Elements Manifest 在 Design System 工具鏈中的角色。</strong><br>
    A：CEM（custom-elements.json）是描述 Web Components 公開 API 的 JSON 格式規格，類似於 OpenAPI 之於 REST API。它驅動：VS Code 的 HTML 智能補全、Storybook 的 Controls 自動產生、Chromatic 的元件識別、Angular/Vue 型別定義自動生成、API 文件站的靜態生成。
  </li>
  <li>
    <strong>Q：什麼是 Context Protocol（@lit/context）？解決了什麼問題？</strong><br>
    A：Context Protocol 解決的是跨越 Shadow DOM 邊界的「props drilling」問題。Provider 元件透過 ContextProvider 提供值，任意深度的後代元件透過 ContextConsumer 訂閱，無需透過 attribute/property 逐層傳遞。它基於 DOM 事件（context-request 事件）實作，不依賴框架的 context API，可跨越任意 Shadow DOM 邊界。
  </li>
  <li>
    <strong>Q：如何處理 Web Components 的記憶體洩漏？</strong><br>
    A：(1) 使用 AbortController 管理外部事件監聽器，在 disconnectedCallback 中一次性清理；(2) 清除所有定時器（setTimeout/setInterval/requestAnimationFrame）；(3) 斷開 IntersectionObserver、ResizeObserver、MutationObserver；(4) 使用 WeakRef 持有外部物件引用；(5) 在 DevTools Memory 面板用 Heap Snapshot 比較法偵測洩漏。
  </li>
  <li>
    <strong>Q：解釋 Lit 的 Directive 機制。什麼時候應該自訂 Directive？</strong><br>
    A：Directive 是 Lit 模板系統的擴充機制，允許自訂 template expression 的行為。Lit 內建 repeat、classMap、styleMap、ifDefined、cache、guard 等。當你需要直接操作底層 DOM Part（文字節點、屬性節點、元素節點）、跨次 render 保留狀態、或在 Lit 模板語法無法表達的特殊渲染邏輯時，應建立自訂 Directive（繼承 Directive 或 AsyncDirective）。
  </li>
</ol>

<h3>資深（適合 5 年以上 / Tech Lead）</h3>

<ol start="23">
  <li>
    <strong>Q：設計一個 Web Components Design System 的技術架構，說明技術決策與取捨。</strong><br>
    A：分層架構（Tokens → Atoms → Molecules → Organisms）；以 Lit 為基礎框架（降低 boilerplate、保留 Web Platform 語意）；CSS Custom Properties 作為主題化 API（穿透 Shadow DOM、向下相容）；::part() 作為進階樣式接口；monorepo（Turborepo/Nx）管理套件；Custom Elements Manifest 驅動工具鏈；Changesets 管理版本；Storybook + Chromatic 作為文件與視覺測試平台。
  </li>
  <li>
    <strong>Q：如何在微前端架構中使用 Web Components？有哪些技術方案？</strong><br>
    A：(1) 每個微應用暴露 Web Components 介面，Shell 應用動態載入；(2) Module Federation（Webpack/Vite）讓微應用共享依賴（避免 Lit 被多次載入）；(3) 微應用間通訊使用 CustomEvent（on window）+ 定義共用的事件協議；(4) 版本協調問題：使用 importmap 鎖定共用依賴版本；(5) Shared Context 問題：透過 window-level 的 Context API（如 Redux、XState）跨越框架邊界共享狀態。
  </li>
  <li>
    <strong>Q：描述 Web Components 的安全考量。</strong><br>
    A：(1) 永不使用 innerHTML 注入使用者輸入（XSS）；Lit 模板 html\`\` 自動轉義插值；(2) closed Shadow DOM 不是真正的安全機制，DevTools 仍可存取；(3) 避免在 attribute 上暴露敏感資料（HTML 原始碼可被讀取）；(4) 事件的 composed: true 讓事件穿越 Shadow DOM 邊界，確保敏感資訊不在 event.detail 中洩漏；(5) Content Security Policy (CSP) 的設定與 Constructable Stylesheets 的相容性問題。
  </li>
  <li>
    <strong>Q：如何向一個全棧工程師解釋 Web Components 與 React Server Components 的互補關係？</strong><br>
    A：RSC 在伺服器執行，產生序列化的 React 樹，不帶 JS bundle；Web Components 是客戶端的 Custom Element 定義，帶互動行為。兩者可以互補：用 RSC 渲染頁面骨架和靜態內容，用 Web Components 提供跨框架的互動 UI 元件。在 Next.js 中，可以在 RSC 的輸出 HTML 中使用 Web Components 標籤，同時在 client bundle 中載入元件定義。DSD 讓 Web Components 的初始 HTML 可以在 RSC 渲染期間嵌入。
  </li>
  <li>
    <strong>Q：比較 Shadow DOM v1 Slot 投影機制與 React 的 children/render props 模式。</strong><br>
    A：兩者都解決「讓父元件決定子元件的部分結構」的問題，但機制根本不同。Shadow DOM Slots：在 DOM 層面工作，Light DOM 節點物理上仍是宿主元素的子節點，只是被「投影」顯示在 Slot 位置；支援 named slot 對應具名插槽；CSS :slotted() 可以樣式化投影內容。React children：在 JS 虛擬 DOM 層面工作，children 作為 props 傳遞；render props 更靈活，可以傳遞函式。Shadow DOM Slots 的優勢是 Light DOM 保持可被 SEO 爬蟲讀取，且不需要 JS 即可結構化。
  </li>
  <li>
    <strong>Q：如何設計 Web Components 的向後相容性策略？</strong><br>
    A：HTML API 的 Breaking Change 需要 Major 版本；使用 @deprecated JSDoc 標記廢棄 API 並提供遷移橋接（舊 attribute 透明地轉發到新 attribute）；提供 codemod 工具幫助消費者自動遷移；在 CHANGELOG 中明確列出所有 HTML API 破壞性變更（不僅是 JS API）；使用 Changesets 確保版本號正確反映破壞性程度；維護 LTS（長期支援）版本（至少 12 個月）；提供遷移指南。
  </li>
</ol>

<h2 id="ch32-s02">現場 Coding 挑戰：「25 分鐘內實作一個自訂 Modal」</h2>

<p>這是最常見的 Web Components 現場 Coding 題型。面試官期望看到：正確的 Shadow DOM 使用、鍵盤操控（Esc 關閉、焦點鎖定）、ARIA 屬性、動畫效果，以及 event API 設計。</p>

<p><strong>解題思路（2 分鐘規劃）：</strong></p>
<ol>
  <li>確認 API 設計：<code>open</code> attribute、<code>headline</code> attribute、Slots（default 和 footer-actions）、<code>acme-show</code> / <code>acme-hide</code> 事件。</li>
  <li>確認 ARIA：role="dialog"、aria-modal="true"、aria-labelledby、焦點管理。</li>
  <li>確認 UX：Esc 關閉、Backdrop 點擊關閉、焦點鎖定（focustrap）。</li>
</ol>

<book-code-block language="typescript" label="TypeScript — 完整 Modal 實作（約 40 行核心邏輯）">
import { LitElement, html, css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

@customElement('acme-modal')
export class AcmeModal extends LitElement {
  @property({ type: Boolean, reflect: true }) open = false;
  @property() headline = '';

  @query('.dialog')   private dialog!: HTMLElement;
  @query('.backdrop') private backdrop!: HTMLElement;

  static styles = css\`
    :host { display: contents; }

    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }

    :host([open]) .backdrop {
      opacity: 1;
      pointer-events: auto;
    }

    .dialog {
      background: white;
      border-radius: 12px;
      width: 100%;
      max-width: 560px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, .3);
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 32px);
      transform: scale(0.95) translateY(8px);
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      overflow: hidden;
    }

    :host([open]) .dialog {
      transform: scale(1) translateY(0);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
    }

    .headline {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #64748b;
      font-size: 22px;
      padding: 4px 8px;
      border-radius: 4px;
      line-height: 1;
      transition: background 0.15s;
    }

    .close-btn:hover { background: #f1f5f9; }

    .body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
      color: #374151;
      font-size: 15px;
      line-height: 1.6;
    }

    .footer {
      padding: 16px 24px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .footer:empty { display: none; }
  \`;

  show() {
    this.open = true;
    this.dispatchEvent(new CustomEvent('acme-show', { bubbles: true, composed: true }));
    // 等 DOM 更新後設定焦點
    this.updateComplete.then(() =&gt; {
      this.dialog?.focus();
      this.trapFocus();
    });
  }

  hide() {
    this.open = false;
    this.dispatchEvent(new CustomEvent('acme-hide', { bubbles: true, composed: true }));
  }

  private trapFocus() {
    if (!this.open) return;
    const focusable = this.shadowRoot!.querySelectorAll&lt;HTMLElement&gt;(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (first) first.focus();

    this.dialog.addEventListener('keydown', (e: KeyboardEvent) =&gt; {
      if (!this.open) return;
      if (e.key === 'Escape') { e.preventDefault(); this.hide(); return; }
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }, { once: false });
  }

  private handleBackdropClick(e: MouseEvent) {
    if (e.target === this.backdrop) this.hide();
  }

  render() {
    return html\`
      &lt;div
        class="backdrop"
        @click=\${this.handleBackdropClick}
        aria-hidden=\${!this.open}
      &gt;
        &lt;div
          class="dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-headline"
          tabindex="-1"
        &gt;
          &lt;div class="header"&gt;
            &lt;h2 class="headline" id="dialog-headline"&gt;\${this.headline}&lt;/h2&gt;
            &lt;button class="close-btn" @click=\${this.hide} aria-label="關閉對話框"&gt;×&lt;/button&gt;
          &lt;/div&gt;
          &lt;div class="body"&gt;
            &lt;slot&gt;&lt;/slot&gt;
          &lt;/div&gt;
          &lt;div class="footer"&gt;
            &lt;slot name="footer-actions"&gt;&lt;/slot&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    \`;
  }
}

// ===== 使用範例 =====
// &lt;acme-modal id="confirm-modal" headline="確認刪除"&gt;
//   &lt;p&gt;此操作無法復原。確定要刪除嗎？&lt;/p&gt;
//   &lt;button slot="footer-actions" @click="modal.hide()"&gt;取消&lt;/button&gt;
//   &lt;button slot="footer-actions" variant="danger" @click="handleDelete()"&gt;刪除&lt;/button&gt;
// &lt;/acme-modal&gt;
</book-code-block>

<book-callout variant="tip" title="面試現場的加分技巧">
  <p>完成基本功能後，主動向面試官提出可以繼續優化的方向：(1) 使用原生 &lt;dialog&gt; 元素作為底層（內建 showModal() 和 close() API、內建 backdrop 偽元素、內建焦點鎖定）；(2) 加入 scrollLock（開啟時禁止 body 滾動）；(3) 支援多個 Modal 堆疊的 z-index 管理；(4) WCAG 2.1 Level AA 的 focus-visible 樣式。</p>
</book-callout>

<h2 id="ch32-s03">系統設計題：為五個產品團隊設計共用 Component Library</h2>

<p>系統設計題考察的是你在技術廣度與工程判斷上的成熟度。以下是一個完整的回答框架。</p>

<book-code-block language="text" label="ASCII 架構圖 — 共用 Component Library 的完整架構">
┌──────────────────────────────────────────────────────────────────┐
│                    Monorepo（Turborepo）                           │
│                                                                    │
│  packages/                                                         │
│  ├── tokens/          CSS Custom Properties（零 JS 依賴）          │
│  ├── icons/           SVG 圖示系統（Lit element + 精靈圖）         │
│  ├── atoms/           Button, Input, Badge, Avatar, Tag...         │
│  ├── molecules/       Card, FormField, SearchBar, Tooltip...       │
│  ├── organisms/       Header, DataTable, Modal, Pagination...      │
│  └── react-wrappers/  @lit/react createComponent 薄層 wrapper      │
│                                                                    │
│  apps/                                                             │
│  ├── storybook/       文件站（Storybook 8 + Chromatic）            │
│  ├── docs/            API 文件（TypeDoc + CEM viewer）             │
│  └── playground/      互動沙盒（StackBlitz 嵌入）                  │
│                                                                    │
│  tooling/                                                          │
│  ├── eslint-config/   共用 ESLint 規則                             │
│  ├── tsconfig/        共用 TypeScript 設定                         │
│  └── cem-plugins/     Custom Elements Manifest 擴充                │
└──────────────────────────────────────────────────────────────────┘

CD/CD 流水線（GitHub Actions）：
  PR 開啟    → lint + typecheck + unit tests + browser tests
  PR 合併    → build + visual regression (Chromatic) + changeset
  Release    → changesets/action 自動建立 Release PR + npm publish
  Hotfix     → cherry-pick + patch release

五個產品團隊的消費方式：
  Team A（React 18）   → import from @acme/react-wrappers
  Team B（Vue 3）      → 直接使用 HTML 標籤，設定 isCustomElement
  Team C（Angular）    → import + CUSTOM_ELEMENTS_SCHEMA
  Team D（原生 HTML）  → &lt;script type="module"&gt; CDN 匯入
  Team E（Next.js）    → SSR 端使用 @lit-labs/ssr，客戶端 hydrate
</book-code-block>

<p><strong>版本策略：</strong>使用 Changesets 管理版本；HTML API 破壞性變更強制 Major 版本；每個 Major 版本維護 12 個月（安全更新）；提供 codemod 工具輔助遷移。</p>

<p><strong>治理模型：</strong>設立「Component Library Guild」——每個產品團隊指派一名代表；新元件提案需提交 RFC（Request for Comments）；設計決策記錄在 ADR（Architecture Decision Records）文件中。</p>

<h2 id="ch32-s04">觀念陷阱：Lifecycle 順序、Event Retargeting、FACE API</h2>

<p>以下是面試中最常考的觀念陷阱，每個都有典型的錯誤答案與正確解釋。</p>

<p><strong>陷阱一：Lifecycle 執行順序</strong></p>

<book-code-block language="typescript" label="TypeScript — Lifecycle 順序驗證">
class LifecycleDemo extends HTMLElement {
  constructor() {
    super();
    console.log('1. constructor');
    // ❌ 這裡不能讀取 attribute！
    // console.log(this.getAttribute('name')); // 返回 null

    // ✅ 可以 attachShadow
    this.attachShadow({ mode: 'open' });
  }

  static observedAttributes = ['name', 'value'];

  connectedCallback() {
    console.log('2. connectedCallback');
    // ✅ 這裡可以安全讀取 attribute 和操作子節點
    console.log('name attr:', this.getAttribute('name'));
    // 注意：多次插入/移除 DOM 會多次觸發此回調
  }

  attributeChangedCallback(name: string, oldVal: string | null, newVal: string | null) {
    // ⚠️ 這個可能在 connectedCallback 之前觸發！
    // 當元素在解析時就帶有 attribute，attributeChangedCallback 會在
    // connectedCallback 之前執行
    console.log(\`attributeChangedCallback: \${name} "\${oldVal}" → "\${newVal}"\`);
  }

  disconnectedCallback() {
    console.log('3. disconnectedCallback（DOM 移除時）');
    // 清理工作應在此執行
  }

  adoptedCallback() {
    console.log('(adoptedCallback: 移到其他 document 時，極少用)');
  }
}

// 常見陷阱問題：
// Q: 在 HTML 解析階段，以下哪個回調先觸發？
//    &lt;lifecycle-demo name="test"&gt;&lt;/lifecycle-demo&gt;
// A: constructor → attributeChangedCallback(name) → connectedCallback
//    (attribute 在 constructor 之後、connectedCallback 之前就存在)
</book-code-block>

<p><strong>陷阱二：Event Retargeting 的邊界案例</strong></p>

<book-code-block language="typescript" label="TypeScript — Event Retargeting 深度解析">
// 案例：巢狀 Shadow DOM 中的事件路徑
// 結構：outer-el (Shadow Root A) → inner-el (Shadow Root B) → button

// 在 document 層級監聽 click 事件：
document.addEventListener('click', (e) =&gt; {
  // e.target → outer-el（被重新定向到最外層的 Shadow Host）
  console.log('target:', e.target);

  // e.composedPath() 返回完整路徑：
  // [button, shadow-root-B, inner-el, div(A), shadow-root-A, outer-el, body, html, document, window]
  console.log('path:', e.composedPath());
  console.log('actual click target:', e.composedPath()[0]); // button
});

// 在 Shadow Root A 內監聽：
outerEl.shadowRoot.addEventListener('click', (e) =&gt; {
  // e.target → inner-el（只被重新定向到 Shadow Root B 的宿主）
  // 而非 outer-el
  console.log('target inside outer shadow:', e.target); // inner-el
});

// 關鍵規則：事件的 target 在穿越 Shadow Root 邊界時，
// 被重新定向為對應的 Shadow Host
// 但 composedPath() 始終保留完整路徑（僅在 dispatch 期間可讀）
</book-code-block>

<p><strong>陷阱三：FACE API 的 formDisabledCallback 與 formResetCallback</strong></p>

<book-code-block language="typescript" label="TypeScript — FACE API 完整回調清單">
class CompleteFormElement extends HTMLElement {
  static formAssociated = true;
  private internals: ElementInternals;

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  // ✅ 最常用：表單提交時的值
  formAssociatedCallback(form: HTMLFormElement | null) {
    console.log('關聯的 form 改變:', form);
  }

  // ✅ 必須實作：form.reset() 時呼叫
  formResetCallback() {
    // 必須重置元件的值到初始狀態
    this.internals.setFormValue('');
    this.value = '';
  }

  // ✅ 重要：disabled 狀態同步
  formDisabledCallback(isDisabled: boolean) {
    // 當父 &lt;fieldset disabled&gt; 或 form disabled 時觸發
    this.disabled = isDisabled;
  }

  // ✅ 用於 autofill
  formStateRestoreCallback(state: string, mode: 'restore' | 'autocomplete') {
    this.value = state;
  }

  private value = '';
  private disabled = false;
}

// 常見陷阱問題：
// Q: formResetCallback 不觸發？
// A: 確認 static formAssociated = true；確認元素實際上在 &lt;form&gt; 內
// Q: formDisabledCallback 不觸發？
// A: 它只在父 &lt;fieldset disabled&gt; 改變時觸發，
//    直接設定 element.disabled 不觸發此回調
</book-code-block>

<h2 id="ch32-s05">如何跟只懂 React 的面試官談論 Web Components</h2>

<p>當面試官的背景是 React 工程師時，用對方熟悉的概念作為橋接，可以大幅提高溝通效率。以下是 React 概念與 Web Components 等價物的對照表：</p>

<table>
  <thead>
    <tr><th>React 概念</th><th>Web Components 等價物</th><th>關鍵差異</th></tr>
  </thead>
  <tbody>
    <tr><td>Component</td><td>Custom Element class</td><td>WC 是真實 DOM 節點，React Component 是虛擬 DOM 描述</td></tr>
    <tr><td>props</td><td>attributes + properties</td><td>WC 的 attribute 只能是字串；property 可以是任意 JS 值</td></tr>
    <tr><td>state（useState）</td><td>@state（Lit）/ private 屬性</td><td>WC 沒有框架的狀態管理，Lit 的 @state 觸發 re-render</td></tr>
    <tr><td>useEffect + cleanup</td><td>connectedCallback + disconnectedCallback</td><td>WC 生命週期是 DOM 驅動的，不是宣告式的</td></tr>
    <tr><td>children</td><td>&lt;slot&gt;（預設 slot）</td><td>WC Slot 是 DOM 投影；React children 是 JS 傳遞</td></tr>
    <tr><td>named children（render props）</td><td>named slot（slot="name"）</td><td>WC 在 HTML 層面插入；React 在 JS 層面傳遞</td></tr>
    <tr><td>Context</td><td>@lit/context（Context Protocol）</td><td>WC Context 跨越 Shadow DOM 邊界，基於 DOM 事件</td></tr>
    <tr><td>forwardRef</td><td>ElementInternals / part=""</td><td>WC 用 ::part() 暴露內部元素供外部樣式化</td></tr>
    <tr><td>CSS Modules / styled</td><td>Shadow DOM（樣式封裝）</td><td>WC 的封裝是瀏覽器原生的，不需要編譯步驟</td></tr>
    <tr><td>React.memo</td><td>shouldUpdate()（Lit）</td><td>阻止不必要的 re-render；WC 中手動返回 false</td></tr>
    <tr><td>useRef（DOM ref）</td><td>@query / this.shadowRoot.querySelector</td><td>WC 直接操作 Shadow DOM；無需 ref 機制</td></tr>
    <tr><td>dangerouslySetInnerHTML</td><td>innerHTML（需手動防 XSS）</td><td>Lit html\`\` 自動轉義；原生需手動確保安全</td></tr>
    <tr><td>Error Boundary</td><td>try/catch in lifecycle callbacks</td><td>WC 無框架級 Error Boundary；需自行實作回退 UI</td></tr>
    <tr><td>React DevTools</td><td>Lit DevTools（Chrome extension）</td><td>視覺化 Lit 元件樹和響應式更新</td></tr>
    <tr><td>Storybook（React）</td><td>Storybook（@storybook/web-components-vite）</td><td>相同工具，不同 renderer；story 格式幾乎相同</td></tr>
  </tbody>
</table>

<p><strong>面試溝通範例腳本：</strong></p>

<book-code-block language="text" label="面試對話 — 如何向 React 工程師介紹 Web Components 的獨特價值">
面試官：「我們全部用 React，為什麼要考慮 Web Components？」

你的回答框架（STAR + 技術深度）：

1. 認同 React 的優勢（避免對立）：
   「React 的 Virtual DOM 和單向資料流在管理複雜應用狀態方面非常出色，
    我完全認同這一點。」

2. 點出 React 無法解決的問題：
   「但有一個場景 React 本身無法解決：當我們有多個使用不同框架的前端應用，
    又需要共享同一套 UI 元件時。例如，主應用是 React，但新功能由另一個團隊
    用 Vue 開發。」

3. 用 React 術語解釋 WC 的解決方案：
   「Web Components 提供了框架層之下的 Component 原語——它就像是瀏覽器原生
    的 React Component，但任何框架都能消費。Shadow DOM 等同於 CSS Modules
    但完全不需要打包工具；Slot 等同於 children 和 render props；
    自訂事件等同於 onXxx props。」

4. 給出具體的使用場景：
   「最適合的場景是 Design System 和微前端架構。
    Shoelace（現 Web Awesome）和 Adobe Spectrum 都是這個模式的成功驗證。
    在 React 應用中，我們用 @lit/react 的 createComponent 包裝，
    使用體驗和原生 React 元件完全相同。」

5. 誠實說明取捨：
   「Web Components 不適合取代 React 做應用狀態管理——React 的 Hooks、
    Server Components 在這方面更強大。但作為跨框架的 UI 原語，
    它是目前最成熟的選擇。」
</book-code-block>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>面試的本質是展示你能將深度知識轉化為清晰溝通的能力——50 道題目是知識的驗證，Coding 挑戰是工程判斷的展示，系統設計是架構思維的呈現，而能用 React 術語解釋 Web Components，則是你技術廣度與溝通智慧的最終證明。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch31">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">四個端到端專案實作</span>
    </a>
  </div>
</div>
`
