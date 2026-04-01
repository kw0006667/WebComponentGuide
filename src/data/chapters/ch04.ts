export const metadata = {
  id: 4,
  part: 1,
  title: 'HTML Templates 與 Slots',
  tags: ['實用技巧'] as string[],
  sections: [
    { slug: 'ch04-s01', title: '<template> 元素 — 靜止的、可複製的 DOM 片段' },
    { slug: 'ch04-s02', title: '用 content.cloneNode(true) 來產生 DOM' },
    { slug: 'ch04-s03', title: '具名 Slot 與預設 Slot 的設計' },
    { slug: 'ch04-s04', title: 'slotchange 事件與動態 Slot 內容的處理' },
    { slug: 'ch04-s05', title: 'Slot Fallback 內容的常見設計模式' },
    { slug: 'ch04-s06', title: '效能：為什麼在高頻渲染路徑中 Template 優於 innerHTML' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 04 · 第一部：基礎篇 — Web 平台的原生能力</div>
  <h1>HTML Templates 與 Slots</h1>
  <p>&lt;template&gt; 元素讓你定義「惰性的」DOM 片段，在真正需要前不會被解析或渲染，複製起來又比 innerHTML 快得多。結合 Slot 機制，你可以設計出靈活的內容投影（content projection）系統，讓元件的使用者決定要顯示什麼內容。本章深入這兩個相輔相成的特性，以及在高頻渲染場景中的效能考量。</p>
  <div class="chapter-tags"><span class="tag tag-tip">實用技巧</span></div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch04-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">&lt;template&gt; 元素</span>
    </a>
    <a class="catalog-item" href="#ch04-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">content.cloneNode(true)</span>
    </a>
    <a class="catalog-item" href="#ch04-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">具名 Slot 與預設 Slot</span>
    </a>
    <a class="catalog-item" href="#ch04-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">slotchange 事件與動態內容</span>
    </a>
    <a class="catalog-item" href="#ch04-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">Slot Fallback 設計模式</span>
    </a>
    <a class="catalog-item" href="#ch04-s06">
      <span class="catalog-item-num">06</span>
      <span class="catalog-item-title">效能：Template vs innerHTML</span>
    </a>
  </div>
</div>

<h2 id="ch04-s01">&lt;template&gt; 元素 — 靜止的、可複製的 DOM 片段</h2>

<p><code>&lt;template&gt;</code> 元素是 HTML 中一個特殊的容器。它的內容會被瀏覽器解析成合法的 DOM 結構，但不會被渲染到頁面上、不會執行其中的 <code>&lt;script&gt;</code>、不會載入 <code>&lt;img&gt;</code> 的資源，也不會套用 CSS。這讓它成為儲存「可重複使用的 DOM 藍圖」的完美工具。</p>

<p>template 的內容儲存在一個特殊的 <code>DocumentFragment</code> 中，透過 <code>template.content</code> 屬性存取。這個 DocumentFragment 可以被 <code>cloneNode(true)</code> 複製，然後插入到真實的 DOM 中——每次插入都是一份新的複本，互不干擾。</p>

<book-code-block language="typescript" label="&lt;template&gt; 的基本特性展示">
// 假設 HTML 中有：
// &lt;template id="card-template"&gt;
//   &lt;article class="card"&gt;
//     &lt;header class="card-header"&gt;
//       &lt;h2 class="card-title"&gt;&lt;/h2&gt;
//       &lt;span class="card-badge"&gt;&lt;/span&gt;
//     &lt;/header&gt;
//     &lt;div class="card-body"&gt;&lt;/div&gt;
//     &lt;footer class="card-footer"&gt;
//       &lt;button class="card-action"&gt;了解更多&lt;/button&gt;
//     &lt;/footer&gt;
//   &lt;/article&gt;
// &lt;/template&gt;

// ── 取得 template 元素 ──
function getTemplate(id: string): HTMLTemplateElement {
  const el = document.getElementById(id)
  if (!(el instanceof HTMLTemplateElement)) {
    throw new Error(\`Template "\${id}" not found\`)
  }
  return el
}

const tmpl = getTemplate('card-template')

// ── template 的關鍵特性 ──
console.log(tmpl.content)               // DocumentFragment
console.log(tmpl.content.children)      // HTMLCollection（可查看內容）
console.log(tmpl.innerHTML)             // 原始 HTML 字串
console.log(document.body.contains(tmpl.content)) // false（不在 DOM 中）

// 驗證：template 內的 img 不會發出網路請求
// &lt;template&gt;&lt;img src="/api/expensive.jpg"&gt;&lt;/template&gt;
// 只有 cloneNode() 並插入 DOM 後，圖片才開始載入

// ── 在 JS 中動態建立 template ──
function createTemplate(html: string): HTMLTemplateElement {
  const template = document.createElement('template')
  template.innerHTML = html
  return template
}

const buttonTemplate = createTemplate(\`
  &lt;style&gt;
    .btn {
      padding: 8px 16px;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
    }
    .btn:hover { background: #4338ca; }
  &lt;/style&gt;
  &lt;button class="btn"&gt;&lt;slot&gt;Click&lt;/slot&gt;&lt;/button&gt;
\`)

// 重要：template 可以被反覆 clone，原本內容不受影響
const clone1 = buttonTemplate.content.cloneNode(true) as DocumentFragment
const clone2 = buttonTemplate.content.cloneNode(true) as DocumentFragment
// clone1 和 clone2 是完全獨立的 DOM 樹副本
</book-code-block>

<h3>優點</h3>
<ul>
  <li>內容在使用前完全惰性，不消耗渲染資源</li>
  <li>可以無限次 clone，每次都得到獨立的副本</li>
  <li>內容被 HTML 解析器驗證，比手寫 innerHTML 更不易出錯</li>
</ul>

<h3>缺點 / 注意事項</h3>
<ul>
  <li>靜態的，沒有資料繫結——你需要 clone 後手動填充資料</li>
  <li>在 JS 中動態建立時仍使用 innerHTML（需注意 XSS）</li>
</ul>

<h2 id="ch04-s02">用 content.cloneNode(true) 來產生 DOM</h2>

<p>Clone template 的操作看似簡單，但有幾個重要的細節需要掌握：<code>deep: true</code> 參數的意義、clone 後的型別斷言，以及如何高效地填充動態資料。</p>

<book-code-block language="typescript" label="template clone 的完整模式">
// ── 基礎 clone 模式 ──
interface ProductData {
  id: string
  name: string
  price: number
  imageUrl: string
  badge?: string
}

// 在模組層級建立 template（只建立一次）
const productTemplate = (() =&gt; {
  const t = document.createElement('template')
  t.innerHTML = \`
    &lt;article class="product-card" data-product-id=""&gt;
      &lt;div class="product-image-wrapper"&gt;
        &lt;img class="product-image" src="" alt="" loading="lazy"&gt;
        &lt;span class="product-badge" hidden&gt;&lt;/span&gt;
      &lt;/div&gt;
      &lt;div class="product-info"&gt;
        &lt;h3 class="product-name"&gt;&lt;/h3&gt;
        &lt;p class="product-price"&gt;&lt;/p&gt;
      &lt;/div&gt;
      &lt;button class="product-btn" type="button"&gt;加入購物車&lt;/button&gt;
    &lt;/article&gt;
  \`
  return t
})()

// 每次呼叫 createProductCard 都 clone template
function createProductCard(data: ProductData): HTMLElement {
  // cloneNode(true) 深度 clone，包含所有後代節點
  const fragment = productTemplate.content.cloneNode(true) as DocumentFragment

  // 型別安全的元素查詢
  function query&lt;T extends HTMLElement&gt;(selector: string): T {
    const el = fragment.querySelector(selector)
    if (!el) throw new Error(\`Element "\${selector}" not found in template\`)
    return el as T
  }

  const article = query&lt;HTMLElement&gt;('article')
  const img = query&lt;HTMLImageElement&gt;('.product-image')
  const badge = query&lt;HTMLSpanElement&gt;('.product-badge')
  const name = query&lt;HTMLHeadingElement&gt;('.product-name')
  const price = query&lt;HTMLParagraphElement&gt;('.product-price')
  const btn = query&lt;HTMLButtonElement&gt;('.product-btn')

  // 填充資料
  article.dataset.productId = data.id
  img.src = data.imageUrl
  img.alt = data.name
  name.textContent = data.name
  price.textContent = \`NT\$ \${data.price.toLocaleString()}\`

  if (data.badge) {
    badge.textContent = data.badge
    badge.hidden = false
  }

  // 綁定事件
  btn.addEventListener('click', () =&gt; {
    btn.dispatchEvent(new CustomEvent('add-to-cart', {
      bubbles: true,
      composed: true,
      detail: { productId: data.id, price: data.price }
    }))
  })

  // DocumentFragment 插入 DOM 後，其子元素被移走，fragment 變空
  // 所以要先取得 article 的參考
  return article
}

// ── 批次渲染（效能優化）──
function renderProductList(products: ProductData[], container: HTMLElement) {
  // 使用 DocumentFragment 一次性插入，減少 reflow
  const batchFragment = document.createDocumentFragment()

  for (const product of products) {
    batchFragment.appendChild(createProductCard(product))
  }

  // 一次性更新 DOM，只觸發一次 reflow
  container.appendChild(batchFragment)
}
</book-code-block>

<book-callout variant="warning" title="DocumentFragment 插入 DOM 後會清空">
  <p>呼叫 <code>template.content.cloneNode(true)</code> 得到的 DocumentFragment 在被 <code>appendChild</code> 或 <code>insertBefore</code> 插入 DOM 後，其所有子節點都會被移走，fragment 本身變為空白。因此，如果你需要在插入後繼續操作克隆出來的節點，必須事先保存對特定元素的參考（如上例中的 <code>article</code> 變數）。</p>
</book-callout>

<h2 id="ch04-s03">具名 Slot 與預設 Slot 的設計</h2>

<p>Slot 是 Shadow DOM 中的「內容投影（Content Projection）」機制。它讓 Custom Element 的使用者能夠決定元件特定區域要顯示什麼內容，同時讓元件保持對整體結構和樣式的控制。這個機制在概念上類似 Vue 的 <code>&lt;slot&gt;</code> 和 Angular 的 <code>&lt;ng-content&gt;</code>，但它是原生的瀏覽器能力。</p>

<book-code-block language="typescript" label="具名 Slot 與預設 Slot 完整設計">
class DialogComponent extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = \`
      &lt;style&gt;
        :host {
          display: block;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dialog {
          background: white;
          border-radius: 12px;
          width: min(90vw, 480px);
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        /* 具名 slot 的容器樣式 */
        .dialog-header {
          padding: 20px 24px 16px;
          border-bottom: 1px solid #e5e7eb;
          flex-shrink: 0;
        }

        .dialog-body {
          padding: 20px 24px;
          overflow-y: auto;
          flex: 1;
        }

        .dialog-footer {
          padding: 16px 24px 20px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          flex-shrink: 0;
        }

        /* 樣式化被投影進來的元素（::slotted）*/
        ::slotted([slot="title"]) {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
        }

        ::slotted([slot="actions"]) {
          display: contents; /* 讓 slot 內的 flex 佈局生效 */
        }
      &lt;/style&gt;

      &lt;div class="dialog" role="dialog" aria-modal="true"&gt;
        &lt;!-- 具名 slot：只接受 slot="title" 的子元素 --&gt;
        &lt;header class="dialog-header"&gt;
          &lt;slot name="title"&gt;Dialog Title&lt;/slot&gt;
        &lt;/header&gt;

        &lt;!-- 預設 slot：接受所有沒有 slot 屬性的子元素 --&gt;
        &lt;div class="dialog-body"&gt;
          &lt;slot&gt;&lt;/slot&gt;
        &lt;/div&gt;

        &lt;!-- 具名 slot：只接受 slot="actions" 的子元素 --&gt;
        &lt;footer class="dialog-footer"&gt;
          &lt;slot name="actions"&gt;
            &lt;!-- Fallback：使用者沒提供 actions 時的預設按鈕 --&gt;
            &lt;button type="button"&gt;關閉&lt;/button&gt;
          &lt;/slot&gt;
        &lt;/footer&gt;
      &lt;/div&gt;
    \`
  }
}

customElements.define('dialog-component', DialogComponent)

// ── 使用方式（Light DOM）──
// &lt;dialog-component&gt;
//   &lt;!-- 這個 h2 會被投影到 name="title" 的 slot --&gt;
//   &lt;h2 slot="title"&gt;確認刪除&lt;/h2&gt;
//
//   &lt;!-- 沒有 slot 屬性的內容投影到預設 slot --&gt;
//   &lt;p&gt;此操作無法復原，確定要繼續嗎？&lt;/p&gt;
//   &lt;p class="warning"&gt;刪除後的資料將無法恢復。&lt;/p&gt;
//
//   &lt;!-- 這些按鈕投影到 name="actions" 的 slot --&gt;
//   &lt;div slot="actions"&gt;
//     &lt;button type="button" id="cancel"&gt;取消&lt;/button&gt;
//     &lt;button type="button" id="confirm" class="danger"&gt;確認刪除&lt;/button&gt;
//   &lt;/div&gt;
// &lt;/dialog-component&gt;
</book-code-block>

<h3>Slot 的關鍵規則</h3>
<ul>
  <li>Light DOM（使用者提供的內容）<strong>仍然存在於 Light DOM 中</strong>，只是被「視覺上投影」到 Shadow DOM 的 slot 位置</li>
  <li>一個 Custom Element 只能有一個預設（沒有 name 屬性）的 slot</li>
  <li>具名 slot 可以有多個，各自有不同的 name</li>
  <li>使用者可以用 <code>slot="name"</code> 指定內容要投影到哪個 slot</li>
  <li>Light DOM 的樣式由外部 CSS 控制，Shadow DOM 只能透過 <code>::slotted()</code> 影響直接子元素</li>
</ul>

<h2 id="ch04-s04">slotchange 事件與動態 Slot 內容的處理</h2>

<p>當 slot 中的分配內容（assigned nodes）發生變化時，瀏覽器會在 <code>&lt;slot&gt;</code> 元素上觸發 <code>slotchange</code> 事件。這讓元件能夠響應使用者動態新增或移除投影內容的情況。</p>

<book-code-block language="typescript" label="slotchange 事件的監聽與處理">
class TabsContainer extends HTMLElement {
  private shadow!: ShadowRoot
  private tabList!: HTMLElement
  private panelSlot!: HTMLSlotElement

  connectedCallback() {
    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.innerHTML = \`
      &lt;style&gt;
        :host { display: block; }
        .tab-list {
          display: flex;
          border-bottom: 2px solid #e5e7eb;
          gap: 4px;
          padding: 0 8px;
        }
        .tab-btn {
          padding: 8px 16px;
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          font-size: 0.875rem;
          color: #6b7280;
          border-radius: 4px 4px 0 0;
        }
        .tab-btn.active {
          color: #4f46e5;
          border-bottom-color: #4f46e5;
          font-weight: 600;
        }
        .tab-panels { padding: 16px 0; }
      &lt;/style&gt;
      &lt;div class="tab-list" role="tablist"&gt;&lt;/div&gt;
      &lt;div class="tab-panels"&gt;
        &lt;slot&gt;&lt;/slot&gt;
      &lt;/div&gt;
    \`

    this.tabList = this.shadow.querySelector('.tab-list')!
    this.panelSlot = this.shadow.querySelector('slot')!

    // ── 監聽 slotchange 事件 ──
    this.panelSlot.addEventListener('slotchange', () =&gt; {
      this.rebuildTabs()
    })

    // 初始化（可能已有靜態內容）
    this.rebuildTabs()
  }

  private rebuildTabs() {
    // assignedElements() 回傳被分配到這個 slot 的 Element（不含文字節點）
    // 比 assignedNodes() 更常用
    const panels = this.panelSlot.assignedElements() as HTMLElement[]

    // 重建 tab 按鈕列表
    this.tabList.innerHTML = ''

    panels.forEach((panel, index) =&gt; {
      const label = panel.getAttribute('data-tab-label') || \`Tab \${index + 1}\`
      const isActive = index === 0

      const btn = document.createElement('button')
      btn.className = \`tab-btn\${isActive ? ' active' : ''}\`
      btn.textContent = label
      btn.setAttribute('role', 'tab')
      btn.setAttribute('aria-selected', String(isActive))
      btn.setAttribute('aria-controls', \`panel-\${index}\`)

      btn.addEventListener('click', () =&gt; {
        this.activateTab(index)
      })

      this.tabList.appendChild(btn)

      // 顯示/隱藏面板
      panel.hidden = !isActive
      panel.id = \`panel-\${index}\`
      panel.setAttribute('role', 'tabpanel')
    })
  }

  private activateTab(activeIndex: number) {
    const panels = this.panelSlot.assignedElements() as HTMLElement[]
    const buttons = this.tabList.querySelectorAll('.tab-btn')

    panels.forEach((panel, i) =&gt; {
      panel.hidden = i !== activeIndex
    })

    buttons.forEach((btn, i) =&gt; {
      btn.classList.toggle('active', i === activeIndex)
      btn.setAttribute('aria-selected', String(i === activeIndex))
    })
  }
}

customElements.define('tabs-container', TabsContainer)

// ── 使用方式 ──
// &lt;tabs-container&gt;
//   &lt;div data-tab-label="概覽"&gt;概覽內容...&lt;/div&gt;
//   &lt;div data-tab-label="詳情"&gt;詳情內容...&lt;/div&gt;
//   &lt;div data-tab-label="評論"&gt;評論內容...&lt;/div&gt;
// &lt;/tabs-container&gt;

// ── 動態新增 tab（slotchange 會自動觸發 rebuildTabs）──
// const tabs = document.querySelector('tabs-container')!
// const newPanel = document.createElement('div')
// newPanel.setAttribute('data-tab-label', '新分頁')
// newPanel.textContent = '動態新增的內容'
// tabs.appendChild(newPanel)
// ← 觸發 slotchange，自動更新 tab 按鈕
</book-code-block>

<h3>assignedNodes() vs assignedElements() 的差別</h3>
<ul>
  <li><code>slot.assignedNodes()</code>：回傳所有分配的節點，包括文字節點（TextNode）和 Comment</li>
  <li><code>slot.assignedElements()</code>：只回傳 Element 節點，通常是你想要的</li>
  <li><code>slot.assignedNodes({ flatten: true })</code>：攤平巢狀 slot（如果使用了 slot 的 slot）</li>
</ul>

<h2 id="ch04-s05">Slot Fallback 內容的常見設計模式</h2>

<p>Slot 可以包含 fallback 內容——當使用者沒有提供任何內容給該 slot 時，就顯示 fallback。這讓元件有合理的預設狀態，同時保持客製化彈性。設計好的 fallback 是使用者體驗的重要環節。</p>

<book-code-block language="typescript" label="Fallback 內容的多種設計模式">
class ProductCard extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = \`
      &lt;style&gt;
        :host { display: block; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }

        /* 模式一：簡單文字 fallback */
        .title { font-size: 1.125rem; font-weight: 600; padding: 12px 16px; }

        /* 模式二：圖示 + 文字的 empty state fallback */
        .image-wrapper { aspect-ratio: 16/9; background: #f9fafb; overflow: hidden; }
        .image-fallback {
          width: 100%; height: 100%;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 8px; color: #9ca3af;
        }
        .image-fallback svg { width: 40px; height: 40px; }

        /* 模式三：骨架屏（Skeleton）fallback */
        .description { padding: 0 16px 16px; color: #4b5563; min-height: 40px; }
        ::slotted([slot="description"]:empty) + .skeleton-fallback,
        slot[name="description"]:empty ~ .skeleton-fallback {
          display: block;
        }
      &lt;/style&gt;

      &lt;!-- 模式一：純文字 fallback ──
           使用者提供 slot="name" 時顯示使用者內容
           否則顯示 "未命名商品" --&gt;
      &lt;div class="title"&gt;
        &lt;slot name="name"&gt;未命名商品&lt;/slot&gt;
      &lt;/div&gt;

      &lt;!-- 模式二：豐富的 empty state fallback --&gt;
      &lt;div class="image-wrapper"&gt;
        &lt;slot name="image"&gt;
          &lt;!-- 使用者沒提供圖片時，顯示佔位圖示 --&gt;
          &lt;div class="image-fallback"&gt;
            &lt;svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"&gt;
              &lt;path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18M4.5 15.75V20.25M19.5 15.75V20.25"/&gt;
            &lt;/svg&gt;
            &lt;span&gt;尚未上傳圖片&lt;/span&gt;
          &lt;/div&gt;
        &lt;/slot&gt;
      &lt;/div&gt;

      &lt;!-- 模式三：slot + hasContent 邏輯 fallback --&gt;
      &lt;div class="description"&gt;
        &lt;slot name="description"&gt;
          &lt;p style="color: #9ca3af; font-style: italic;"&gt;暫無商品描述。&lt;/p&gt;
        &lt;/slot&gt;
      &lt;/div&gt;

      &lt;slot name="actions"&gt;
        &lt;!-- 預設 action：使用者沒提供時的預設按鈕 --&gt;
        &lt;div style="padding: 12px 16px; border-top: 1px solid #f3f4f6;"&gt;
          &lt;button type="button" style="width:100%; padding:8px; background:#4f46e5; color:white; border:none; border-radius:6px; cursor:pointer;"&gt;
            加入購物車
          &lt;/button&gt;
        &lt;/div&gt;
      &lt;/slot&gt;
    \`

    // ── 在 JS 中偵測 slot 是否有內容 ──
    const descSlot = shadow.querySelector('slot[name="description"]') as HTMLSlotElement
    descSlot.addEventListener('slotchange', () =&gt; {
      const hasContent = descSlot.assignedNodes({ flatten: true }).length &gt; 0
      console.log('description slot has content:', hasContent)
    })
  }
}

customElements.define('product-card', ProductCard)
</book-code-block>

<book-callout variant="tip" title="Fallback 設計最佳實踐">
  <p>設計 Fallback 內容時，遵循三個原則：1）Fallback 應該是功能完整的，讓元件在沒有任何自訂內容的情況下也能正常使用；2）視覺上 Fallback 應該顯眼地表示「這裡需要內容」，例如使用虛線邊框或 placeholder 圖示；3）對於必要的 slot（如標題），考慮在 connectedCallback 中檢查並在沒有內容時發出警告。</p>
</book-callout>

<h2 id="ch04-s06">效能：為什麼在高頻渲染路徑中 Template 優於 innerHTML</h2>

<p>在元件需要頻繁重新渲染的場景中（如列表元件、無限滾動、即時更新的資料表格），渲染策略的選擇對效能影響顯著。<code>&lt;template&gt;</code> + <code>cloneNode()</code> 在高頻渲染場景中幾乎都優於 <code>innerHTML</code>，原因在於它們的底層機制不同。</p>

<book-code-block language="typescript" label="效能對比：Template vs innerHTML">
// ── 測試資料 ──
interface ListItem {
  id: string
  title: string
  subtitle: string
  status: 'active' | 'inactive' | 'pending'
}

// ── 方法一：innerHTML（每次重建整個 DOM 樹）──
function renderWithInnerHTML(container: HTMLElement, items: ListItem[]) {
  // 問題一：每次呼叫都強制解析 HTML 字串（字串 → DOM 樹）
  // 問題二：destroys all existing DOM，破壞焦點、選擇狀態、動畫
  // 問題三：所有 event listener 都被清除，需要重新綁定（或用 delegation）
  // 問題四：觸發大量 DOM mutation，導致 reflow/repaint

  container.innerHTML = items.map(item =&gt; \`
    &lt;div class="list-item list-item--\${item.status}" data-id="\${item.id}"&gt;
      &lt;strong class="title"&gt;\${item.title}&lt;/strong&gt;
      &lt;span class="subtitle"&gt;\${item.subtitle}&lt;/span&gt;
      &lt;span class="badge badge--\${item.status}"&gt;\${item.status}&lt;/span&gt;
    &lt;/div&gt;
  \`).join('')
  // ← 每次呼叫：完整 HTML 解析 + 完整 DOM 重建
}

// ── 方法二：Template + cloneNode（預先解析，只做 clone）──
const listItemTemplate = (() =&gt; {
  const t = document.createElement('template')
  t.innerHTML = \`
    &lt;div class="list-item"&gt;
      &lt;strong class="title"&gt;&lt;/strong&gt;
      &lt;span class="subtitle"&gt;&lt;/span&gt;
      &lt;span class="badge"&gt;&lt;/span&gt;
    &lt;/div&gt;
  \`
  return t
})()
// ← HTML 解析只發生一次（模組載入時）

function renderWithTemplate(container: HTMLElement, items: ListItem[]) {
  const fragment = document.createDocumentFragment()

  for (const item of items) {
    // cloneNode 比 HTML 解析快得多（記憶體中複製 DOM 樹）
    const clone = listItemTemplate.content.cloneNode(true) as DocumentFragment
    const div = clone.querySelector('.list-item') as HTMLDivElement
    const title = clone.querySelector('.title') as HTMLElement
    const subtitle = clone.querySelector('.subtitle') as HTMLElement
    const badge = clone.querySelector('.badge') as HTMLElement

    div.classList.add(\`list-item--\${item.status}\`)
    div.dataset.id = item.id
    title.textContent = item.title    // textContent 比 innerHTML 更安全、更快
    subtitle.textContent = item.subtitle
    badge.textContent = item.status
    badge.className = \`badge badge--\${item.status}\`

    fragment.appendChild(div)
  }

  // 清除舊內容
  container.textContent = ''
  // 一次性插入（只觸發一次 reflow）
  container.appendChild(fragment)
}

// ── 方法三：只更新變化的節點（最優，但需要 diff 邏輯）──
// 這是 Virtual DOM / Lit 的做法，詳見第 8 章

// ── 效能比較（100 個列表項目，每秒更新 10 次）──
// innerHTML：每次更新 ≈ 15-30ms（HTML 解析 + DOM 重建）
// template clone：每次更新 ≈ 3-8ms（只有 clone + 填值）
// incremental update：每次更新 ≈ 0.5-2ms（只更新差異）

// ── 何時 innerHTML 仍然合適 ──
// 1. 只執行一次的初始化渲染
// 2. 不需要維護 DOM 狀態（焦點、動畫等）的場景
// 3. 少量元素（&lt;10 個）的低頻更新
// 4. 開發原型、快速驗證
</book-code-block>

<div class="table-wrapper">
  <table>
    <thead>
      <tr>
        <th>渲染方式</th>
        <th>HTML 解析</th>
        <th>DOM 重建成本</th>
        <th>保留 DOM 狀態</th>
        <th>適用場景</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>innerHTML</td>
        <td>每次執行</td>
        <td>高（全量重建）</td>
        <td>❌ 清除</td>
        <td>一次性渲染、原型開發</td>
      </tr>
      <tr>
        <td>template + cloneNode</td>
        <td>只執行一次</td>
        <td>中（clone + 填值）</td>
        <td>❌ 清除</td>
        <td>列表渲染、重複元素</td>
      </tr>
      <tr>
        <td>直接 DOM 操作</td>
        <td>無</td>
        <td>低（命令式更新）</td>
        <td>✅ 保留</td>
        <td>局部更新、動畫狀態</td>
      </tr>
      <tr>
        <td>Tagged Template / Lit</td>
        <td>第一次執行</td>
        <td>低（只更新差異）</td>
        <td>✅ 保留</td>
        <td>高頻動態更新</td>
      </tr>
    </tbody>
  </table>
</div>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>&lt;template&gt; 是 DOM 的「模板工廠」，Slot 是元件的「內容插槽」——前者讓重複渲染效率提升，後者讓元件的使用者能夠決定顯示什麼，兩者合用構成了原生 Web Components 元件化的完整基礎。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch03">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">Shadow DOM — 真正的樣式與結構封裝</span>
    </a>
    <a class="footer-link" href="#ch05">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">ES Modules、Import Maps 與現代開發工具鏈</span>
    </a>
  </div>
</div>
`
