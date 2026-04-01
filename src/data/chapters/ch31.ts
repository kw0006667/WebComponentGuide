export const metadata = {
  id: 31,
  part: 7,
  title: '四個端到端專案實作',
  tags: ['專案實作'] as string[],
  sections: [
    { slug: 'ch31-s01', title: '專案 A：<data-table> — 支援排序、篩選、分頁的資料表' },
    { slug: 'ch31-s02', title: '專案 B：<toast-manager> — Portal 式通知系統，含動畫效果' },
    { slug: 'ch31-s03', title: '專案 C：<multi-step-form> — 完整整合 FACE API 與表單驗證' },
    { slug: 'ch31-s04', title: '專案 D：Dashboard Shell 採 Micro-frontend 架構' },
    { slug: 'ch31-s05', title: '每個專案：原生 → Lit 重構 → 發布為 npm 套件' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 31 · 第七部：真實世界專案與面試完全攻略</div>
  <h1>四個端到端專案實作</h1>
  <p>理論在真實專案中才能轉化為能力。本章透過四個完整的端到端專案——支援完整功能的資料表、Portal 式通知系統、整合 FACE API 的多步驟表單、以及 Micro-frontend Dashboard Shell——將本書前 30 章的所有知識融匯貫通。每個專案均提供 <strong>Lit Framework</strong> 與<strong>原生 Web Component</strong> 兩種實作版本，讓你直接對比兩者在宣告式模板、響應式狀態、裝飾器等面向的具體差異，並展示從原生實作到 Lit 重構再到發布 npm 套件的完整旅程。</p>
  <div class="chapter-tags"><span class="tag tag-project">專案實作</span></div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch31-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">專案 A：&lt;data-table&gt; — 支援排序、篩選、分頁的資料表</span>
    </a>
    <a class="catalog-item" href="#ch31-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">專案 B：&lt;toast-manager&gt; — Portal 式通知系統，含動畫效果</span>
    </a>
    <a class="catalog-item" href="#ch31-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">專案 C：&lt;multi-step-form&gt; — 完整整合 FACE API 與表單驗證</span>
    </a>
    <a class="catalog-item" href="#ch31-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">專案 D：Dashboard Shell 採 Micro-frontend 架構</span>
    </a>
    <a class="catalog-item" href="#ch31-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">每個專案：原生 → Lit 重構 → 發布為 npm 套件</span>
    </a>
  </div>
</div>

<h2 id="ch31-s01">專案 A：&lt;data-table&gt; — 支援排序、篩選、分頁的資料表</h2>

<p>資料表是企業應用中最複雜的 UI 元件之一。我們的 <code>&lt;data-table&gt;</code> 支援欄位定義、排序、用戶端篩選與分頁，並以 Lit 的響應式系統確保大資料集下的效能。</p>

<book-code-block language="typescript" label="TypeScript — data-table.ts（完整 Lit 實作）">
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { classMap } from 'lit/directives/class-map.js';

export interface Column&lt;T = Record&lt;string, unknown&gt;&gt; {
  key: keyof T &amp; string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: T) =&gt; unknown;
}

export interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

/**
 * @element data-table
 * @fires sort-change - 排序改變時觸發
 * @fires page-change - 頁碼改變時觸發
 */
@customElement('data-table')
export class DataTable extends LitElement {
  @property({ type: Array }) columns: Column[] = [];
  @property({ type: Array }) data: Record&lt;string, unknown&gt;[] = [];
  @property({ type: Number }) pageSize = 10;
  @property({ type: String }) rowKey = 'id';

  @state() private sortState: SortState | null = null;
  @state() private filterText = '';
  @state() private currentPage = 1;

  static styles = css\`
    :host { display: block; font-family: inherit; }
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      gap: 12px;
    }
    .search-input {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 14px;
      width: 240px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th, td {
      padding: 10px 16px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
      user-select: none;
    }
    th.sortable { cursor: pointer; }
    th.sortable:hover { background: #f1f5f9; }
    th .sort-icon { margin-left: 4px; opacity: 0.4; }
    th.sort-asc .sort-icon, th.sort-desc .sort-icon { opacity: 1; }
    tr:hover td { background: #f8fafc; }
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      font-size: 14px;
      color: #64748b;
    }
    .pagination-controls { display: flex; gap: 4px; }
    .page-btn {
      padding: 4px 10px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 13px;
    }
    .page-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .empty { text-align: center; padding: 40px; color: #94a3b8; }
  \`;

  // 計算屬性：篩選後的資料
  private get filteredData() {
    if (!this.filterText) return this.data;
    const q = this.filterText.toLowerCase();
    return this.data.filter(row =&gt;
      Object.values(row).some(v =&gt; String(v).toLowerCase().includes(q))
    );
  }

  // 計算屬性：排序後的資料
  private get sortedData() {
    if (!this.sortState) return this.filteredData;
    const { key, direction } = this.sortState;
    return [...this.filteredData].sort((a, b) =&gt; {
      const av = a[key]; const bv = b[key];
      const cmp = av &lt; bv ? -1 : av &gt; bv ? 1 : 0;
      return direction === 'asc' ? cmp : -cmp;
    });
  }

  // 計算屬性：分頁後的資料
  private get pagedData() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.sortedData.slice(start, start + this.pageSize);
  }

  private get totalPages() {
    return Math.ceil(this.sortedData.length / this.pageSize);
  }

  private handleSort(col: Column) {
    if (!col.sortable) return;
    if (this.sortState?.key === col.key) {
      this.sortState = { key: col.key, direction: this.sortState.direction === 'asc' ? 'desc' : 'asc' };
    } else {
      this.sortState = { key: col.key, direction: 'asc' };
    }
    this.currentPage = 1;
    this.dispatchEvent(new CustomEvent('sort-change', {
      detail: this.sortState, bubbles: true, composed: true,
    }));
  }

  private handleFilter(e: Event) {
    this.filterText = (e.target as HTMLInputElement).value;
    this.currentPage = 1;
  }

  private goToPage(page: number) {
    this.currentPage = page;
    this.dispatchEvent(new CustomEvent('page-change', {
      detail: { page }, bubbles: true, composed: true,
    }));
  }

  private renderSortIcon(col: Column) {
    if (!col.sortable) return nothing;
    if (this.sortState?.key === col.key) {
      return html\`&lt;span class="sort-icon"&gt;\${this.sortState.direction === 'asc' ? '↑' : '↓'}&lt;/span&gt;\`;
    }
    return html\`&lt;span class="sort-icon"&gt;↕&lt;/span&gt;\`;
  }

  render() {
    const { pagedData, totalPages, sortedData, currentPage, pageSize } = this;
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, sortedData.length);

    return html\`
      &lt;div class="toolbar"&gt;
        &lt;input
          class="search-input"
          type="search"
          placeholder="搜尋..."
          .value=\${this.filterText}
          @input=\${this.handleFilter}
        &gt;
        &lt;span&gt;共 \${sortedData.length} 筆&lt;/span&gt;
      &lt;/div&gt;

      &lt;table&gt;
        &lt;thead&gt;
          &lt;tr&gt;
            \${this.columns.map(col =&gt; html\`
              &lt;th
                class=\${classMap({
                  sortable: !!col.sortable,
                  'sort-asc': this.sortState?.key === col.key &amp;&amp; this.sortState.direction === 'asc',
                  'sort-desc': this.sortState?.key === col.key &amp;&amp; this.sortState.direction === 'desc',
                })}
                style=\${col.width ? \`width:\${col.width}\` : ''}
                @click=\${() =&gt; this.handleSort(col)}
              &gt;
                \${col.label}\${this.renderSortIcon(col)}
              &lt;/th&gt;
            \`)}
          &lt;/tr&gt;
        &lt;/thead&gt;
        &lt;tbody&gt;
          \${pagedData.length === 0
            ? html\`&lt;tr&gt;&lt;td colspan=\${this.columns.length} class="empty"&gt;無資料&lt;/td&gt;&lt;/tr&gt;\`
            : repeat(
                pagedData,
                row =&gt; row[this.rowKey],
                row =&gt; html\`
                  &lt;tr&gt;
                    \${this.columns.map(col =&gt; html\`
                      &lt;td&gt;\${col.render ? col.render(row[col.key], row) : row[col.key]}&lt;/td&gt;
                    \`)}
                  &lt;/tr&gt;
                \`
              )
          }
        &lt;/tbody&gt;
      &lt;/table&gt;

      &lt;div class="pagination"&gt;
        &lt;span&gt;\${start}–\${end} / \${sortedData.length}&lt;/span&gt;
        &lt;div class="pagination-controls"&gt;
          &lt;button class="page-btn" ?disabled=\${currentPage === 1} @click=\${() =&gt; this.goToPage(1)}&gt;«&lt;/button&gt;
          &lt;button class="page-btn" ?disabled=\${currentPage === 1} @click=\${() =&gt; this.goToPage(currentPage - 1)}&gt;‹&lt;/button&gt;
          \${Array.from({ length: Math.min(5, totalPages) }, (_, i) =&gt; {
            const page = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
            return html\`
              &lt;button
                class=\${classMap({ 'page-btn': true, active: page === currentPage })}
                @click=\${() =&gt; this.goToPage(page)}
              &gt;\${page}&lt;/button&gt;
            \`;
          })}
          &lt;button class="page-btn" ?disabled=\${currentPage === totalPages} @click=\${() =&gt; this.goToPage(currentPage + 1)}&gt;›&lt;/button&gt;
          &lt;button class="page-btn" ?disabled=\${currentPage === totalPages} @click=\${() =&gt; this.goToPage(totalPages)}&gt;»&lt;/button&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    \`;
  }
}
</book-code-block>

<p>以下是等效的<strong>原生 Web Component</strong>版本。對比兩者可以清楚看到 Lit 幫我們抽象掉了什麼。</p>

<book-code-block language="typescript" label="TypeScript — data-table.ts（原生 Web Component 版本）">
// ===== 對比要點 =====
// 1. 無響應式系統 → 狀態變更需手動呼叫 _render()
// 2. 無 html\`\` → 使用 innerHTML 字串拼接（需自行防護 XSS）
// 3. 無 @property/@state 裝飾器 → getter/setter + observedAttributes + attributeChangedCallback
// 4. 無 repeat/classMap 指令 → Array.map().join('') + 條件字串
// 5. 每次渲染重建整個 Shadow DOM → 需重新綁定所有事件監聽器

export interface Column&lt;T = Record&lt;string, unknown&gt;&gt; {
  key: keyof T &amp; string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: T) =&gt; unknown;
}

export interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

class DataTableWC extends HTMLElement {
  private _columns: Column[] = [];
  private _data: Record&lt;string, unknown&gt;[] = [];
  private _pageSize = 10;
  private _rowKey = 'id';
  private _sortState: SortState | null = null;
  private _filterText = '';
  private _currentPage = 1;
  private shadow: ShadowRoot;

  // Lit 用 @customElement() 裝飾器自動呼叫 customElements.define()
  // 原生需要在類別外手動呼叫

  // Lit 的 @property() 裝飾器自動連結 attribute ↔ property；
  // 原生需要三件事同時到位：observedAttributes + attributeChangedCallback + getter/setter
  static observedAttributes = ['page-size', 'row-key'];

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  // getter/setter 取代 Lit 的 @property()（property 部分）
  get columns() { return this._columns; }
  set columns(v: Column[]) { this._columns = v; this._render(); }

  get data() { return this._data; }
  set data(v: Record&lt;string, unknown&gt;[]) { this._data = v; this._currentPage = 1; this._render(); }

  get pageSize() { return this._pageSize; }
  set pageSize(v: number) { this._pageSize = v; this._render(); }

  // getter/setter 取代 Lit 的 @property()（attribute 部分）
  // Lit 的 type: Number 選項自動做字串轉型；原生需手動處理
  attributeChangedCallback(name: string, _: string | null, value: string) {
    if (name === 'page-size') this._pageSize = Number(value) || 10;
    if (name === 'row-key')   this._rowKey   = value ?? 'id';
    this._render();
  }

  // Lit 的 render() 在每次響應式屬性更新後自動排程執行；
  // 原生的 connectedCallback 只在插入 DOM 時觸發，其餘需手動呼叫 _render()
  connectedCallback() { this._render(); }

  // 以下計算邏輯與 Lit 版完全相同
  private get filteredData() {
    if (!this._filterText) return this._data;
    const q = this._filterText.toLowerCase();
    return this._data.filter(row =&gt;
      Object.values(row).some(v =&gt; String(v).toLowerCase().includes(q))
    );
  }

  private get sortedData() {
    if (!this._sortState) return this.filteredData;
    const { key, direction } = this._sortState;
    return [...this.filteredData].sort((a, b) =&gt; {
      const av = a[key], bv = b[key];
      const cmp = av &lt; bv ? -1 : av &gt; bv ? 1 : 0;
      return direction === 'asc' ? cmp : -cmp;
    });
  }

  private get pagedData() {
    const start = (this._currentPage - 1) * this._pageSize;
    return this.sortedData.slice(start, start + this._pageSize);
  }

  // Lit 版回傳 TemplateResult，由框架做高效 DOM diffing；
  // 原生版每次都完整重建整個 innerHTML（效能較差，可用 DOM diffing 函式庫改善）
  private _render() {
    const sorted = this.sortedData;
    const paged  = this.pagedData;
    const total  = Math.ceil(sorted.length / this._pageSize) || 1;
    const start  = (this._currentPage - 1) * this._pageSize + 1;
    const end    = Math.min(this._currentPage * this._pageSize, sorted.length);

    // Array.map().join('') 取代 Lit 的 repeat 指令
    // 條件字串取代 Lit 的 classMap 指令
    const thead = this._columns.map(col =&gt; {
      const active = this._sortState?.key === col.key;
      const icon   = col.sortable
        ? (active ? (this._sortState!.direction === 'asc' ? '↑' : '↓') : '↕') : '';
      const cls    = [col.sortable &amp;&amp; 'sortable', active &amp;&amp; 'sort-' + this._sortState!.direction]
                       .filter(Boolean).join(' ');
      return '&lt;th class="' + cls + '"'
           + (col.width ? ' style="width:' + col.width + '"' : '')
           + (col.sortable ? ' data-key="' + col.key + '"' : '') + '&gt;'
           + col.label + (icon ? '&lt;span class="sort-icon"&gt;' + icon + '&lt;/span&gt;' : '')
           + '&lt;/th&gt;';
    }).join('');

    const tbody = paged.length === 0
      ? '&lt;tr&gt;&lt;td colspan="' + this._columns.length + '" class="empty"&gt;無資料&lt;/td&gt;&lt;/tr&gt;'
      : paged.map(row =&gt;
          '&lt;tr&gt;' + this._columns.map(col =&gt; {
            // 注意：col.render 結果或 String() 轉換不做 XSS 跳脫
            // Lit 的 html\`\` 模板會自動跳脫，原生必須手動處理
            const val = col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '');
            return '&lt;td&gt;' + val + '&lt;/td&gt;';
          }).join('') + '&lt;/tr&gt;'
        ).join('');

    const pageNums = Array.from({ length: Math.min(5, total) }, (_, i) =&gt; {
      const page = Math.max(1, Math.min(this._currentPage - 2, total - 4)) + i;
      return '&lt;button class="page-btn' + (page === this._currentPage ? ' active' : '')
           + '" data-page="' + page + '"&gt;' + page + '&lt;/button&gt;';
    }).join('');

    const dis1 = this._currentPage === 1     ? ' disabled' : '';
    const disN = this._currentPage === total ? ' disabled' : '';

    // Shadow DOM 樣式：Lit 用 static styles = css\`\`（只建立一次）；
    // 原生每次 innerHTML 替換都重新注入 &lt;style&gt;（效能較差）
    this.shadow.innerHTML =
      '&lt;style&gt;'
    + ':host { display: block; font-family: inherit; }'
    + '/* ... CSS 規則與 Lit 版 static styles 完全相同 ... */'
    + '&lt;/style&gt;'
    + '&lt;div class="toolbar"&gt;'
    +   '&lt;input class="search-input" type="search" placeholder="搜尋..." value="' + this._filterText + '"&gt;'
    +   '&lt;span&gt;共 ' + sorted.length + ' 筆&lt;/span&gt;'
    + '&lt;/div&gt;'
    + '&lt;table&gt;&lt;thead&gt;&lt;tr&gt;' + thead + '&lt;/tr&gt;&lt;/thead&gt;&lt;tbody&gt;' + tbody + '&lt;/tbody&gt;&lt;/table&gt;'
    + '&lt;div class="pagination"&gt;'
    +   '&lt;span&gt;' + start + '–' + end + ' / ' + sorted.length + '&lt;/span&gt;'
    +   '&lt;div class="pagination-controls"&gt;'
    +     '&lt;button class="page-btn" data-page="1"' + dis1 + '&gt;«&lt;/button&gt;'
    +     '&lt;button class="page-btn" data-page="' + (this._currentPage - 1) + '"' + dis1 + '&gt;‹&lt;/button&gt;'
    +     pageNums
    +     '&lt;button class="page-btn" data-page="' + (this._currentPage + 1) + '"' + disN + '&gt;›&lt;/button&gt;'
    +     '&lt;button class="page-btn" data-page="' + total + '"' + disN + '&gt;»&lt;/button&gt;'
    +   '&lt;/div&gt;'
    + '&lt;/div&gt;';

    // ===== 事件綁定 =====
    // innerHTML 重建後所有 DOM 節點都是全新建立的，原有的事件監聽器已消失
    // Lit 的 html\`\` 模板做 DOM diffing，節點保留，事件自動保持
    this.shadow.querySelector('.search-input')!.addEventListener('input', e =&gt; {
      this._filterText = (e.target as HTMLInputElement).value;
      this._currentPage = 1;
      this._render();
    });

    this.shadow.querySelectorAll&lt;HTMLElement&gt;('[data-key]').forEach(th =&gt; {
      const key = th.dataset.key;
      if (!key) return;
      th.addEventListener('click', () =&gt; {
        this._sortState = this._sortState?.key === key
          ? { key, direction: this._sortState.direction === 'asc' ? 'desc' : 'asc' }
          : { key, direction: 'asc' };
        this._currentPage = 1;
        this.dispatchEvent(new CustomEvent('sort-change', {
          detail: this._sortState, bubbles: true, composed: true,
        }));
        this._render();
      });
    });

    this.shadow.querySelectorAll&lt;HTMLButtonElement&gt;('[data-page]').forEach(btn =&gt; {
      const page = Number(btn.dataset.page);
      if (btn.disabled || page &lt; 1 || page &gt; total) return;
      btn.addEventListener('click', () =&gt; {
        this._currentPage = page;
        this.dispatchEvent(new CustomEvent('page-change', {
          detail: { page }, bubbles: true, composed: true,
        }));
        this._render();
      });
    });
  }
}

customElements.define('data-table', DataTableWC);
</book-code-block>

<h2 id="ch31-s02">專案 B：&lt;toast-manager&gt; — Portal 式通知系統，含動畫效果</h2>

<p>Toast 通知系統需要跨越 DOM 層次結構，在頁面最頂層（通常是 <code>&lt;body&gt;</code> 的直接子節點）渲染，避免被其他元素的 <code>overflow: hidden</code> 或 <code>z-index</code> 限制。這種模式稱為 Portal。</p>

<book-code-block language="typescript" label="TypeScript — toast-manager.ts（Portal 模式 + 佇列動畫）">
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

export interface Toast {
  id: string;
  message: string;
  variant: 'info' | 'success' | 'warning' | 'error';
  duration: number;
  removing?: boolean;
}

// ===== Toast Manager 元件 =====
@customElement('toast-manager')
export class ToastManager extends LitElement {
  @state() private toasts: Toast[] = [];

  static styles = css\`
    :host {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
      width: 360px;
    }
    .toast {
      pointer-events: all;
      background: white;
      border-radius: 8px;
      padding: 14px 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,.15);
      display: flex;
      align-items: flex-start;
      gap: 10px;
      border-left: 4px solid #94a3b8;
      animation: slideIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .toast.removing {
      animation: slideOut 0.2s ease-in forwards;
    }
    .toast.success { border-left-color: #22c55e; }
    .toast.error   { border-left-color: #ef4444; }
    .toast.warning { border-left-color: #f59e0b; }
    .toast.info    { border-left-color: #3b82f6; }
    .toast-icon { font-size: 18px; line-height: 1; flex-shrink: 0; }
    .toast-body { flex: 1; }
    .toast-message { font-size: 14px; color: #1e293b; line-height: 1.5; }
    .toast-close {
      background: none; border: none; cursor: pointer;
      color: #94a3b8; font-size: 18px; padding: 0; line-height: 1;
      flex-shrink: 0;
    }
    .toast-close:hover { color: #475569; }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(100%) scale(0.9); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes slideOut {
      from { opacity: 1; transform: translateX(0) scale(1); }
      to   { opacity: 0; transform: translateX(100%) scale(0.9); }
    }
  \`;

  // 靜態方法：提供全域 API
  static instance: ToastManager | null = null;

  static show(message: string, options: Partial&lt;Omit&lt;Toast, 'id' | 'message'&gt;&gt; = {}) {
    if (!ToastManager.instance) {
      // Portal 模式：將元件插入 body 最頂層
      const manager = document.createElement('toast-manager') as ToastManager;
      document.body.appendChild(manager);
      ToastManager.instance = manager;
    }
    ToastManager.instance.addToast(message, options);
  }

  addToast(message: string, options: Partial&lt;Omit&lt;Toast, 'id' | 'message'&gt;&gt; = {}) {
    const toast: Toast = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      message,
      variant: options.variant ?? 'info',
      duration: options.duration ?? 4000,
    };
    this.toasts = [...this.toasts, toast];

    if (toast.duration &gt; 0) {
      setTimeout(() =&gt; this.removeToast(toast.id), toast.duration);
    }
  }

  removeToast(id: string) {
    // 先播放消失動畫，再從陣列移除
    this.toasts = this.toasts.map(t =&gt; t.id === id ? { ...t, removing: true } : t);
    setTimeout(() =&gt; {
      this.toasts = this.toasts.filter(t =&gt; t.id !== id);
    }, 200);
  }

  private getIcon(variant: Toast['variant']) {
    return { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' }[variant];
  }

  render() {
    return repeat(
      this.toasts,
      t =&gt; t.id,
      t =&gt; html\`
        &lt;div class="toast \${t.variant} \${t.removing ? 'removing' : ''}" role="alert" aria-live="polite"&gt;
          &lt;span class="toast-icon"&gt;\${this.getIcon(t.variant)}&lt;/span&gt;
          &lt;div class="toast-body"&gt;
            &lt;div class="toast-message"&gt;\${t.message}&lt;/div&gt;
          &lt;/div&gt;
          &lt;button class="toast-close" @click=\${() =&gt; this.removeToast(t.id)} aria-label="關閉"&gt;×&lt;/button&gt;
        &lt;/div&gt;
      \`
    );
  }
}

// 全域使用範例：
// ToastManager.show('操作成功！', { variant: 'success' });
// ToastManager.show('發生錯誤', { variant: 'error', duration: 0 }); // duration: 0 = 不自動關閉
</book-code-block>

<p>以下是等效的<strong>原生 Web Component</strong>版本。此專案的亮點是：原生版改用 <strong>直接 DOM 操作</strong>（<code>createElement/appendChild</code>）取代 Lit 的宣告式模板，讓每個 toast 節點的生命週期更清晰可追蹤。</p>

<book-code-block language="typescript" label="TypeScript — toast-manager.ts（原生 Web Component 版本）">
// ===== 對比要點 =====
// 1. 使用直接 DOM 操作（createElement/appendChild）取代 Lit 的宣告式模板
// 2. 無 @state 裝飾器：以類別屬性陣列手動管理 toast 清單
// 3. Shadow DOM 樣式需在 connectedCallback 中注入（只做一次）
// 4. 動畫：手動切換 CSS class，與 Lit 版邏輯相同

export interface Toast {
  id: string;
  message: string;
  variant: 'info' | 'success' | 'warning' | 'error';
  duration: number;
  removing?: boolean;
}

const ICONS: Record&lt;Toast['variant'], string&gt; = {
  info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌',
};

class ToastManagerWC extends HTMLElement {
  // Lit 用 @state() private toasts: Toast[] = []，任何賦值自動觸發 render()；
  // 原生只是普通陣列，需手動操作 DOM
  private toasts: Map&lt;string, HTMLElement&gt; = new Map();
  private shadow: ShadowRoot;

  static instance: ToastManagerWC | null = null;

  // 全域 API：模式與 Lit 版相同
  static show(message: string, options: Partial&lt;Omit&lt;Toast, 'id' | 'message'&gt;&gt; = {}) {
    if (!ToastManagerWC.instance) {
      const manager = document.createElement('toast-manager') as ToastManagerWC;
      document.body.appendChild(manager);
      ToastManagerWC.instance = manager;
    }
    ToastManagerWC.instance.addToast(message, options);
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  // Lit 的 render() 在連線時自動執行；
  // 原生需在 connectedCallback 中手動初始化（這裡只注入樣式，不建立 toast 節點）
  connectedCallback() {
    // 樣式只注入一次（Lit 的 static styles 也只建立一次 CSSStyleSheet）
    const style = document.createElement('style');
    style.textContent = \`
      :host {
        position: fixed; top: 16px; right: 16px; z-index: 9999;
        display: flex; flex-direction: column; gap: 8px;
        pointer-events: none; width: 360px;
      }
      .toast {
        pointer-events: all; background: white; border-radius: 8px;
        padding: 14px 16px; box-shadow: 0 4px 20px rgba(0,0,0,.15);
        display: flex; align-items: flex-start; gap: 10px;
        border-left: 4px solid #94a3b8;
        animation: slideIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .toast.removing { animation: slideOut 0.2s ease-in forwards; }
      .toast.success { border-left-color: #22c55e; }
      .toast.error   { border-left-color: #ef4444; }
      .toast.warning { border-left-color: #f59e0b; }
      .toast.info    { border-left-color: #3b82f6; }
      .toast-icon { font-size: 18px; line-height: 1; flex-shrink: 0; }
      .toast-body { flex: 1; }
      .toast-message { font-size: 14px; color: #1e293b; line-height: 1.5; }
      .toast-close {
        background: none; border: none; cursor: pointer;
        color: #94a3b8; font-size: 18px; padding: 0; line-height: 1; flex-shrink: 0;
      }
      .toast-close:hover { color: #475569; }
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(100%) scale(0.9); }
        to   { opacity: 1; transform: translateX(0) scale(1); }
      }
      @keyframes slideOut {
        from { opacity: 1; transform: translateX(0) scale(1); }
        to   { opacity: 0; transform: translateX(100%) scale(0.9); }
      }
    \`;
    this.shadow.appendChild(style);
  }

  addToast(message: string, options: Partial&lt;Omit&lt;Toast, 'id' | 'message'&gt;&gt; = {}) {
    const toast: Toast = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      message,
      variant: options.variant ?? 'info',
      duration: options.duration ?? 4000,
    };

    // Lit 版用宣告式 html\`\`，框架建立 DOM；
    // 原生版手動 createElement + appendChild（不需要在每次更新時重建整個清單）
    const el = document.createElement('div');
    el.className = 'toast ' + toast.variant;
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML =
      '&lt;span class="toast-icon"&gt;' + ICONS[toast.variant] + '&lt;/span&gt;'
    + '&lt;div class="toast-body"&gt;&lt;div class="toast-message"&gt;' + message + '&lt;/div&gt;&lt;/div&gt;'
    + '&lt;button class="toast-close" aria-label="關閉"&gt;×&lt;/button&gt;';

    el.querySelector('.toast-close')!.addEventListener('click', () =&gt; this.removeToast(toast.id));
    this.shadow.appendChild(el);
    this.toasts.set(toast.id, el);

    if (toast.duration &gt; 0) {
      setTimeout(() =&gt; this.removeToast(toast.id), toast.duration);
    }
  }

  removeToast(id: string) {
    const el = this.toasts.get(id);
    if (!el) return;

    // 先加 removing class 播放離場動畫（與 Lit 版邏輯相同）
    // Lit 版更新 @state 陣列，重新 render 帶入 removing class；
    // 原生版直接操作現有 DOM 節點，不需要重建整個清單
    el.classList.add('removing');
    setTimeout(() =&gt; {
      el.remove();
      this.toasts.delete(id);
    }, 200);
  }
}

customElements.define('toast-manager', ToastManagerWC);

// 全域使用方式（同 Lit 版）：
// ToastManagerWC.show('操作成功！', { variant: 'success' });
// ToastManagerWC.show('發生錯誤', { variant: 'error', duration: 0 });
</book-code-block>

<h2 id="ch31-s03">專案 C：&lt;multi-step-form&gt; — 完整整合 FACE API 與表單驗證</h2>

<p>多步驟表單整合了 FACE API（FormAssociated Custom Element）讓表單可以原生提交，同時管理步驟狀態機、每步的驗證邏輯，以及進度指示器。</p>

<book-code-block language="typescript" label="TypeScript — multi-step-form.ts（FACE API 整合）">
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

interface StepConfig {
  title: string;
  fields: FieldConfig[];
}

interface FieldConfig {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  pattern?: string;
  patternMessage?: string;
}

@customElement('multi-step-form')
export class MultiStepForm extends LitElement {
  // FACE API：讓這個元件作為表單關聯元素
  static formAssociated = true;
  private internals: ElementInternals;

  @property({ type: Array }) steps: StepConfig[] = [];
  @property({ type: String, attribute: 'submit-label' }) submitLabel = '提交';

  @state() private currentStep = 0;
  @state() private formData: Record&lt;string, string&gt; = {};
  @state() private errors: Record&lt;string, string&gt; = {};
  @state() private isSubmitting = false;

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  static styles = css\`
    :host { display: block; }
    .progress {
      display: flex;
      gap: 0;
      margin-bottom: 32px;
      position: relative;
    }
    .progress::before {
      content: '';
      position: absolute;
      top: 16px;
      left: 16px;
      right: 16px;
      height: 2px;
      background: #e2e8f0;
      z-index: 0;
    }
    .step-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      position: relative;
      z-index: 1;
      gap: 6px;
    }
    .step-dot {
      width: 32px; height: 32px;
      border-radius: 50%;
      border: 2px solid #e2e8f0;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      color: #94a3b8;
      transition: all 0.2s;
    }
    .step-dot.active  { border-color: #3b82f6; color: #3b82f6; background: #eff6ff; }
    .step-dot.done    { border-color: #22c55e; background: #22c55e; color: white; }
    .step-label { font-size: 12px; color: #64748b; }
    .step-label.active { color: #3b82f6; font-weight: 600; }
    .field { margin-bottom: 16px; }
    label { display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 4px; }
    label .required { color: #ef4444; }
    input, select, textarea {
      width: 100%; padding: 10px 12px;
      border: 1px solid #e2e8f0; border-radius: 6px;
      font-size: 14px; box-sizing: border-box;
      transition: border-color 0.15s;
    }
    input:focus, select:focus { outline: none; border-color: #3b82f6; }
    input.error { border-color: #ef4444; }
    .error-msg { color: #ef4444; font-size: 12px; margin-top: 4px; }
    .actions { display: flex; justify-content: space-between; margin-top: 24px; }
    button {
      padding: 10px 20px; border-radius: 6px; border: none;
      font-size: 14px; font-weight: 600; cursor: pointer;
      transition: opacity 0.15s;
    }
    button:hover { opacity: 0.9; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-secondary { background: #f1f5f9; color: #374151; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
  \`;

  private validateStep(stepIndex: number): boolean {
    const step = this.steps[stepIndex];
    if (!step) return true;
    const newErrors: Record&lt;string, string&gt; = {};
    let valid = true;

    for (const field of step.fields) {
      const value = this.formData[field.name] ?? '';
      if (field.required &amp;&amp; !value.trim()) {
        newErrors[field.name] = \`\${field.label} 為必填欄位\`;
        valid = false;
      } else if (field.pattern &amp;&amp; value &amp;&amp; !new RegExp(field.pattern).test(value)) {
        newErrors[field.name] = field.patternMessage ?? '格式不正確';
        valid = false;
      }
    }

    this.errors = newErrors;
    return valid;
  }

  private updateInternals() {
    // 透過 FACE API 設定表單值，讓外部 &lt;form&gt; 可以取得資料
    const fd = new FormData();
    Object.entries(this.formData).forEach(([k, v]) =&gt; fd.append(k, v));
    this.internals.setFormValue(fd);

    // 設定驗證狀態
    const hasErrors = Object.keys(this.errors).length &gt; 0;
    if (hasErrors) {
      this.internals.setValidity(
        { customError: true },
        '請填寫所有必填欄位',
        this.shadowRoot?.querySelector('input') ?? undefined
      );
    } else {
      this.internals.setValidity({});
    }
  }

  private handleInput(e: Event, fieldName: string) {
    const input = e.target as HTMLInputElement;
    this.formData = { ...this.formData, [fieldName]: input.value };
    // 清除該欄位的錯誤
    const { [fieldName]: _, ...rest } = this.errors;
    this.errors = rest;
    this.updateInternals();
  }

  private async handleNext() {
    if (!this.validateStep(this.currentStep)) return;
    if (this.currentStep &lt; this.steps.length - 1) {
      this.currentStep++;
    } else {
      // 最後一步：觸發提交
      this.isSubmitting = true;
      try {
        this.dispatchEvent(new CustomEvent('form-submit', {
          detail: { data: { ...this.formData } },
          bubbles: true,
          composed: true,
        }));
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  render() {
    const step = this.steps[this.currentStep];
    const isLast = this.currentStep === this.steps.length - 1;

    return html\`
      &lt;!-- 進度指示器 --&gt;
      &lt;div class="progress"&gt;
        \${this.steps.map((s, i) =&gt; html\`
          &lt;div class="step-indicator"&gt;
            &lt;div class="step-dot \${i &lt; this.currentStep ? 'done' : i === this.currentStep ? 'active' : ''}"&gt;
              \${i &lt; this.currentStep ? '✓' : i + 1}
            &lt;/div&gt;
            &lt;span class="step-label \${i === this.currentStep ? 'active' : ''}"&gt;\${s.title}&lt;/span&gt;
          &lt;/div&gt;
        \`)}
      &lt;/div&gt;

      &lt;!-- 當前步驟欄位 --&gt;
      \${step ? html\`
        \${step.fields.map(field =&gt; html\`
          &lt;div class="field"&gt;
            &lt;label&gt;
              \${field.label}
              \${field.required ? html\`&lt;span class="required"&gt; *&lt;/span&gt;\` : ''}
            &lt;/label&gt;
            &lt;input
              type=\${field.type}
              name=\${field.name}
              class=\${this.errors[field.name] ? 'error' : ''}
              .value=\${this.formData[field.name] ?? ''}
              @input=\${(e: Event) =&gt; this.handleInput(e, field.name)}
            &gt;
            \${this.errors[field.name]
              ? html\`&lt;div class="error-msg"&gt;\${this.errors[field.name]}&lt;/div&gt;\`
              : ''
            }
          &lt;/div&gt;
        \`)}
      \` : ''}

      &lt;div class="actions"&gt;
        \${this.currentStep &gt; 0
          ? html\`&lt;button class="btn-secondary" @click=\${() =&gt; this.currentStep--}&gt;← 上一步&lt;/button&gt;\`
          : html\`&lt;span&gt;&lt;/span&gt;\`
        }
        &lt;button
          class="btn-primary"
          ?disabled=\${this.isSubmitting}
          @click=\${this.handleNext}
        &gt;
          \${this.isSubmitting ? '提交中...' : isLast ? this.submitLabel : '下一步 →'}
        &lt;/button&gt;
      &lt;/div&gt;
    \`;
  }
}
</book-code-block>

<p>以下是等效的<strong>原生 Web Component</strong>版本。此專案的重點揭示：<strong>FACE API（<code>static formAssociated</code>、<code>attachInternals()</code>）是原生瀏覽器 API，與框架完全無關</strong>——Lit 版與原生版寫法完全一致。</p>

<book-code-block language="typescript" label="TypeScript — multi-step-form.ts（原生 Web Component 版本）">
// ===== 對比要點 =====
// 1. FACE API（static formAssociated + attachInternals）完全相同：這是原生瀏覽器 API！
// 2. 無 @property/@state 裝飾器 → 普通類別屬性 + 手動呼叫 _render()
// 3. 無 Lit 模板 → innerHTML + 手動重新綁定事件

interface StepConfig {
  title: string;
  fields: FieldConfig[];
}

interface FieldConfig {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  pattern?: string;
  patternMessage?: string;
}

class MultiStepFormWC extends HTMLElement {
  // ===== FACE API：與 Lit 版完全相同 =====
  // 這是 Web 標準，不依賴任何框架
  static formAssociated = true;
  private internals: ElementInternals;
  // ======================================

  steps: StepConfig[] = [];
  submitLabel = '提交';

  private currentStep = 0;
  private formData: Record&lt;string, string&gt; = {};
  private errors: Record&lt;string, string&gt; = {};
  private isSubmitting = false;
  private shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    // attachInternals()：與 Lit 版完全相同
    this.internals = this.attachInternals();
    this._injectStyles();
  }

  connectedCallback() { this._render(); }

  private _injectStyles() {
    const style = document.createElement('style');
    // CSS 規則與 Lit 版 static styles 完全相同，省略顯示
    style.textContent = \`
      :host { display: block; }
      .progress { display: flex; gap: 0; margin-bottom: 32px; position: relative; }
      .progress::before {
        content: ''; position: absolute; top: 16px; left: 16px; right: 16px;
        height: 2px; background: #e2e8f0; z-index: 0;
      }
      .step-indicator {
        display: flex; flex-direction: column; align-items: center;
        flex: 1; position: relative; z-index: 1; gap: 6px;
      }
      .step-dot {
        width: 32px; height: 32px; border-radius: 50%;
        border: 2px solid #e2e8f0; background: white;
        display: flex; align-items: center; justify-content: center;
        font-size: 13px; font-weight: 600; color: #94a3b8; transition: all 0.2s;
      }
      .step-dot.active { border-color: #3b82f6; color: #3b82f6; background: #eff6ff; }
      .step-dot.done   { border-color: #22c55e; background: #22c55e; color: white; }
      .step-label { font-size: 12px; color: #64748b; }
      .step-label.active { color: #3b82f6; font-weight: 600; }
      .field { margin-bottom: 16px; }
      label { display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 4px; }
      .required { color: #ef4444; }
      input { width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0;
              border-radius: 6px; font-size: 14px; box-sizing: border-box; transition: border-color 0.15s; }
      input:focus { outline: none; border-color: #3b82f6; }
      input.error { border-color: #ef4444; }
      .error-msg { color: #ef4444; font-size: 12px; margin-top: 4px; }
      .actions { display: flex; justify-content: space-between; margin-top: 24px; }
      button { padding: 10px 20px; border-radius: 6px; border: none;
               font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
      button:hover { opacity: 0.9; }
      .btn-primary { background: #3b82f6; color: white; }
      .btn-secondary { background: #f1f5f9; color: #374151; }
      button:disabled { opacity: 0.5; cursor: not-allowed; }
    \`;
    this.shadow.appendChild(style);
  }

  // 驗證邏輯：與 Lit 版完全相同
  private _validateStep(stepIndex: number): boolean {
    const step = this.steps[stepIndex];
    if (!step) return true;
    const newErrors: Record&lt;string, string&gt; = {};
    let valid = true;
    for (const field of step.fields) {
      const value = this.formData[field.name] ?? '';
      if (field.required &amp;&amp; !value.trim()) {
        newErrors[field.name] = field.label + ' 為必填欄位';
        valid = false;
      } else if (field.pattern &amp;&amp; value &amp;&amp; !new RegExp(field.pattern).test(value)) {
        newErrors[field.name] = field.patternMessage ?? '格式不正確';
        valid = false;
      }
    }
    this.errors = newErrors;
    return valid;
  }

  // FACE API 整合：與 Lit 版完全相同（原生 API，框架無關）
  private _updateInternals() {
    const fd = new FormData();
    Object.entries(this.formData).forEach(([k, v]) =&gt; fd.append(k, v));
    this.internals.setFormValue(fd);
    const hasErrors = Object.keys(this.errors).length &gt; 0;
    if (hasErrors) {
      this.internals.setValidity(
        { customError: true },
        '請填寫所有必填欄位',
        this.shadow.querySelector('input') ?? undefined
      );
    } else {
      this.internals.setValidity({});
    }
  }

  private _render() {
    const step   = this.steps[this.currentStep];
    const isLast = this.currentStep === this.steps.length - 1;

    // 進度指示器 HTML
    const progressHTML = this.steps.map((s, i) =&gt; {
      const dotClass = i &lt; this.currentStep ? 'done' : i === this.currentStep ? 'active' : '';
      const lblClass = i === this.currentStep ? 'active' : '';
      return '&lt;div class="step-indicator"&gt;'
           + '&lt;div class="step-dot ' + dotClass + '"&gt;' + (i &lt; this.currentStep ? '✓' : i + 1) + '&lt;/div&gt;'
           + '&lt;span class="step-label ' + lblClass + '"&gt;' + s.title + '&lt;/span&gt;'
           + '&lt;/div&gt;';
    }).join('');

    // 欄位 HTML
    const fieldsHTML = step ? step.fields.map(field =&gt; {
      const hasError = !!this.errors[field.name];
      return '&lt;div class="field"&gt;'
           + '&lt;label&gt;' + field.label + (field.required ? '&lt;span class="required"&gt; *&lt;/span&gt;' : '') + '&lt;/label&gt;'
           + '&lt;input type="' + field.type + '" name="' + field.name + '" data-field="' + field.name + '"'
           + ' class="' + (hasError ? 'error' : '') + '" value="' + (this.formData[field.name] ?? '') + '"&gt;'
           + (hasError ? '&lt;div class="error-msg"&gt;' + this.errors[field.name] + '&lt;/div&gt;' : '')
           + '&lt;/div&gt;';
    }).join('') : '';

    const prevBtn  = this.currentStep &gt; 0
      ? '&lt;button class="btn-secondary" id="btn-prev"&gt;← 上一步&lt;/button&gt;'
      : '&lt;span&gt;&lt;/span&gt;';
    const nextLabel = this.isSubmitting ? '提交中...' : isLast ? this.submitLabel : '下一步 →';

    // 保留 &lt;style&gt; 節點，只更新內容部分
    // Lit 的 html\`\` 模板做增量更新，不需要這樣手動處理
    const style = this.shadow.querySelector('style');
    this.shadow.innerHTML = '';
    if (style) this.shadow.appendChild(style);

    const container = document.createElement('div');
    container.innerHTML =
      '&lt;div class="progress"&gt;' + progressHTML + '&lt;/div&gt;'
    + fieldsHTML
    + '&lt;div class="actions"&gt;' + prevBtn
    + '&lt;button class="btn-primary" id="btn-next"' + (this.isSubmitting ? ' disabled' : '') + '&gt;'
    + nextLabel + '&lt;/button&gt;&lt;/div&gt;';
    this.shadow.appendChild(container);

    // 重新綁定事件（innerHTML 重建後必須執行）
    this.shadow.querySelector('#btn-prev')?.addEventListener('click', () =&gt; {
      this.currentStep--;
      this._render();
    });
    this.shadow.querySelector('#btn-next')?.addEventListener('click', () =&gt; this._handleNext());
    this.shadow.querySelectorAll&lt;HTMLInputElement&gt;('[data-field]').forEach(input =&gt; {
      input.addEventListener('input', e =&gt; {
        const name = (e.target as HTMLInputElement).dataset.field!;
        this.formData = { ...this.formData, [name]: (e.target as HTMLInputElement).value };
        const { [name]: _, ...rest } = this.errors;
        this.errors = rest;
        this._updateInternals();
      });
    });
  }

  private async _handleNext() {
    if (!this._validateStep(this.currentStep)) { this._render(); return; }
    if (this.currentStep &lt; this.steps.length - 1) {
      this.currentStep++;
    } else {
      this.isSubmitting = true;
      this._render();
      try {
        this.dispatchEvent(new CustomEvent('form-submit', {
          detail: { data: { ...this.formData } }, bubbles: true, composed: true,
        }));
      } finally {
        this.isSubmitting = false;
      }
    }
    this._render();
  }
}

customElements.define('multi-step-form', MultiStepFormWC);
</book-code-block>

<h2 id="ch31-s04">專案 D：Dashboard Shell 採 Micro-frontend 架構</h2>

<p>Micro-frontend（微前端）架構允許不同團隊用不同框架開發各自的功能模組，由 Shell 應用統一組裝。Web Components 是微前端架構的天然膠水：它是框架無關的，可以跨越框架邊界傳遞資料與事件。</p>

<book-code-block language="typescript" label="TypeScript — dashboard-shell.ts（模組載入與路由）">
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface MicroApp {
  id: string;
  name: string;
  icon: string;
  remoteUrl: string;    // 遠端模組 URL（Module Federation / ESM CDN）
  tagName: string;      // 元件標籤名稱
}

@customElement('dashboard-shell')
export class DashboardShell extends LitElement {
  @state() private activeApp: string = 'overview';
  @state() private loadedApps: Set&lt;string&gt; = new Set();
  @state() private loadingApp: string | null = null;
  @state() private appErrors: Map&lt;string, string&gt; = new Map();

  // 微前端應用清單（實際上從設定服務載入）
  private apps: MicroApp[] = [
    { id: 'overview',   name: '總覽',   icon: '📊', remoteUrl: '/apps/overview/index.js',   tagName: 'app-overview' },
    { id: 'analytics',  name: '分析',   icon: '📈', remoteUrl: '/apps/analytics/index.js',  tagName: 'app-analytics' },
    { id: 'settings',   name: '設定',   icon: '⚙️',  remoteUrl: '/apps/settings/index.js',   tagName: 'app-settings' },
    { id: 'users',      name: '使用者', icon: '👥', remoteUrl: '/apps/users/index.js',      tagName: 'app-users' },
  ];

  static styles = css\`
    :host { display: flex; height: 100vh; font-family: inherit; }
    .sidebar {
      width: 240px;
      background: #0f172a;
      color: #cbd5e1;
      display: flex;
      flex-direction: column;
      padding: 16px 0;
      flex-shrink: 0;
    }
    .sidebar-logo { padding: 0 20px 16px; font-size: 18px; font-weight: 700; color: white; }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 20px;
      cursor: pointer;
      border-radius: 0;
      transition: background 0.15s;
      font-size: 14px;
    }
    .nav-item:hover { background: rgba(255,255,255,.06); }
    .nav-item.active { background: rgba(59,130,246,.2); color: #60a5fa; }
    .main { flex: 1; overflow: auto; position: relative; }
    .app-slot { width: 100%; height: 100%; }
    .loading-overlay {
      position: absolute; inset: 0;
      background: rgba(255,255,255,.8);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: #64748b;
    }
    .error-state {
      padding: 40px;
      text-align: center;
      color: #ef4444;
    }
  \`;

  async connectedCallback() {
    super.connectedCallback();
    // 預載入預設應用
    await this.loadApp('overview');
  }

  private async loadApp(appId: string) {
    const app = this.apps.find(a =&gt; a.id === appId);
    if (!app) return;

    // 已載入，直接切換
    if (this.loadedApps.has(appId)) {
      this.activeApp = appId;
      return;
    }

    this.loadingApp = appId;
    this.activeApp = appId;

    try {
      // 動態匯入遠端模組（ESM 方式）
      await import(/* @vite-ignore */ app.remoteUrl);
      // 等待元件定義完成
      await customElements.whenDefined(app.tagName);
      this.loadedApps = new Set([...this.loadedApps, appId]);
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知錯誤';
      this.appErrors = new Map([...this.appErrors, [appId, message]]);
      console.error(\`Failed to load micro-app \${appId}:\`, err);
    } finally {
      this.loadingApp = null;
    }
  }

  // 微前端間通訊：透過 CustomEvent 廣播
  private broadcastEvent(type: string, detail: unknown) {
    window.dispatchEvent(new CustomEvent(\`shell:\${type}\`, { detail }));
  }

  private renderAppSlot(app: MicroApp) {
    if (this.appErrors.has(app.id)) {
      return html\`
        &lt;div class="error-state"&gt;
          &lt;p&gt;❌ 載入 \${app.name} 模組失敗&lt;/p&gt;
          &lt;p&gt;\${this.appErrors.get(app.id)}&lt;/p&gt;
          &lt;button @click=\${() =&gt; { this.appErrors.delete(app.id); this.loadApp(app.id); }}&gt;重試&lt;/button&gt;
        &lt;/div&gt;
      \`;
    }
    if (!this.loadedApps.has(app.id)) return html\`\`;
    // 動態建立標籤（避免在模組未載入時 HTML parser 嘗試升級元素）
    return html\`&lt;\${app.tagName as any}&gt;&lt;/\${app.tagName as any}&gt;\`;
  }

  render() {
    const activeAppConfig = this.apps.find(a =&gt; a.id === this.activeApp);

    return html\`
      &lt;nav class="sidebar"&gt;
        &lt;div class="sidebar-logo"&gt;🚀 Dashboard&lt;/div&gt;
        \${this.apps.map(app =&gt; html\`
          &lt;div
            class="nav-item \${this.activeApp === app.id ? 'active' : ''}"
            @click=\${() =&gt; this.loadApp(app.id)}
            role="button"
            tabindex="0"
            aria-current=\${this.activeApp === app.id ? 'page' : 'false'}
          &gt;
            &lt;span&gt;\${app.icon}&lt;/span&gt;
            &lt;span&gt;\${app.name}&lt;/span&gt;
          &lt;/div&gt;
        \`)}
      &lt;/nav&gt;

      &lt;main class="main"&gt;
        \${this.apps.map(app =&gt; html\`
          &lt;div class="app-slot" style=\${app.id === this.activeApp ? '' : 'display:none'}&gt;
            \${this.renderAppSlot(app)}
          &lt;/div&gt;
        \`)}
        \${this.loadingApp ? html\`
          &lt;div class="loading-overlay"&gt;
            載入 \${activeAppConfig?.name ?? ''} 模組中...
          &lt;/div&gt;
        \` : ''}
      &lt;/main&gt;
    \`;
  }
}
</book-code-block>

<p>以下是等效的<strong>原生 Web Component</strong>版本。此專案中可以觀察到：<strong>動態 <code>import()</code> 和 <code>customElements.whenDefined()</code> 都是原生 ES Module 語法</strong>，Lit 版與原生版完全相同；差異只在狀態管理與渲染模式。</p>

<book-code-block language="typescript" label="TypeScript — dashboard-shell.ts（原生 Web Component 版本）">
// ===== 對比要點 =====
// 1. 無 @state 裝飾器：以普通屬性 + 手動 _render() 管理狀態
// 2. 無 Lit 模板：innerHTML + 手動事件綁定
// 3. 動態匯入遠端模組（import()）：與 Lit 版完全相同，這是原生 ES Module 語法
// 4. 跨應用通訊（window.dispatchEvent）：與 Lit 版完全相同

interface MicroApp {
  id: string;
  name: string;
  icon: string;
  remoteUrl: string;
  tagName: string;
}

class DashboardShellWC extends HTMLElement {
  private activeApp  = 'overview';
  private loadedApps = new Set&lt;string&gt;();
  private loadingApp: string | null = null;
  private appErrors  = new Map&lt;string, string&gt;();
  private shadow: ShadowRoot;

  private apps: MicroApp[] = [
    { id: 'overview',  name: '總覽',   icon: '📊', remoteUrl: '/apps/overview/index.js',  tagName: 'app-overview' },
    { id: 'analytics', name: '分析',   icon: '📈', remoteUrl: '/apps/analytics/index.js', tagName: 'app-analytics' },
    { id: 'settings',  name: '設定',   icon: '⚙️',  remoteUrl: '/apps/settings/index.js',  tagName: 'app-settings' },
    { id: 'users',     name: '使用者', icon: '👥', remoteUrl: '/apps/users/index.js',     tagName: 'app-users' },
  ];

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this._injectStyles();
  }

  async connectedCallback() {
    this._render();
    await this._loadApp('overview');
  }

  private _injectStyles() {
    const style = document.createElement('style');
    // CSS 與 Lit 版 static styles 完全相同
    style.textContent = \`
      :host { display: flex; height: 100vh; font-family: inherit; }
      .sidebar { width: 240px; background: #0f172a; color: #cbd5e1;
                 display: flex; flex-direction: column; padding: 16px 0; flex-shrink: 0; }
      .sidebar-logo { padding: 0 20px 16px; font-size: 18px; font-weight: 700; color: white; }
      .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 20px;
                  cursor: pointer; transition: background 0.15s; font-size: 14px; }
      .nav-item:hover  { background: rgba(255,255,255,.06); }
      .nav-item.active { background: rgba(59,130,246,.2); color: #60a5fa; }
      .main { flex: 1; overflow: auto; position: relative; }
      .app-slot { width: 100%; height: 100%; }
      .loading-overlay { position: absolute; inset: 0; background: rgba(255,255,255,.8);
                         display: flex; align-items: center; justify-content: center;
                         font-size: 14px; color: #64748b; }
      .error-state { padding: 40px; text-align: center; color: #ef4444; }
    \`;
    this.shadow.appendChild(style);
  }

  private async _loadApp(appId: string) {
    const app = this.apps.find(a =&gt; a.id === appId);
    if (!app) return;

    // 已載入直接切換（邏輯與 Lit 版相同）
    if (this.loadedApps.has(appId)) {
      this.activeApp = appId;
      this._render();
      return;
    }

    this.loadingApp = appId;
    this.activeApp  = appId;
    this._render();

    try {
      // 動態匯入：原生 ES Module 語法，與 Lit 版完全相同
      await import(/* @vite-ignore */ app.remoteUrl);
      await customElements.whenDefined(app.tagName);
      this.loadedApps = new Set([...this.loadedApps, appId]);
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知錯誤';
      this.appErrors = new Map([...this.appErrors, [appId, message]]);
      console.error(\`Failed to load micro-app \${appId}:\`, err);
    } finally {
      this.loadingApp = null;
      this._render();
    }
  }

  private _render() {
    const style = this.shadow.querySelector('style');

    // 側欄 HTML
    const navItems = this.apps.map(app =&gt;
      '&lt;div class="nav-item' + (this.activeApp === app.id ? ' active' : '') + '"'
      + ' data-app-id="' + app.id + '" role="button" tabindex="0"'
      + ' aria-current="' + (this.activeApp === app.id ? 'page' : 'false') + '"&gt;'
      + '&lt;span&gt;' + app.icon + '&lt;/span&gt;&lt;span&gt;' + app.name + '&lt;/span&gt;'
      + '&lt;/div&gt;'
    ).join('');

    // 主內容 HTML
    const appSlots = this.apps.map(app =&gt; {
      const display = app.id === this.activeApp ? '' : ' style="display:none"';
      let slotContent = '';
      if (this.appErrors.has(app.id)) {
        slotContent = '&lt;div class="error-state"&gt;'
                    + '&lt;p&gt;❌ 載入 ' + app.name + ' 模組失敗&lt;/p&gt;'
                    + '&lt;p&gt;' + this.appErrors.get(app.id) + '&lt;/p&gt;'
                    + '&lt;button data-retry="' + app.id + '"&gt;重試&lt;/button&gt;&lt;/div&gt;';
      } else if (this.loadedApps.has(app.id)) {
        // 動態建立微前端元素（同 Lit 版的動態標籤語法）
        slotContent = '&lt;' + app.tagName + '&gt;&lt;/' + app.tagName + '&gt;';
      }
      return '&lt;div class="app-slot"' + display + '&gt;' + slotContent + '&lt;/div&gt;';
    }).join('');

    const loadingHTML = this.loadingApp
      ? '&lt;div class="loading-overlay"&gt;載入 '
        + (this.apps.find(a =&gt; a.id === this.loadingApp)?.name ?? '')
        + ' 模組中...&lt;/div&gt;'
      : '';

    this.shadow.innerHTML = '';
    if (style) this.shadow.appendChild(style);

    const container = document.createElement('div');
    container.style.cssText = 'display:contents';
    container.innerHTML =
      '&lt;nav class="sidebar"&gt;&lt;div class="sidebar-logo"&gt;🚀 Dashboard&lt;/div&gt;' + navItems + '&lt;/nav&gt;'
    + '&lt;main class="main"&gt;' + appSlots + loadingHTML + '&lt;/main&gt;';
    this.shadow.appendChild(container);

    // 重新綁定導覽事件
    this.shadow.querySelectorAll&lt;HTMLElement&gt;('[data-app-id]').forEach(item =&gt; {
      const appId = item.dataset.appId!;
      item.addEventListener('click', () =&gt; this._loadApp(appId));
      item.addEventListener('keydown', e =&gt; {
        if ((e as KeyboardEvent).key === 'Enter') this._loadApp(appId);
      });
    });
    this.shadow.querySelectorAll&lt;HTMLButtonElement&gt;('[data-retry]').forEach(btn =&gt; {
      const appId = btn.dataset.retry!;
      btn.addEventListener('click', () =&gt; { this.appErrors.delete(appId); this._loadApp(appId); });
    });
  }
}

customElements.define('dashboard-shell', DashboardShellWC);
</book-code-block>

<h2 id="ch31-s05">每個專案：原生 → Lit 重構 → 發布為 npm 套件</h2>

<p>本書一貫強調理解底層後再使用抽象。以 <code>&lt;data-table&gt;</code> 為例，展示從原生 Custom Element 到 Lit 再到 npm 發布的完整旅程：</p>

<book-code-block language="bash" label="Bash — 從 0 到 npm 的完整指令流程">
# 1. 建立專案結構
mkdir data-table-wc &amp;&amp; cd data-table-wc
npm init -y
npm install lit
npm install -D vite typescript @custom-elements-manifest/analyzer @changesets/cli

# 2. 設定 TypeScript 與建構
# （建立 tsconfig.json、vite.config.ts — 見 ch27 的設定）

# 3. 開發（Vite 提供 HMR 開發環境）
npm run dev

# 4. 撰寫測試（Web Test Runner）
npm run test:browser

# 5. 產生 Custom Elements Manifest
npx cem analyze --globs 'src/**/*.ts'

# 6. 建構發布版本
npm run build

# 7. 本機驗證套件（模擬 npm install）
npm pack
mkdir -p /tmp/test-consumer &amp;&amp; cd /tmp/test-consumer
npm init -y
npm install /path/to/data-table-wc-1.0.0.tgz lit

# 8. 初始化 Changesets
npx changeset init

# 9. 記錄版本更新意圖
npx changeset add
# 選擇 minor，輸入：「Add sorting, filtering, and pagination support」

# 10. 升級版本號 &amp; 更新 CHANGELOG
npx changeset version

# 11. 發布到 npm
npm login
npx changeset publish
# → Published @acme/data-table@1.0.0
</book-code-block>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>透過 Lit 與原生 Web Component 的雙版本對比可以看出：Lit 的 <code>@property/@state</code> 裝飾器、<code>html\`\`</code> 模板與 DOM diffing、<code>css\`\`</code> 樣式封裝，解決的正是原生版中手動追蹤狀態、重建 innerHTML、重新綁定事件的三大痛點；而 FACE API、動態 <code>import()</code>、CustomEvent 等核心 API 則是框架無關的 Web 標準，兩個版本完全一致。「原生 → Lit → npm」的旅程讓你對每一層的意義都有真實的體感。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch30">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">文件化與 Storybook</span>
    </a>
    <a class="footer-link" href="#ch32">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">面試完全攻略</span>
    </a>
  </div>
</div>
`
