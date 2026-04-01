export const metadata = {
  id: 15,
  part: 3,
  title: 'Lit Labs 與周邊生態系',
  tags: ['Lit'] as string[],
  sections: [
    { slug: 'ch15-s01', title: '@lit/task — 帶有狀態管理的非同步資料抓取' },
    { slug: 'ch15-s02', title: '@lit/virtualizer — 大型列表的 Virtual Scrolling' },
    { slug: 'ch15-s03', title: 'Lit SSR 與 Declarative Shadow DOM' },
    { slug: 'ch15-s04', title: 'Lit 搭配 TypeScript Strict 模式：讓 Decorator 也型別安全' },
    { slug: 'ch15-s05', title: 'Storybook + Lit：元件驅動開發流程' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 15 · 第三部：Lit Framework — 更精簡、更慣用的寫法</div>
  <h1>Lit Labs 與周邊生態系</h1>
  <p>Lit 的官方生態系提供了許多解決常見問題的套件：<code>@lit/task</code> 優雅地處理非同步資料流，<code>@lit/virtualizer</code> 讓大型列表如絲般順滑，而 SSR 支援則讓 Lit 元件能在 Node.js 端預先渲染。本章帶你認識這些工具的核心用法。</p>
  <div class="chapter-tags">
    <span class="tag tag-lit">Lit</span>
  </div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch15-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">@lit/task — 帶有狀態管理的非同步資料抓取</span>
    </a>
    <a class="catalog-item" href="#ch15-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">@lit/virtualizer — 大型列表的 Virtual Scrolling</span>
    </a>
    <a class="catalog-item" href="#ch15-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">Lit SSR 與 Declarative Shadow DOM</span>
    </a>
    <a class="catalog-item" href="#ch15-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">Lit 搭配 TypeScript Strict 模式：讓 Decorator 也型別安全</span>
    </a>
    <a class="catalog-item" href="#ch15-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">Storybook + Lit：元件驅動開發流程</span>
    </a>
  </div>
</div>

<h2 id="ch15-s01">@lit/task — 帶有狀態管理的非同步資料抓取</h2>

<p><code>@lit/task</code> 是建立在 Reactive Controller 之上的非同步資料管理器，它自動處理 loading/error/success 三個狀態，並在依賴項（args）變更時自動重新執行任務。相比手動管理的 FetchController，它提供了更宣告式的 API。</p>

<book-code-block language="typescript" label="@lit/task 完整使用範例">
import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { Task, TaskStatus } from '@lit/task'

interface Post {
  id: number
  title: string
  body: string
  userId: number
}

@customElement('post-detail')
class PostDetail extends LitElement {
  static override styles = css\`
    :host { display: block; padding: 16px; }
    .loading { opacity: 0.6; }
    .error { color: #ef4444; border: 1px solid #ef4444; padding: 8px; border-radius: 4px; }
    .post { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
  \`

  @property({ type: Number }) postId = 1

  // Task 第一個泛型參數是 return type，第二個是 args tuple 型別
  private _postTask = new Task&lt;[number], Post&gt;(
    this,
    // 任務函式：回傳 Promise，args 來自下面的 args getter
    async ([id], { signal }) =&gt; {
      const res = await fetch(
        'https://jsonplaceholder.typicode.com/posts/' + id,
        { signal }  // 支援 AbortSignal，任務重新執行時自動取消上一次
      )
      if (!res.ok) throw new Error('HTTP ' + res.status)
      return res.json() as Promise&lt;Post&gt;
    },
    // args 函式：回傳依賴陣列，依賴變更時自動重新執行任務
    () =&gt; [this.postId] as [number]
  )

  override render() {
    // Task.render() 是一個方便的 switch-on-status helper
    return this._postTask.render({
      pending: () =&gt; html\`
        &lt;div class="loading"&gt;
          &lt;p&gt;載入貼文 #\${this.postId}...&lt;/p&gt;
        &lt;/div&gt;
      \`,
      error: (err) =&gt; html\`
        &lt;div class="error"&gt;
          &lt;p&gt;載入失敗：\${(err as Error).message}&lt;/p&gt;
          &lt;button @click=\${() =&gt; this._postTask.run()}&gt;重試&lt;/button&gt;
        &lt;/div&gt;
      \`,
      complete: (post) =&gt; html\`
        &lt;div class="post"&gt;
          &lt;h2&gt;\${post.title}&lt;/h2&gt;
          &lt;p&gt;\${post.body}&lt;/p&gt;
          &lt;small&gt;Post ID: \${post.id}&lt;/small&gt;
        &lt;/div&gt;
      \`,
      // initial：Task 尚未開始執行（args 為空時）
      initial: () =&gt; html\`&lt;p&gt;請選擇一篇貼文&lt;/p&gt;\`,
    })
  }
}

// 進階：Task 的狀態可以手動存取
// this._postTask.status: TaskStatus (INITIAL | PENDING | COMPLETE | ERROR)
// this._postTask.value: T | undefined（最後一次成功的值）
// this._postTask.error: unknown（最後一次的錯誤）
// this._postTask.run(...args): void（手動觸發執行）
</book-code-block>

<book-callout variant="tip" title="Task vs FetchController vs until Directive">
  <p><code>@lit/task</code> 比 <code>until</code> Directive 更強大，因為它自動處理取消（AbortSignal）、重試，以及 pending/error/complete 三個狀態的渲染分支。比自製 FetchController 更方便，因為它內建了型別完整的狀態機。推薦在需要完整狀態管理的非同步操作中使用。</p>
</book-callout>

<h2 id="ch15-s02">@lit/virtualizer — 大型列表的 Virtual Scrolling</h2>

<p>當你需要渲染幾千個列表項目時，一次性渲染所有 DOM 會嚴重影響效能。<code>@lit/virtualizer</code> 實作了 Virtual Scrolling（虛擬捲動）：只渲染視窗可見範圍內的 DOM 節點，其他的項目只佔據「空白高度」，大幅降低 DOM 數量。</p>

<book-code-block language="typescript" label="@lit/virtualizer 基本使用">
import { LitElement, html, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { virtualize } from '@lit-labs/virtualizer/virtualize.js'
import { LitVirtualizer } from '@lit-labs/virtualizer'

interface DataRow {
  id: number
  name: string
  email: string
  status: 'active' | 'inactive'
}

// 方式 1：使用 virtualize Directive（在現有 template 中使用）
@customElement('virtual-list')
class VirtualList extends LitElement {
  static override styles = css\`
    :host { display: block; height: 400px; overflow-y: auto; border: 1px solid #e5e7eb; }
    .row { display: grid; grid-template-columns: 1fr 2fr 1fr; padding: 12px; border-bottom: 1px solid #f3f4f6; }
    .row:hover { background: #f9fafb; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 0.75rem; }
    .active { background: #dcfce7; color: #166534; }
    .inactive { background: #fee2e2; color: #991b1b; }
  \`

  @state() private items: DataRow[] = Array.from({ length: 10000 }, (_, i) =&gt; ({
    id: i + 1,
    name: '使用者 ' + (i + 1),
    email: 'user' + (i + 1) + '@example.com',
    status: i % 3 === 0 ? 'inactive' : 'active',
  }))

  override render() {
    return html\`
      &lt;!-- virtualize Directive：只渲染可見的 items --&gt;
      \${virtualize({
        items: this.items,
        renderItem: (item: DataRow) =&gt; html\`
          &lt;div class="row" role="row"&gt;
            &lt;span&gt;#\${item.id} \${item.name}&lt;/span&gt;
            &lt;span&gt;\${item.email}&lt;/span&gt;
            &lt;span class="badge \${item.status}"&gt;\${item.status}&lt;/span&gt;
          &lt;/div&gt;
        \`,
        // scroller 指定捲動容器，預設使用最近的可捲動祖先
        scroller: true,
      })}
    \`
  }
}

// 方式 2：使用 &lt;lit-virtualizer&gt; 自訂元素（更宣告式）
// 需要先 import 以確保元素被定義
// import '@lit-labs/virtualizer'
//
// &lt;lit-virtualizer
//   .items=\${this.items}
//   .renderItem=\${(item) =&gt; html\`&lt;div&gt;\${item.name}&lt;/div&gt;\`}
//   style="height: 400px; overflow-y: auto;"
// &gt;&lt;/lit-virtualizer&gt;
</book-code-block>

<h2 id="ch15-s03">Lit SSR 與 Declarative Shadow DOM</h2>

<p>Lit 提供了伺服器端渲染（SSR）支援，讓元件可以在 Node.js 端預先渲染為 HTML 字串，改善首次內容繪製（FCP）時間。關鍵技術是 Declarative Shadow DOM（DSD），讓 Shadow Root 可以被序列化為 HTML。</p>

<h3>什麼是 Declarative Shadow DOM？</h3>

<p>一般的 Shadow DOM 只能用 JavaScript 建立。DSD 使用 <code>&lt;template shadowrootmode="open"&gt;</code> 語法，讓瀏覽器在解析 HTML 時就能建立 Shadow Root，不需要等待 JavaScript 執行。</p>

<book-code-block language="html" label="Declarative Shadow DOM HTML 語法">
&lt;!-- 伺服器端渲染輸出的 HTML 包含 DSD --&gt;
&lt;my-button&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;style&gt;
      button {
        background: var(--button-bg, #3b82f6);
        color: white;
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
      }
    &lt;/style&gt;
    &lt;button part="button"&gt;
      &lt;slot&gt;&lt;/slot&gt;
    &lt;/button&gt;
  &lt;/template&gt;
  &lt;!-- Light DOM 內容（slot 的預設內容）--&gt;
  確認送出
&lt;/my-button&gt;

&lt;!-- 瀏覽器解析到 &lt;template shadowrootmode&gt; 時，
     立刻建立 Shadow Root，不需等待 JS --&gt;
</book-code-block>

<book-code-block language="typescript" label="使用 @lit-labs/ssr 在 Node.js 中渲染">
// server.ts（Node.js Express 伺服器端）
import { render } from '@lit-labs/ssr'
import { collectResult } from '@lit-labs/ssr/lib/render-result.js'
import { html } from 'lit'

// 需要在 Node.js 環境中先模擬 DOM API
import { LitElement } from 'lit'
// Lit SSR 提供了 Node.js 端的 shim

async function renderPage(userId: string): Promise&lt;string&gt; {
  // html tag 在 Node.js 端產生可串流的 SSR 輸出
  const result = render(html\`
    &lt;!DOCTYPE html&gt;
    &lt;html&gt;
      &lt;head&gt;
        &lt;title&gt;Lit SSR Demo&lt;/title&gt;
        &lt;script type="module" src="/app.js"&gt;&lt;/script&gt;
      &lt;/head&gt;
      &lt;body&gt;
        &lt;app-header&gt;&lt;/app-header&gt;
        &lt;user-profile user-id="\${userId}"&gt;&lt;/user-profile&gt;
        &lt;app-footer&gt;&lt;/app-footer&gt;
      &lt;/body&gt;
    &lt;/html&gt;
  \`)

  // collectResult 將非同步的 iterable 串流收集為字串
  return collectResult(result)
}

// 在 Express 中使用
// app.get('/user/:id', async (req, res) =&gt; {
//   const html = await renderPage(req.params.id)
//   res.send(html)
// })
</book-code-block>

<book-callout variant="warning" title="SSR Hydration 注意事項">
  <p>Lit SSR 輸出的 HTML 包含 DSD，瀏覽器解析後立即顯示。當 Lit runtime 載入並執行時，元件會自動「Hydrate」——連接事件監聽器和響應式系統，而不重建 DOM。若 SSR 輸出和客戶端渲染結果不一致，會導致 Hydration mismatch。確保 render() 函式是純函式，相同的 props 總是產生相同的 HTML。</p>
</book-callout>

<h2 id="ch15-s04">Lit 搭配 TypeScript Strict 模式：讓 Decorator 也型別安全</h2>

<p>開啟 TypeScript strict 模式是提升程式碼品質的好習慣，但它與 Lit Decorators 有幾個需要注意的相容性問題。</p>

<book-code-block language="json" label="完整的 Lit + TypeScript Strict tsconfig.json">
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",

    "strict": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": false,

    "useDefineForClassFields": true,
    "experimentalDecorators": false,

    "skipLibCheck": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
</book-code-block>

<book-code-block language="typescript" label="Strict Mode 下的常見型別問題與解法">
import { LitElement, html, PropertyValues } from 'lit'
import { customElement, property, state, query } from 'lit/decorators.js'

@customElement('strict-demo')
class StrictDemo extends LitElement {
  // 問題 1：strictPropertyInitialization 要求所有 property 初始化
  // ✅ 解法：提供初始值或使用 !（確定賦值斷言）
  @property({ type: String }) label = ''                    // 給初始值
  @property({ type: Number }) count!: number               // 用 ! 斷言

  // 問題 2：@query 的 null 安全性
  // 在 firstUpdated 之前存取會得到 null
  @query('#btn') private btn: HTMLButtonElement | null = null  // 允許 null

  // 或者：只在確定存在時存取（在 firstUpdated / updated 中）
  @query('#title', true) private title!: HTMLElement  // 快取版本，! 斷言

  // 問題 3：事件型別安全
  private handleInput(e: Event) {
    // 使用 as 斷言（或 instanceof 檢查）
    const target = e.target as HTMLInputElement
    this.label = target.value
  }

  // 更安全的做法（避免 as）
  private handleInputSafe(e: Event) {
    if (!(e.target instanceof HTMLInputElement)) return
    this.label = e.target.value  // TypeScript 現在知道這是 HTMLInputElement
  }

  // 問題 4：PropertyValues 的 type 參數
  // 使用 this 確保 key 型別正確（TypeScript 4.9+ 的 satisfies 模式）
  override willUpdate(changed: PropertyValues&lt;this&gt;) {
    if (changed.has('label')) {
      // changed.get('label') 的型別正確推斷為 string
      const oldLabel = changed.get('label')
      console.log('label 從', oldLabel, '變為', this.label)
    }
  }

  override firstUpdated() {
    // 此時 btn 一定存在，但 TypeScript 還是推斷 btn 可能為 null
    this.btn?.focus()  // 使用可選鏈存取
    // 或者：this.btn!.focus()  使用 ! 斷言
  }

  override render() {
    return html\`
      &lt;h1 id="title"&gt;\${this.label}&lt;/h1&gt;
      &lt;button id="btn" @click=\${() =&gt; { this.count++ }}&gt;
        +
      &lt;/button&gt;
      &lt;input @input=\${this.handleInputSafe} value=\${this.label} /&gt;
    \`
  }
}

// 模組宣告合併：讓 querySelector 等函式有型別
declare global {
  interface HTMLElementTagNameMap {
    'strict-demo': StrictDemo
  }
}
</book-code-block>

<h2 id="ch15-s05">Storybook + Lit：元件驅動開發流程</h2>

<p>Storybook 是展示、測試和文件化 UI 元件的業界標準工具。Storybook 8 提供了官方的 Web Components Renderer，可以直接與 Lit 元件整合。</p>

<book-code-block language="typescript" label="Lit 元件的 Storybook Story 範例">
// button.stories.ts
import type { Meta, StoryObj } from '@storybook/web-components'
import { html } from 'lit'

// 確保元件被定義
import './app-button.js'

// Meta 物件定義 Story 的共用設定
const meta: Meta = {
  title: 'Components/AppButton',
  component: 'app-button',  // 對應自訂元素名稱
  tags: ['autodocs'],        // 自動產生 API 文件頁面

  // 定義可在 Storybook UI 中調整的 controls
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'outline', 'ghost'],
      description: '按鈕的視覺變體',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用按鈕',
    },
    label: {
      control: 'text',
      description: '按鈕文字',
    },
  },

  // 預設 args
  args: {
    variant: 'primary',
    disabled: false,
    label: '按我',
  },

  // 預設的渲染函式
  render: (args) =&gt; html\`
    &lt;app-button
      variant=\${args.variant}
      ?disabled=\${args.disabled}
    &gt;
      \${args.label}
    &lt;/app-button&gt;
  \`,
}
export default meta

type Story = StoryObj&lt;typeof meta&gt;

// 各種 Story 變體
export const Primary: Story = {
  args: { variant: 'primary', label: '主要按鈕' },
}

export const Outline: Story = {
  args: { variant: 'outline', label: '外框按鈕' },
}

export const Disabled: Story = {
  args: { disabled: true, label: '禁用按鈕' },
}

// 複合情境 Story
export const ButtonGroup: Story = {
  render: () =&gt; html\`
    &lt;div style="display: flex; gap: 8px;"&gt;
      &lt;app-button variant="primary"&gt;確認&lt;/app-button&gt;
      &lt;app-button variant="outline"&gt;取消&lt;/app-button&gt;
      &lt;app-button variant="ghost" disabled&gt;刪除&lt;/app-button&gt;
    &lt;/div&gt;
  \`,
}
</book-code-block>

<book-code-block language="json" label=".storybook/main.ts 的 Lit 相關設定">
{
  "stories": ["../src/**/*.stories.ts"],
  "addons": [
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "@chromatic-com/storybook"
  ],
  "framework": {
    "name": "@storybook/web-components-vite",
    "options": {}
  },
  "docs": {
    "autodocs": "tag"
  }
}
</book-code-block>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>Lit 生態系提供了從非同步資料（@lit/task）到大型列表（@lit/virtualizer）、SSR（@lit-labs/ssr）到元件文件化（Storybook）的完整解決方案，讓 Lit 不只是一個框架，而是一個可以支撐生產級應用的完整平台。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch14">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">Lit Context 與 Reactive Controllers</span>
    </a>
    <a class="footer-link" href="#ch16">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">原生 vs. Lit：模式對照翻譯手冊</span>
    </a>
  </div>
</div>
`
