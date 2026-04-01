export const metadata = {
  id: 26,
  part: 5,
  title: '偵錯 Web Components',
  tags: ['實用技巧'] as string[],
  sections: [
    { slug: 'ch26-s01', title: 'Chrome DevTools：檢視 Shadow Root 與 Event Listener' },
    { slug: 'ch26-s02', title: 'Lit DevTools 擴充套件 — 視覺化響應式更新週期' },
    { slug: 'ch26-s03', title: '常見陷阱目錄：20 個錯誤與對應的修正方式' },
    { slug: 'ch26-s04', title: '長時間存活元件中的記憶體洩漏（Memory Leak）模式' },
    { slug: 'ch26-s05', title: '偵錯 Custom Element Upgrade 失敗的方法' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 26 · 第五部：品質保證：測試、無障礙與效能</div>
  <h1>偵錯 Web Components</h1>
  <p>Web Components 的 Shadow DOM 邊界、非同步升級機制與事件重新定向使得偵錯比傳統 DOM 更具挑戰性。本章系統性整理 Chrome DevTools 技巧、20 個常見陷阱與修正方案，以及記憶體洩漏的偵測模式，讓你面對任何問題都能快速定位根因。</p>
  <div class="chapter-tags"><span class="tag tag-practical">實用技巧</span></div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch26-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">Chrome DevTools：檢視 Shadow Root 與 Event Listener</span>
    </a>
    <a class="catalog-item" href="#ch26-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">Lit DevTools 擴充套件 — 視覺化響應式更新週期</span>
    </a>
    <a class="catalog-item" href="#ch26-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">常見陷阱目錄：20 個錯誤與對應的修正方式</span>
    </a>
    <a class="catalog-item" href="#ch26-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">長時間存活元件中的記憶體洩漏模式</span>
    </a>
    <a class="catalog-item" href="#ch26-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">偵錯 Custom Element Upgrade 失敗的方法</span>
    </a>
  </div>
</div>

<h2 id="ch26-s01">Chrome DevTools：檢視 Shadow Root 與 Event Listener</h2>

<p>Chrome DevTools 對 Web Components 有原生支援，但需要了解幾個非直覺的操作方式。</p>

<p><strong>展開 Shadow Root：</strong>在 Elements 面板中，自訂元素旁會有一個 <code>#shadow-root (open)</code> 節點，點擊即可展開。若為 <code>closed</code> 模式，預設不可見（可透過 DevTools 設定開啟）。</p>

<p><strong>查詢 Shadow DOM 內的元素：</strong>在 Console 中，普通的 <code>document.querySelector()</code> 無法穿透 Shadow Root。使用以下技巧：</p>

<book-code-block language="javascript" label="Console — 穿透 Shadow DOM 的查詢技巧">
// 取得 Shadow Root
const host = document.querySelector('my-card');
const shadow = host.shadowRoot;

// 查詢 Shadow DOM 內部元素
const button = shadow.querySelector('button');

// 遞迴穿透所有 Shadow Root（偵錯用工具函式）
function deepQuery(selector, root = document) {
  const result = root.querySelector(selector);
  if (result) return result;
  for (const el of root.querySelectorAll('*')) {
    if (el.shadowRoot) {
      const found = deepQuery(selector, el.shadowRoot);
      if (found) return found;
    }
  }
  return null;
}

// 取得所有 Shadow Root（用於全頁偵錯）
function getAllShadowRoots(root = document.body, roots = []) {
  for (const el of root.querySelectorAll('*')) {
    if (el.shadowRoot) {
      roots.push(el.shadowRoot);
      getAllShadowRoots(el.shadowRoot, roots);
    }
  }
  return roots;
}
</book-code-block>

<p><strong>Event Listener 偵錯：</strong>事件重新定向（Event Retargeting）是 Shadow DOM 最常造成困惑的特性。當事件從 Shadow DOM 內部冒泡到外部時，<code>event.target</code> 會被重新指向宿主元素。</p>

<book-code-block language="javascript" label="Console — 偵錯事件重新定向">
// 在外部監聽點擊事件
document.addEventListener('click', (e) => {
  console.log('target (retargeted):', e.target);
  // 通常是宿主元素，而非實際點擊的 Shadow DOM 內部元素

  // 取得實際的點擊目標（composedPath 返回完整路徑）
  console.log('composedPath:', e.composedPath());
  // [button (shadow内), div (shadow内), shadow-root, my-card, body, html, document, window]

  // 取得 Shadow DOM 內真正的點擊目標
  const innerTarget = e.composedPath()[0];
  console.log('actual target:', innerTarget);
});

// 在 DevTools Event Listeners 面板中：
// 勾選 "Show listeners from ancestor nodes" 可看到 Shadow Root 上的事件
// 使用 getEventListeners(element) 在 Console 查詢特定元素的監聽器
</book-code-block>

<book-callout variant="tip" title="DevTools 設定建議">
  <p>在 DevTools 設定（F1）→ Preferences → Elements 中，開啟「Show user agent shadow DOM」可以看到瀏覽器內建元素（如 &lt;input&gt;、&lt;video&gt;）的 Shadow DOM 結構，有助於理解原生實作方式，也方便偵錯自訂表單元素的無障礙樹整合問題。</p>
</book-callout>

<h2 id="ch26-s02">Lit DevTools 擴充套件 — 視覺化響應式更新週期</h2>

<p>Lit DevTools 是一個 Chrome 擴充套件，專為使用 Lit 建構 Web Components 的開發者設計。安裝後，DevTools 會新增一個「Lit」面板，提供以下功能：</p>

<ul>
  <li><strong>元件樹（Component Tree）：</strong>以樹狀結構顯示所有 Lit 元件，包括 Shadow DOM 內的巢狀元件，點擊可高亮對應的 DOM 節點。</li>
  <li><strong>Properties 面板：</strong>即時顯示選中元件的所有 reactive properties（<code>@property</code> 和 <code>@state</code>），並支援直接修改值以測試不同狀態。</li>
  <li><strong>更新記錄（Update Log）：</strong>記錄每次元件更新的觸發原因（哪個 property 改變）、更新耗時，以及是否因 <code>shouldUpdate()</code> 跳過了本次更新。</li>
  <li><strong>Performance Overlay：</strong>在頁面上以顏色標示最近一段時間內更新頻率最高的元件（紅色 = 高頻率更新，可能是效能瓶頸）。</li>
</ul>

<book-code-block language="typescript" label="TypeScript — 在 Lit 元件中加入偵錯輔助">
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('debug-counter')
class DebugCounter extends LitElement {
  @property({ type: Number }) initialValue = 0;
  @state() private count = 0;

  // performUpdate() 是 Lit 的實際更新入口，覆寫它可追蹤每次更新
  override async performUpdate() {
    const start = performance.now();
    await super.performUpdate();
    const duration = performance.now() - start;
    if (duration &gt; 16) {
      console.warn(\`[debug-counter] Slow update: \${duration.toFixed(2)}ms\`);
    }
  }

  // shouldUpdate() 可以阻止不必要的更新
  override shouldUpdate(changedProperties: Map&lt;string, unknown&gt;) {
    if (changedProperties.has('count') &amp;&amp; this.count === this.initialValue) {
      console.log('[debug-counter] Skipping update: value unchanged');
      return false;
    }
    return true;
  }

  // updated() 可以追蹤哪些 property 觸發了更新
  override updated(changedProperties: Map&lt;string, unknown&gt;) {
    changedProperties.forEach((oldValue, propName) =&gt; {
      console.log(\`[debug-counter] \${String(propName)}: \${oldValue} → \${(this as any)[propName]}\`);
    });
  }

  render() {
    return html\`
      &lt;button @click=\${() =&gt; this.count++}&gt;Count: \${this.count}&lt;/button&gt;
    \`;
  }
}
</book-code-block>

<h2 id="ch26-s03">常見陷阱目錄：20 個錯誤與對應的修正方式</h2>

<p>以下是使用 Web Components 時最常遇到的 20 個陷阱，每個都附有說明與修正方案：</p>

<ol>
  <li>
    <strong>在 constructor 中讀取 attribute</strong><br>
    錯誤：<code>this.getAttribute('value')</code> 在 constructor 中返回 null。<br>
    修正：將邏輯移至 <code>connectedCallback()</code> 或 <code>attributeChangedCallback()</code>。
  </li>
  <li>
    <strong>忘記宣告 observedAttributes</strong><br>
    錯誤：<code>attributeChangedCallback</code> 永不觸發，因為沒有靜態宣告要觀察哪些屬性。<br>
    修正：加入 <code>static observedAttributes = ['my-attr']</code>。
  </li>
  <li>
    <strong>混淆 attribute 與 property</strong><br>
    錯誤：設定 <code>element.value = 'foo'</code>（property）卻期望 <code>attributeChangedCallback</code> 觸發。<br>
    修正：理解 attribute（HTML 字串）與 property（JS 值）是不同的兩件事；在 setter 中同步二者。
  </li>
  <li>
    <strong>事件不設 composed: true 卻期望穿透 Shadow DOM</strong><br>
    錯誤：在 Shadow DOM 內部 dispatch 的事件無法在外部被監聽到。<br>
    修正：加入 <code>composed: true</code> 讓事件穿透 Shadow Root。
  </li>
  <li>
    <strong>忘記 bubbles: true</strong><br>
    錯誤：事件只在元件本身觸發，無法被祖先元素的事件委派捕捉。<br>
    修正：大多數自訂事件應同時設定 <code>bubbles: true, composed: true</code>。
  </li>
  <li>
    <strong>在 disconnectedCallback 中忘記移除事件監聽器</strong><br>
    錯誤：元件從 DOM 移除後，全域或父元素上的事件監聽器仍保留，導致記憶體洩漏與幽靈行為。<br>
    修正：在 <code>disconnectedCallback</code> 中移除所有外部事件監聽器。
  </li>
  <li>
    <strong>直接 innerHTML 注入使用者輸入</strong><br>
    錯誤：<code>this.shadowRoot.innerHTML = \`&lt;p&gt;\${userInput}&lt;/p&gt;\`</code> 造成 XSS 漏洞。<br>
    修正：使用 <code>textContent</code> 或 Lit 的 <code>html\`\`</code> 模板（自動跳脫）。
  </li>
  <li>
    <strong>Shadow DOM closed 模式造成測試困難</strong><br>
    錯誤：<code>attachShadow({ mode: 'closed' })</code> 讓測試無法訪問內部 DOM。<br>
    修正：除非有充分安全理由，預設使用 <code>open</code> 模式；測試中使用 <code>open</code>。
  </li>
  <li>
    <strong>忘記 super() 在 constructor 第一行</strong><br>
    錯誤：繼承 HTMLElement 的 constructor 若不先呼叫 super()，會拋出 ReferenceError。<br>
    修正：<code>constructor() { super(); /* ... */ }</code>。
  </li>
  <li>
    <strong>在 constructor 中操作 Light DOM 子節點</strong><br>
    錯誤：在 constructor 中讀取 <code>this.children</code> 或 <code>this.textContent</code>，因為此時子節點可能尚未解析。<br>
    修正：移至 <code>connectedCallback()</code>；或使用 <code>slotchange</code> 事件。
  </li>
  <li>
    <strong>Slot 內容不觸發元件更新</strong><br>
    錯誤：Slot 內容變化不會觸發 Lit 的 re-render，因為 Slot 內容屬於 Light DOM。<br>
    修正：監聽 Shadow Root 的 <code>slotchange</code> 事件並手動更新相依狀態。
  </li>
  <li>
    <strong>CSS :host 選擇器的優先級誤解</strong><br>
    錯誤：以為 <code>:host</code> 的樣式優先級高於外部樣式，但外部樣式（尤其是 id 或 !important）可覆蓋 <code>:host</code>。<br>
    修正：使用 CSS Custom Properties 作為主題化介面，讓外部可控制。
  </li>
  <li>
    <strong>多次呼叫 attachShadow()</strong><br>
    錯誤：在 <code>connectedCallback</code> 中呼叫 <code>attachShadow()</code>，若元件多次插入/移除 DOM，會拋出「Shadow root cannot be created on a host which already hosts a shadow tree」。<br>
    修正：將 <code>attachShadow()</code> 移至 constructor，且只呼叫一次。
  </li>
  <li>
    <strong>customElements.define 重複宣告</strong><br>
    錯誤：在模組被多次載入（如 HMR 熱更新）時，重複呼叫 <code>customElements.define()</code> 會拋出 NotSupportedError。<br>
    修正：加入防衛：<code>if (!customElements.get('my-el')) customElements.define('my-el', MyEl)</code>。
  </li>
  <li>
    <strong>未處理 attributeChangedCallback 的 null 值</strong><br>
    錯誤：attribute 被移除時，<code>newValue</code> 為 null，但程式碼嘗試對其呼叫字串方法而崩潰。<br>
    修正：始終檢查：<code>if (newValue === null) { /* handle removal */ return; }</code>。
  </li>
  <li>
    <strong>在 Lit 中錯誤使用 .bind(this)</strong><br>
    錯誤：在 render() 中使用 <code>@click=\${this.handler.bind(this)}</code>，每次 render 都建立新函式，導致不必要的 DOM 更新。<br>
    修正：在 class field 中定義箭頭函式：<code>private handler = () =&gt; { ... }</code>。
  </li>
  <li>
    <strong>忘記 formAssociated 但在表單中使用</strong><br>
    錯誤：自訂元素沒有設定 <code>static formAssociated = true</code>，導致其值不被表單 submit 包含。<br>
    修正：加入 <code>static formAssociated = true</code> 並使用 ElementInternals API。
  </li>
  <li>
    <strong>Shadow DOM 內的 id 與外部 label for 無法關聯</strong><br>
    錯誤：<code>&lt;label for="my-input"&gt;</code> 無法關聯到 Shadow DOM 內部的 <code>&lt;input id="my-input"&gt;</code>。<br>
    修正：在 Shadow DOM 內部包含 label，或使用 ElementInternals 的 <code>setFormValue()</code>。
  </li>
  <li>
    <strong>Lit @query 在元件未更新前返回 null</strong><br>
    錯誤：在 <code>connectedCallback()</code> 中使用 <code>@query</code> 裝飾器的屬性，因為首次 render 尚未完成而為 null。<br>
    修正：在 <code>firstUpdated()</code> 生命週期中使用 <code>@query</code> 屬性，此時 DOM 已就緒。
  </li>
  <li>
    <strong>沒有為自訂元素設定 display 樣式</strong><br>
    錯誤：自訂元素預設是 <code>display: inline</code>（行內元素），與設計稿不符，且無法設定寬高。<br>
    修正：在 <code>:host { display: block; }</code>（或 <code>inline-flex</code> 等）中明確設定 display 值。
  </li>
</ol>

<book-code-block language="typescript" label="TypeScript — 常見陷阱修正範例：正確的事件 dispatch 與屬性同步">
class CorrectElement extends HTMLElement {
  // 陷阱 2 修正：宣告 observedAttributes
  static observedAttributes = ['value', 'disabled'];

  // 陷阱 3 修正：property 與 attribute 同步
  get value(): string {
    return this.getAttribute('value') ?? '';
  }
  set value(v: string) {
    this.setAttribute('value', v);
    // 同時更新內部 DOM
    const input = this.shadowRoot?.querySelector('input');
    if (input) input.value = v;
  }

  constructor() {
    super(); // 陷阱 9 修正：super() 在第一行
    // 陷阱 13 修正：attachShadow 在 constructor
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = \`&lt;input type="text" /&gt;\`;
  }

  connectedCallback() {
    // 陷阱 16 修正：使用 class field 箭頭函式避免每次 bind
    this.shadowRoot!.querySelector('input')!.addEventListener('input', this.handleInput);
  }

  disconnectedCallback() {
    // 陷阱 6 修正：移除事件監聽器
    this.shadowRoot?.querySelector('input')?.removeEventListener('input', this.handleInput);
  }

  // class field 箭頭函式，this 已綁定
  private handleInput = (e: Event) =&gt; {
    const input = e.target as HTMLInputElement;
    // 陷阱 4、5 修正：bubbles + composed
    this.dispatchEvent(new CustomEvent('value-change', {
      detail: { value: input.value },
      bubbles: true,
      composed: true,
    }));
  };

  attributeChangedCallback(name: string, _: string | null, newValue: string | null) {
    // 陷阱 15 修正：處理 null
    if (newValue === null) return;
    if (name === 'value') {
      const input = this.shadowRoot?.querySelector('input');
      if (input) input.value = newValue;
    }
  }
}

// 陷阱 14 修正：防衛重複定義
if (!customElements.get('correct-element')) {
  customElements.define('correct-element', CorrectElement);
}
</book-code-block>

<h2 id="ch26-s04">長時間存活元件中的記憶體洩漏（Memory Leak）模式</h2>

<p>Web Components 的 SPA 應用中，元件可能被頻繁建立與銷毀。記憶體洩漏通常源自以下三種模式：</p>

<p><strong>模式一：未移除的全域事件監聽器</strong></p>

<book-code-block language="typescript" label="TypeScript — 使用 AbortController 管理事件監聽器生命週期">
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('lifecycle-safe')
class LifecycleSafe extends LitElement {
  // AbortController 讓所有監聽器可以一次性清理
  private abortController = new AbortController();

  connectedCallback() {
    super.connectedCallback();
    const { signal } = this.abortController;

    // 所有監聽器都綁定同一個 signal
    window.addEventListener('resize', this.handleResize, { signal });
    document.addEventListener('keydown', this.handleKeydown, { signal });
    window.addEventListener('online', this.handleOnline, { signal });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // 一次性清理所有監聽器
    this.abortController.abort();
    // 重置以便下次 connectedCallback 使用
    this.abortController = new AbortController();
  }

  private handleResize = () =&gt; console.log('resize');
  private handleKeydown = (e: KeyboardEvent) =&gt; console.log('key:', e.key);
  private handleOnline = () =&gt; console.log('online');

  render() { return html\`&lt;slot&gt;&lt;/slot&gt;\`; }
}
</book-code-block>

<p><strong>模式二：WeakRef 與 FinalizationRegistry 偵測洩漏</strong></p>

<book-code-block language="typescript" label="TypeScript — 用 WeakRef 追蹤元件是否被正確回收">
// memory-tracker.ts — 開發環境記憶體追蹤工具
class ComponentMemoryTracker {
  private registry = new FinalizationRegistry&lt;string&gt;((tagName) =&gt; {
    console.log(\`[MemoryTracker] ✅ \${tagName} 已被垃圾回收\`);
  });

  private tracked = new Map&lt;string, WeakRef&lt;HTMLElement&gt;&gt;();

  track(element: HTMLElement, id: string) {
    const tagName = \`\${element.tagName.toLowerCase()}#\${id}\`;
    this.tracked.set(id, new WeakRef(element));
    this.registry.register(element, tagName, element);
    console.log(\`[MemoryTracker] 📍 開始追蹤 \${tagName}\`);
  }

  checkAlive(id: string): boolean {
    const ref = this.tracked.get(id);
    const element = ref?.deref();
    if (element) {
      console.log(\`[MemoryTracker] ⚠️ id=\${id} 的元件仍在記憶體中\`);
      return true;
    }
    return false;
  }

  untrack(id: string) {
    const ref = this.tracked.get(id);
    const element = ref?.deref();
    if (element) this.registry.unregister(element);
    this.tracked.delete(id);
  }
}

export const memoryTracker = new ComponentMemoryTracker();

// 在元件中使用
class TrackedComponent extends HTMLElement {
  private trackId = Math.random().toString(36).slice(2);

  connectedCallback() {
    if (process.env.NODE_ENV === 'development') {
      memoryTracker.track(this, this.trackId);
    }
  }

  disconnectedCallback() {
    // 不需要在 disconnectedCallback 手動 untrack，
    // FinalizationRegistry 會在 GC 時自動通知
  }
}
</book-code-block>

<p><strong>模式三：在 Chrome DevTools Memory 面板中手動偵測洩漏</strong></p>

<ol>
  <li>開啟 DevTools → Memory 面板</li>
  <li>選取「Heap snapshot」，點擊「Take snapshot」記錄基準</li>
  <li>執行可能造成洩漏的操作（如建立並銷毀大量元件）</li>
  <li>點擊「Take snapshot」再次記錄</li>
  <li>在第二個 snapshot 的 View 下拉選「Comparison」，Filter 輸入你的元件 class 名稱</li>
  <li>若 Delta（差值）持續增加且「# New」不為零，代表有洩漏</li>
</ol>

<h2 id="ch26-s05">偵錯 Custom Element Upgrade 失敗的方法</h2>

<p>Custom Element Upgrade 失敗意味著自訂元素標籤已在 DOM 中存在，但對應的 JavaScript 定義尚未執行，導致元素停留在「未升級」狀態（HTMLUnknownElement 或 HTMLElement）。</p>

<book-code-block language="javascript" label="Console — 診斷升級狀態的工具函式">
// 檢查頁面上所有自訂元素的升級狀態
function diagnoseCustomElements() {
  const allElements = document.querySelectorAll('*');
  const customEls = Array.from(allElements).filter(el =&gt;
    el.tagName.includes('-')
  );

  const report = customEls.map(el =&gt; ({
    tag: el.tagName.toLowerCase(),
    defined: !!customElements.get(el.tagName.toLowerCase()),
    upgraded: el.constructor !== HTMLElement &amp;&amp; el.constructor.name !== 'HTMLElement',
    constructorName: el.constructor.name,
    element: el,
  }));

  const failed = report.filter(r =&gt; !r.defined || !r.upgraded);
  if (failed.length === 0) {
    console.log('✅ 所有自訂元素升級成功');
  } else {
    console.table(failed.map(r =&gt; ({
      tag: r.tag,
      defined: r.defined,
      upgraded: r.upgraded,
      constructor: r.constructorName,
    })));
  }
  return report;
}

diagnoseCustomElements();

// 等待特定元素升級（含超時）
async function waitForUpgrade(tagName, timeout = 5000) {
  const race = Promise.race([
    customElements.whenDefined(tagName),
    new Promise((_, reject) =&gt;
      setTimeout(() =&gt; reject(new Error(\`\${tagName} upgrade timeout after \${timeout}ms\`)), timeout)
    ),
  ]);

  try {
    await race;
    console.log(\`✅ \${tagName} 升級成功\`);
  } catch (e) {
    console.error(\`❌ \${tagName} 升級失敗：\`, e.message);
    // 常見原因：JS 檔案未載入、模組有語法錯誤、customElements.define 未執行
    console.info('偵錯步驟：');
    console.info('1. 檢查 Network 面板，確認對應的 JS 模組已載入（HTTP 200）');
    console.info('2. 檢查 Console 是否有模組解析錯誤（SyntaxError、TypeError）');
    console.info('3. 確認 customElements.define() 在模組頂層執行，而非在條件分支中');
    console.info('4. 檢查是否有重複 define 造成的 NotSupportedError');
  }
}
</book-code-block>

<book-code-block language="typescript" label="TypeScript — 升級失敗的防衛性 wrapper">
// safe-define.ts — 防衛性元件定義工具
export function safeDefine(tagName: string, constructor: CustomElementConstructor) {
  if (customElements.get(tagName)) {
    // 在 HMR 熱更新環境中，可以選擇更新已存在的定義
    if (process.env.NODE_ENV === 'development') {
      console.warn(\`[safeDefine] \${tagName} 已定義，跳過重複定義\`);
    }
    return;
  }

  try {
    customElements.define(tagName, constructor);
  } catch (e) {
    console.error(\`[safeDefine] 定義 \${tagName} 失敗：\`, e);
    // 向監控系統回報
    if (typeof window.__reportError === 'function') {
      window.__reportError(\`customElements.define failed for \${tagName}\`, e);
    }
  }
}

// 批次等待多個元件升級，帶詳細的失敗診斷
export async function ensureUpgraded(tagNames: string[]): Promise&lt;void&gt; {
  const results = await Promise.allSettled(
    tagNames.map(tag =&gt;
      Promise.race([
        customElements.whenDefined(tag),
        new Promise&lt;never&gt;((_, reject) =&gt;
          setTimeout(() =&gt; reject(new Error(\`Timeout: \${tag}\`)), 10000)
        ),
      ])
    )
  );

  results.forEach((result, i) =&gt; {
    if (result.status === 'rejected') {
      console.error(\`升級失敗: \${tagNames[i]}\`, result.reason);
    }
  });
}
</book-code-block>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>DevTools 的 composedPath() 揭露事件真相，Lit DevTools 視覺化更新週期，20 個陷阱多數源自對 attribute/property 二元性的誤解，AbortController 是清理事件監聽器的最佳實踐，diagnoseCustomElements() 是升級問題的第一道診斷工具。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch25">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">效能優化</span>
    </a>
    <a class="footer-link" href="#ch27">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">將 Web Component 函式庫發布到 npm</span>
    </a>
  </div>
</div>
`
