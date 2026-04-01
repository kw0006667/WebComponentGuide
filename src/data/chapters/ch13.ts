export const metadata = {
  id: 13,
  part: 3,
  title: 'Lit Directives — 擴展 Template 引擎',
  tags: ['Lit', '進階'] as string[],
  sections: [
    { slug: 'ch13-s01', title: '內建 Directive：repeat、map、when、choose、classMap、styleMap' },
    { slug: 'ch13-s02', title: '有 Key 的 repeat 與 map 的效能差異' },
    { slug: 'ch13-s03', title: 'ref Directive：在需要時進行命令式 DOM 存取' },
    { slug: 'ch13-s04', title: 'live 與 until Directive 處理非同步內容' },
    { slug: 'ch13-s05', title: '撰寫自訂 Directive：AsyncDirective 的生命週期' },
    { slug: 'ch13-s06', title: 'cache Directive 用於昂貴的條件式渲染' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 13 · 第三部：Lit Framework — 更精簡、更慣用的寫法</div>
  <h1>Lit Directives — 擴展 Template 引擎</h1>
  <p>Directives 是 Lit Template 引擎的擴充點，允許你在 binding 位置插入特殊的渲染邏輯。從列表渲染、條件渲染到非同步資料，Lit 的內建 Directives 涵蓋了絕大多數常見場景，而自訂 Directive API 則讓你可以封裝任何命令式 DOM 操作。</p>
  <div class="chapter-tags">
    <span class="tag tag-lit">Lit</span>
    <span class="tag tag-advanced">進階</span>
  </div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch13-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">內建 Directive：repeat、map、when、choose、classMap、styleMap</span>
    </a>
    <a class="catalog-item" href="#ch13-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">有 Key 的 repeat 與 map 的效能差異</span>
    </a>
    <a class="catalog-item" href="#ch13-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">ref Directive：在需要時進行命令式 DOM 存取</span>
    </a>
    <a class="catalog-item" href="#ch13-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">live 與 until Directive 處理非同步內容</span>
    </a>
    <a class="catalog-item" href="#ch13-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">撰寫自訂 Directive：AsyncDirective 的生命週期</span>
    </a>
    <a class="catalog-item" href="#ch13-s06">
      <span class="catalog-item-num">06</span>
      <span class="catalog-item-title">cache Directive 用於昂貴的條件式渲染</span>
    </a>
  </div>
</div>

<h2 id="ch13-s01">內建 Directive：repeat、map、when、choose、classMap、styleMap</h2>

<p>Lit 提供了一組涵蓋最常見模板需求的內建 Directives。它們以 function 的形式呼叫，並放在 <code>html</code> template 的 binding 位置。</p>

<book-code-block language="typescript" label="所有主要內建 Directive 的使用範例">
import { LitElement, html, css } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { repeat } from 'lit/directives/repeat.js'
import { map } from 'lit/directives/map.js'
import { when } from 'lit/directives/when.js'
import { choose } from 'lit/directives/choose.js'
import { classMap } from 'lit/directives/class-map.js'
import { styleMap } from 'lit/directives/style-map.js'
import { ifDefined } from 'lit/directives/if-defined.js'

interface Task { id: string; title: string; done: boolean; priority: 'low' | 'medium' | 'high' }

@customElement('directive-showcase')
class DirectiveShowcase extends LitElement {
  static override styles = css\`
    .done { text-decoration: line-through; opacity: 0.5; }
    .priority-high { color: #ef4444; }
    .priority-medium { color: #f59e0b; }
    .priority-low { color: #6b7280; }
  \`

  @state() private tasks: Task[] = [
    { id: '1', title: '閱讀文件', done: true, priority: 'low' },
    { id: '2', title: '撰寫測試', done: false, priority: 'high' },
    { id: '3', title: '部署上線', done: false, priority: 'medium' },
  ]

  @state() private status: 'idle' | 'loading' | 'error' | 'success' = 'idle'
  @state() private progress = 75

  override render() {
    return html\`
      &lt;!-- repeat：有 key 的列表渲染（效能最佳）--&gt;
      &lt;ul&gt;
        \${repeat(
          this.tasks,
          task =&gt; task.id,   // keyFn：唯一鍵值
          task =&gt; html\`      // itemTemplate：每個項目的模板
            &lt;li class=\${classMap({
              done: task.done,
              ['priority-' + task.priority]: true,
            })}&gt;
              \${task.title}
            &lt;/li&gt;
          \`
        )}
      &lt;/ul&gt;

      &lt;!-- map：無 key 的簡單迭代（語法更簡潔）--&gt;
      &lt;ul&gt;
        \${map(this.tasks, task =&gt; html\`&lt;li&gt;\${task.title}&lt;/li&gt;\`)}
      &lt;/ul&gt;

      &lt;!-- when：二元條件渲染（true/false 分支）--&gt;
      \${when(
        this.tasks.length === 0,
        () =&gt; html\`&lt;p&gt;暫無任務&lt;/p&gt;\`,
        () =&gt; html\`&lt;p&gt;共 \${this.tasks.length} 個任務&lt;/p&gt;\`
      )}

      &lt;!-- choose：多分支條件渲染（類似 switch）--&gt;
      \${choose(this.status, [
        ['idle',    () =&gt; html\`&lt;p&gt;等待中&lt;/p&gt;\`],
        ['loading', () =&gt; html\`&lt;p&gt;載入中...&lt;/p&gt;\`],
        ['error',   () =&gt; html\`&lt;p class="error"&gt;發生錯誤&lt;/p&gt;\`],
        ['success', () =&gt; html\`&lt;p class="success"&gt;完成！&lt;/p&gt;\`],
      ])}

      &lt;!-- styleMap：動態 inline style（物件形式）--&gt;
      &lt;div style=\${styleMap({
        width: this.progress + '%',
        backgroundColor: this.progress &gt; 80 ? '#22c55e' : '#3b82f6',
        height: '8px',
        borderRadius: '4px',
        transition: 'width 0.3s ease',
      })}&gt;&lt;/div&gt;

      &lt;!-- ifDefined：只在值不是 undefined 時設定 attribute --&gt;
      &lt;input placeholder=\${ifDefined(this.tasks[0]?.title)} /&gt;
    \`
  }
}
</book-code-block>

<h2 id="ch13-s02">有 Key 的 repeat 與 map 的效能差異</h2>

<p><code>repeat</code> 和 <code>map</code> 都可以渲染列表，但它們在列表項目順序變更時的行為截然不同。選擇正確的工具對效能和使用者體驗有直接影響。</p>

<table>
  <thead>
    <tr><th>情境</th><th>map</th><th>repeat</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>列表排序/重排</td>
      <td>重建所有 DOM 節點</td>
      <td>移動現有 DOM 節點（保留狀態）</td>
    </tr>
    <tr>
      <td>列表中插入項目</td>
      <td>重建插入點之後的所有節點</td>
      <td>只建立新節點，移動其他節點</td>
    </tr>
    <tr>
      <td>有互動狀態的項目（focus、input value）</td>
      <td>狀態會遺失（DOM 重建）</td>
      <td>狀態保留（DOM 複用）</td>
    </tr>
    <tr>
      <td>靜態或很少重排的列表</td>
      <td>程式碼更簡潔，效能差異可忽略</td>
      <td>過度設計</td>
    </tr>
    <tr>
      <td>大型列表（100+ 項）且頻繁重排</td>
      <td>效能問題明顯</td>
      <td>顯著效能優勢</td>
    </tr>
  </tbody>
</table>

<book-code-block language="typescript" label="repeat vs map 的效能差異示範">
import { LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { repeat } from 'lit/directives/repeat.js'

interface Item { id: number; value: string }

@customElement('sort-demo')
class SortDemo extends LitElement {
  @state() private items: Item[] = [
    { id: 1, value: 'Alpha' },
    { id: 2, value: 'Beta' },
    { id: 3, value: 'Gamma' },
  ]

  // 重排後，map 版本會重建所有 DOM，
  // 如果 li 內有 input，使用者正在輸入的值會消失
  private renderWithMap() {
    return html\`
      &lt;ul id="map-list"&gt;
        \${this.items.map(item =&gt; html\`
          &lt;li&gt;
            &lt;input value=\${item.value} /&gt;  &lt;!-- 重排後 input 狀態丟失 --&gt;
          &lt;/li&gt;
        \`)}
      &lt;/ul&gt;
    \`
  }

  // 重排後，repeat 只移動 DOM 節點，input 的值和 focus 狀態都保留
  private renderWithRepeat() {
    return html\`
      &lt;ul id="repeat-list"&gt;
        \${repeat(
          this.items,
          item =&gt; item.id,  // 以 id 作為 key，確保 DOM 節點與資料正確對應
          item =&gt; html\`
            &lt;li&gt;
              &lt;input value=\${item.value} /&gt;  &lt;!-- 重排後 input 狀態保留 --&gt;
            &lt;/li&gt;
          \`
        )}
      &lt;/ul&gt;
    \`
  }

  private shuffle() {
    // 打亂順序，觸發重排
    this.items = [...this.items].sort(() =&gt; Math.random() - 0.5)
  }

  override render() {
    return html\`
      &lt;button @click=\${this.shuffle}&gt;打亂順序&lt;/button&gt;
      \${this.renderWithMap()}
      \${this.renderWithRepeat()}
    \`
  }
}
</book-code-block>

<h2 id="ch13-s03">ref Directive：在需要時進行命令式 DOM 存取</h2>

<p><code>ref</code> Directive 提供了另一種存取 Shadow DOM 元素的方式，特別適合動態建立的元素，或需要在 render 函式中直接取得元素引用的場景。</p>

<book-code-block language="typescript" label="ref Directive 的兩種使用模式">
import { LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { ref, createRef, Ref } from 'lit/directives/ref.js'

@customElement('ref-demo')
class RefDemo extends LitElement {
  // 模式 1：createRef() — 建立一個引用容器物件
  private inputRef: Ref&lt;HTMLInputElement&gt; = createRef()
  private canvasRef: Ref&lt;HTMLCanvasElement&gt; = createRef()

  override firstUpdated() {
    // 首次渲染後，inputRef.value 指向對應的 DOM 元素
    this.inputRef.value?.focus()
    this.initCanvas()
  }

  private initCanvas() {
    const canvas = this.canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(10, 10, 100, 50)
    ctx.fillStyle = 'white'
    ctx.font = '16px sans-serif'
    ctx.fillText('Canvas!', 30, 40)
  }

  // 模式 2：callback ref — 每次元素掛載/卸載時呼叫
  private handleVideoRef = (el: Element | undefined) =&gt; {
    if (el instanceof HTMLVideoElement) {
      // 元素掛載時執行初始化
      el.play().catch(() =&gt; { /* autoplay 可能被阻止 */ })
    } else {
      // el 為 undefined 表示元素已卸載，可在此清理資源
    }
  }

  @state() private showVideo = false

  override render() {
    return html\`
      &lt;!-- 模式 1：createRef --&gt;
      &lt;input \${ref(this.inputRef)} type="text" placeholder="自動聚焦" /&gt;
      &lt;canvas \${ref(this.canvasRef)} width="200" height="100"&gt;&lt;/canvas&gt;

      &lt;!-- 模式 2：callback ref — 動態元素的初始化 --&gt;
      &lt;button @click=\${() =&gt; { this.showVideo = !this.showVideo }}&gt;
        \${this.showVideo ? '隱藏' : '顯示'} 影片
      &lt;/button&gt;
      \${this.showVideo
        ? html\`&lt;video \${ref(this.handleVideoRef)} src="/demo.mp4" muted&gt;&lt;/video&gt;\`
        : null
      }
    \`
  }
}
</book-code-block>

<book-callout variant="tip" title="ref vs @query">
  <p><code>@query</code> 更適合靜態的、固定存在的元素；<code>ref</code> 更適合動態建立/銷毀的元素，或需要在 render 函式內直接操作的場景。Callback ref 的一大優勢是會在元素卸載時（el 為 undefined）通知你，讓你能夠清理資源。</p>
</book-callout>

<h2 id="ch13-s04">live 與 until Directive 處理非同步內容</h2>

<book-code-block language="typescript" label="live 與 until Directive">
import { LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { live } from 'lit/directives/live.js'
import { until } from 'lit/directives/until.js'

@customElement('async-demo')
class AsyncDemo extends LitElement {
  @state() private inputValue = 'initial'
  @state() private userDataPromise: Promise&lt;{ name: string }&gt; | null = null

  // live Directive：解決「受控輸入」的同步問題
  // 問題：如果 this.inputValue 沒有變化，Lit 不會更新 attribute binding，
  //        但使用者可能已在 input 中輸入了不同的值。
  // live() 會在每次渲染時都比對 DOM 的當前值和新值，確保兩者一致。
  private renderLiveInput() {
    return html\`
      &lt;!-- 沒有 live：如果 inputValue 沒變，即使使用者輸入了內容，
           Lit 也不會把 attribute 寫回去，造成「失控」的 input --&gt;
      &lt;input value=\${this.inputValue}
             @input=\${(e: InputEvent) =&gt; {
               this.inputValue = (e.target as HTMLInputElement).value
             }} /&gt;

      &lt;!-- 有 live：每次渲染都會比對 DOM 實際值，
           適合需要強制重設 input 值的情境（例如清空表單）--&gt;
      &lt;input .value=\${live(this.inputValue)}
             @input=\${(e: InputEvent) =&gt; {
               this.inputValue = (e.target as HTMLInputElement).value
             }} /&gt;
    \`
  }

  // until Directive：處理 Promise 的非同步渲染
  // 第一個參數是 Promise，後續參數是 Promise 解析前的 placeholder
  private fetchUser(id: string) {
    this.userDataPromise = fetch('/api/users/' + id).then(r =&gt; r.json())
  }

  override render() {
    return html\`
      \${this.renderLiveInput()}

      &lt;button @click=\${() =&gt; this.fetchUser('42')}&gt;載入使用者&lt;/button&gt;

      &lt;!-- until 接受任意數量的參數，按照優先順序從左到右 --&gt;
      &lt;!-- Promise 解析前顯示 loading，解析後顯示 user 資料 --&gt;
      \${until(
        this.userDataPromise?.then(user =&gt; html\`
          &lt;div class="user-card"&gt;
            &lt;h3&gt;\${user.name}&lt;/h3&gt;
          &lt;/div&gt;
        \`),
        html\`&lt;div class="skeleton"&gt;載入中...&lt;/div&gt;\`
      )}
    \`
  }
}
</book-code-block>

<h2 id="ch13-s05">撰寫自訂 Directive：AsyncDirective 的生命週期</h2>

<p>當內建 Directive 無法滿足需求時，你可以建立自訂 Directive。<code>AsyncDirective</code> 是比基礎 <code>Directive</code> 更強大的版本，它有完整的生命週期，可以管理訂閱、計時器等非同步資源。</p>

<book-code-block language="typescript" label="自訂 AsyncDirective：即時時鐘">
import { AsyncDirective, directive } from 'lit/async-directive.js'
import { DirectiveParameters, ElementPart, PartInfo, PartType } from 'lit/directive.js'
import { html } from 'lit'

class LiveClockDirective extends AsyncDirective {
  private _timerId?: ReturnType&lt;typeof setInterval&gt;
  private _format: 'time' | 'datetime'

  constructor(partInfo: PartInfo) {
    super(partInfo)
    // 確保這個 directive 只用在 child binding 位置
    if (partInfo.type !== PartType.CHILD) {
      throw new Error('LiveClockDirective 只能用在 child binding')
    }
    this._format = 'time'
  }

  // render 在每次 directive 被呼叫時執行
  // 它回傳要渲染到 binding 位置的值
  override render(format: 'time' | 'datetime' = 'time') {
    this._format = format

    if (!this._timerId) {
      this._startTimer()
    }
    return this._getFormattedTime()
  }

  private _startTimer() {
    this._timerId = setInterval(() =&gt; {
      // setValue 是 AsyncDirective 的核心方法
      // 呼叫它可以在 directive 外部觸發 DOM 更新
      this.setValue(this._getFormattedTime())
    }, 1000)
  }

  private _getFormattedTime(): string {
    const now = new Date()
    if (this._format === 'datetime') {
      return now.toLocaleString('zh-TW')
    }
    return now.toLocaleTimeString('zh-TW')
  }

  // disconnected：元素從 DOM 移除時呼叫（停止計時器）
  override disconnected() {
    clearInterval(this._timerId)
    this._timerId = undefined
  }

  // reconnected：元素重新插入 DOM 時呼叫（重啟計時器）
  override reconnected() {
    this._startTimer()
  }
}

// 建立 directive factory function
const liveClock = directive(LiveClockDirective)

// 在元件中使用
import { LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('clock-widget')
class ClockWidget extends LitElement {
  override render() {
    return html\`
      &lt;p&gt;現在時間：\${liveClock('time')}&lt;/p&gt;
      &lt;p&gt;日期時間：\${liveClock('datetime')}&lt;/p&gt;
    \`
  }
}
</book-code-block>

<h2 id="ch13-s06">cache Directive 用於昂貴的條件式渲染</h2>

<p>預設情況下，Lit 在條件式渲染切換時（例如 <code>condition ? html\`A\` : html\`B\`</code>）會銷毀隱藏的 DOM 並重建顯示的 DOM。<code>cache</code> Directive 讓被隱藏的 TemplateResult 的 DOM 保留在記憶體中，再次顯示時直接恢復，避免昂貴的重建成本。</p>

<book-code-block language="typescript" label="cache Directive：保留 DOM 狀態">
import { LitElement, html, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { cache } from 'lit/directives/cache.js'

@customElement('tabbed-view')
class TabbedView extends LitElement {
  static override styles = css\`
    .tab-btn { padding: 8px 16px; cursor: pointer; }
    .tab-btn.active { border-bottom: 2px solid #3b82f6; }
  \`

  @state() private activeTab: 'list' | 'chart' | 'settings' = 'list'

  // 假設這些是昂貴的 template（例如包含大型 table 或 canvas）
  private listTemplate() {
    return html\`
      &lt;div class="list-view"&gt;
        &lt;!-- 假設有 1000 行資料 --&gt;
        &lt;p&gt;列表視圖（DOM 被 cache 保留，切換時不重建）&lt;/p&gt;
        &lt;input placeholder="搜尋..." /&gt;  &lt;!-- input 狀態被保留 --&gt;
      &lt;/div&gt;
    \`
  }

  private chartTemplate() {
    return html\`
      &lt;div class="chart-view"&gt;
        &lt;canvas width="400" height="300"&gt;&lt;/canvas&gt;  &lt;!-- canvas 繪圖狀態被保留 --&gt;
        &lt;p&gt;圖表視圖&lt;/p&gt;
      &lt;/div&gt;
    \`
  }

  private settingsTemplate() {
    return html\`
      &lt;div class="settings-view"&gt;
        &lt;input type="checkbox" /&gt; 啟用通知
        &lt;p&gt;設定視圖&lt;/p&gt;
      &lt;/div&gt;
    \`
  }

  override render() {
    return html\`
      &lt;div class="tabs"&gt;
        &lt;button class=\${this.activeTab === 'list' ? 'tab-btn active' : 'tab-btn'}
                @click=\${() =&gt; { this.activeTab = 'list' }}&gt;列表&lt;/button&gt;
        &lt;button class=\${this.activeTab === 'chart' ? 'tab-btn active' : 'tab-btn'}
                @click=\${() =&gt; { this.activeTab = 'chart' }}&gt;圖表&lt;/button&gt;
        &lt;button class=\${this.activeTab === 'settings' ? 'tab-btn active' : 'tab-btn'}
                @click=\${() =&gt; { this.activeTab = 'settings' }}&gt;設定&lt;/button&gt;
      &lt;/div&gt;

      &lt;!-- cache 讓被隱藏的 tab 的 DOM 保留在記憶體 --&gt;
      &lt;!-- 在 list/chart 之間切換時，input 的搜尋值和 canvas 的繪製內容都會被保留 --&gt;
      \${cache(
        this.activeTab === 'list'     ? this.listTemplate()     :
        this.activeTab === 'chart'    ? this.chartTemplate()    :
                                        this.settingsTemplate()
      )}
    \`
  }
}
</book-code-block>

<book-callout variant="warning" title="cache 的記憶體成本">
  <p><code>cache</code> 用記憶體換取效能——被隱藏的 DOM 仍然存在於記憶體中。對於包含大量 DOM 節點的複雜 template，這可能造成顯著的記憶體佔用。建議只在 DOM 重建確實是效能瓶頸，且 template 的 DOM 節點數量在合理範圍內時才使用 <code>cache</code>。</p>
</book-callout>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>需要有狀態的列表排序用 <code>repeat</code>，需要 DOM 引用用 <code>ref</code>，需要非同步資料用 <code>until</code>，需要保留 DOM 狀態的切換用 <code>cache</code>，需要封裝命令式操作就寫自訂 <code>AsyncDirective</code>。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch12">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">Lit Decorators 與 Reactive Properties</span>
    </a>
    <a class="footer-link" href="#ch14">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">Lit Context 與 Reactive Controllers</span>
    </a>
  </div>
</div>
`
