export const metadata = {
  id: 30,
  part: 6,
  title: '文件化與 Storybook',
  tags: ['實用技巧'] as string[],
  sections: [
    { slug: 'ch30-s01', title: 'Storybook 8 搭配 Web Components Renderer' },
    { slug: 'ch30-s02', title: '從 Custom Elements Manifest 自動產生 Controls' },
    { slug: 'ch30-s03', title: '用 Chromatic 進行視覺回歸測試（Visual Regression Testing）' },
    { slug: 'ch30-s04', title: '用 TypeDoc 與 custom-elements-manifest-viewer 建構 API 文件' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 30 · 第六部：發布、工具鏈與 Design System</div>
  <h1>文件化與 Storybook</h1>
  <p>一個沒有文件的元件函式庫是無法被有效使用的。本章從 Storybook 8 的設定、Custom Elements Manifest 驅動的自動 Controls，到 Chromatic 的視覺回歸保護，以及 TypeDoc API 文件站的建構，完整覆蓋元件庫文件化的所有面向。</p>
  <div class="chapter-tags"><span class="tag tag-practical">實用技巧</span></div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch30-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">Storybook 8 搭配 Web Components Renderer</span>
    </a>
    <a class="catalog-item" href="#ch30-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">從 Custom Elements Manifest 自動產生 Controls</span>
    </a>
    <a class="catalog-item" href="#ch30-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">用 Chromatic 進行視覺回歸測試</span>
    </a>
    <a class="catalog-item" href="#ch30-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">用 TypeDoc 與 custom-elements-manifest-viewer 建構 API 文件</span>
    </a>
  </div>
</div>

<h2 id="ch30-s01">Storybook 8 搭配 Web Components Renderer</h2>

<p>Storybook 8 對 Web Components 的支援大幅提升，透過官方的 <code>@storybook/web-components-vite</code> 框架，可以輕鬆建立互動式元件展示與文件。</p>

<book-code-block language="javascript" label=".storybook/main.js — Storybook 8 設定">
// .storybook/main.js
import { mergeConfig } from 'vite';

export default {
  stories: [
    '../src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../docs/**/*.mdx',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',     // Controls, Actions, Docs, Viewport, Background
    '@storybook/addon-a11y',           // 無障礙檢查
    '@storybook/addon-interactions',   // 互動測試
    '@chromatic-com/storybook',        // Chromatic 整合
  ],
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',  // 有 autodocs tag 的 stories 自動產生文件頁
  },
  // 整合 Custom Elements Manifest
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: { '@': '/src' },
      },
    });
  },
};
</book-code-block>

<book-code-block language="javascript" label=".storybook/preview.js — 全域 Story 設定">
// .storybook/preview.js
import { setCustomElementsManifest } from '@storybook/web-components';
import customElements from '../custom-elements.json';

// 注入 CEM，讓 Storybook 自動產生 Controls
setCustomElementsManifest(customElements);

export default {
  parameters: {
    // 預設背景色（用於在不同主題下測試元件）
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0f172a' },
        { name: 'gray', value: '#f1f5f9' },
      ],
    },
    // 預設視窗尺寸
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '812px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1280px', height: '800px' } },
      },
    },
    // Actions：自動監聽所有 acme-* 自訂事件
    actions: { argTypesRegex: '^on[A-Z].*' },
    // 無障礙：預設啟用 WCAG 2.1 AA 規則
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
  // 全域裝飾器：為所有 stories 注入 CSS Token
  decorators: [
    (story) =&gt; \`
      &lt;link rel="stylesheet" href="/tokens.css"&gt;
      &lt;div style="padding: 24px;"&gt;
        \${story()}
      &lt;/div&gt;
    \`,
  ],
};
</book-code-block>

<p>以下是一個完整的 Story 檔案，展示 <code>acme-button</code> 的所有變體：</p>

<book-code-block language="typescript" label="TypeScript — acme-button.stories.ts">
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

// 匯入元件（觸發 customElements.define）
import '../src/components/button/index.js';

// Meta：元件的整體設定
const meta: Meta = {
  title: 'Components/Button',
  component: 'acme-button',
  tags: ['autodocs'],  // 自動產生 Docs 頁面
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
      description: '按鈕的視覺樣式變體',
      table: {
        defaultValue: { summary: 'primary' },
        type: { summary: "'primary' | 'secondary' | 'danger'" },
      },
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
      description: '按鈕大小',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
    label: {
      control: 'text',
      description: '按鈕文字（Slot 內容）',
    },
  },
  // 將 action 記錄自訂事件
  args: {
    label: '點擊我',
    variant: 'primary',
    size: 'md',
    disabled: false,
  },
};

export default meta;
type Story = StoryObj;

// 每個 Story 是一種元件狀態
export const Primary: Story = {
  render: (args) =&gt; html\`
    &lt;acme-button
      variant="primary"
      size=\${ifDefined(args.size)}
      ?disabled=\${args.disabled}
      @acme-click=\${(e: CustomEvent) =&gt; console.log('clicked', e.detail)}
    &gt;
      \${args.label}
    &lt;/acme-button&gt;
  \`,
};

export const AllVariants: Story = {
  render: () =&gt; html\`
    &lt;div style="display: flex; gap: 12px; flex-wrap: wrap;"&gt;
      &lt;acme-button variant="primary"&gt;Primary&lt;/acme-button&gt;
      &lt;acme-button variant="secondary"&gt;Secondary&lt;/acme-button&gt;
      &lt;acme-button variant="danger"&gt;Danger&lt;/acme-button&gt;
      &lt;acme-button variant="primary" disabled&gt;Disabled&lt;/acme-button&gt;
    &lt;/div&gt;
  \`,
  parameters: {
    // 這個 Story 在 Chromatic 中進行視覺回歸測試
    chromatic: { modes: { light: { theme: 'light' }, dark: { theme: 'dark' } } },
  },
};

export const Sizes: Story = {
  render: () =&gt; html\`
    &lt;div style="display: flex; gap: 12px; align-items: center;"&gt;
      &lt;acme-button size="sm"&gt;Small&lt;/acme-button&gt;
      &lt;acme-button size="md"&gt;Medium&lt;/acme-button&gt;
      &lt;acme-button size="lg"&gt;Large&lt;/acme-button&gt;
    &lt;/div&gt;
  \`,
};

// 互動測試：使用 @storybook/addon-interactions
export const InteractionTest: Story = {
  render: () =&gt; html\`
    &lt;acme-button id="test-btn" variant="primary"&gt;互動測試&lt;/acme-button&gt;
    &lt;p id="output"&gt;尚未點擊&lt;/p&gt;
    &lt;script&gt;
      document.getElementById('test-btn').addEventListener('acme-click', () =&gt; {
        document.getElementById('output').textContent = '已點擊！';
      });
    &lt;/script&gt;
  \`,
  play: async ({ canvasElement }) =&gt; {
    const { within, userEvent, expect } = await import('@storybook/test');
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await userEvent.click(button);
    await expect(canvas.getByText('已點擊！')).toBeInTheDocument();
  },
};
</book-code-block>

<h2 id="ch30-s02">從 Custom Elements Manifest 自動產生 Controls</h2>

<p>當 Storybook 與 CEM 整合後，Controls 面板會自動從 <code>custom-elements.json</code> 讀取屬性定義，無需在每個 Story 檔案中手動宣告 <code>argTypes</code>。</p>

<book-code-block language="json" label=".storybook/package.json — CEM 自動同步設定">
{
  "scripts": {
    "storybook": "storybook dev -p 6006 --no-open",
    "build:storybook": "storybook build",
    "prestorybook": "cem analyze --globs 'src/**/*.ts' --outdir .",
    "prebuild:storybook": "cem analyze --globs 'src/**/*.ts' --outdir ."
  }
}
</book-code-block>

<book-code-block language="javascript" label="JavaScript — cem-plugin-storybook.mjs — 增強 CEM 與 Storybook 整合">
// cem-plugin-storybook.mjs
// 自訂 CEM analyzer plugin：為 Controls 添加額外元數據
export default function storybookPlugin() {
  return {
    name: 'storybook-plugin',
    // 後處理 CEM，加入 Storybook 所需的控制類型提示
    packageLinkPhase({ customElementsManifest }) {
      for (const module of customElementsManifest.modules) {
        for (const declaration of module.declarations ?? []) {
          if (!declaration.customElement) continue;
          for (const attr of declaration.attributes ?? []) {
            // 根據型別自動決定 control 類型
            if (!attr.control) {
              if (attr.type?.text?.includes('boolean')) {
                attr.control = 'boolean';
              } else if (attr.type?.text?.includes('|')) {
                // Union type → select control
                attr.control = 'select';
                attr.options = attr.type.text
                  .split('|')
                  .map(t =&gt; t.trim().replace(/'/g, ''));
              } else if (attr.type?.text === 'number') {
                attr.control = 'number';
              } else {
                attr.control = 'text';
              }
            }
          }
        }
      }
    },
  };
}
</book-code-block>

<h2 id="ch30-s03">用 Chromatic 進行視覺回歸測試（Visual Regression Testing）</h2>

<p>Chromatic 是由 Storybook 維護者開發的視覺測試服務，它截圖每個 Story 的渲染結果，並在 PR 時比較差異，自動偵測視覺改動——無論是刻意的改版還是意外的樣式破壞。</p>

<book-code-block language="yaml" label="GitHub Actions — Chromatic CI 整合">
name: Chromatic

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  chromatic:
    name: Visual Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # 需要完整 git 歷史做比較

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Publish to Chromatic
        uses: chromaui/action@latest
        with:
          projectToken: \${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          buildScriptName: build:storybook
          # 只有顯著改動才阻斷 PR（避免抗鋸齒差異的假陽性）
          diffThreshold: 0.063
          # 自動接受非 UI 檔案的改動（如 README）
          onlyChanged: true
          # 未更新 stories 時跳過 Chromatic
          exitZeroOnChanges: true
          # Turbosnap：只截圖受改動影響的 Stories（加速 CI）
          zip: true
</book-code-block>

<book-code-block language="typescript" label="TypeScript — 為特定 Story 設定 Chromatic 截圖參數">
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

const meta: Meta = {
  title: 'Components/Modal',
  component: 'acme-modal',
  parameters: {
    // 全域：這個元件的所有 stories 都在 dark mode 下額外截圖
    chromatic: {
      modes: {
        light: { backgrounds: { value: '#ffffff' } },
        dark: { backgrounds: { value: '#0f172a' } },
      },
      // 等待動畫完成後再截圖
      delay: 300,
    },
  },
};

export default meta;

export const Open: StoryObj = {
  render: () =&gt; html\`
    &lt;acme-modal open headline="確認操作"&gt;
      &lt;p&gt;這個 Story 在 open 狀態截圖，確保 Modal 樣式不會回歸&lt;/p&gt;
      &lt;acme-button slot="footer-actions" variant="primary"&gt;確認&lt;/acme-button&gt;
    &lt;/acme-modal&gt;
  \`,
  parameters: {
    chromatic: {
      // 這個 Story 強制截圖（即使檔案未修改）
      disableSnapshot: false,
    },
  },
};

export const Closed: StoryObj = {
  render: () =&gt; html\`&lt;acme-modal headline="標題"&gt;內容&lt;/acme-modal&gt;\`,
  parameters: {
    chromatic: {
      // 關閉狀態下 Modal 不可見，跳過截圖以節省用量
      disableSnapshot: true,
    },
  },
};
</book-code-block>

<h2 id="ch30-s04">用 TypeDoc 與 custom-elements-manifest-viewer 建構 API 文件</h2>

<p>除了 Storybook 的互動文件，元件函式庫通常還需要一個靜態 API 文件站，供消費者查閱所有 property、事件、Slot 的詳細說明。</p>

<book-code-block language="json" label="package.json — 文件建構指令">
{
  "scripts": {
    "docs": "npm run docs:typedoc && npm run docs:cem-viewer",
    "docs:typedoc": "typedoc --options typedoc.json",
    "docs:cem-viewer": "cem-viewer --manifest custom-elements.json --outdir docs/api"
  },
  "devDependencies": {
    "typedoc": "^0.26.0",
    "typedoc-plugin-markdown": "^4.0.0",
    "@custom-elements-manifest/viewer": "^1.0.0"
  }
}
</book-code-block>

<book-code-block language="json" label="typedoc.json — TypeDoc 設定">
{
  "entryPoints": ["src/index.ts"],
  "entryPointStrategy": "expand",
  "out": "docs/api/typedoc",
  "plugin": ["typedoc-plugin-markdown"],
  "excludePrivate": true,
  "excludeProtected": false,
  "excludeInternal": true,
  "excludeExternals": true,
  "includeVersion": true,
  "categorizeByGroup": true,
  "categoryOrder": ["Atoms", "Molecules", "Organisms", "*"],
  "navigationLinks": {
    "Storybook": "https://your-storybook-url.com",
    "GitHub": "https://github.com/your-org/ui-components"
  },
  "readme": "README.md",
  "gitRevision": "main"
}
</book-code-block>

<book-code-block language="typescript" label="TypeScript — 完整的 JSDoc 標注範例（讓 TypeDoc 與 CEM 都能解析）">
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * 可折疊的手風琴元件，支援單開與多開模式。
 *
 * @summary 手風琴折疊面板
 *
 * @element acme-accordion
 *
 * @slot - 預設 Slot，接受 &lt;acme-accordion-item&gt; 元素
 *
 * @cssprop --acme-accordion-border - 面板間的分隔線樣式
 * @cssprop --acme-accordion-radius - 整體圓角大小
 *
 * @fires {CustomEvent&lt;{ value: string[] }&gt;} acme-change
 *   當展開的面板改變時觸發。detail.value 包含所有展開面板的 value 值。
 *
 * @example
 * \`\`\`html
 * &lt;acme-accordion&gt;
 *   &lt;acme-accordion-item value="item-1" summary="第一個面板"&gt;
 *     第一個面板的內容
 *   &lt;/acme-accordion-item&gt;
 *   &lt;acme-accordion-item value="item-2" summary="第二個面板"&gt;
 *     第二個面板的內容
 *   &lt;/acme-accordion-item&gt;
 * &lt;/acme-accordion&gt;
 * \`\`\`
 *
 * @category Molecules
 */
@customElement('acme-accordion')
export class AcmeAccordion extends LitElement {
  /**
   * 是否允許同時展開多個面板。
   * 設為 false 時，展開一個面板會自動關閉其他面板。
   *
   * @default false
   * @attr multiple
   */
  @property({ type: Boolean, reflect: true })
  multiple = false;

  /**
   * 目前展開的面板 value 值陣列。
   * 可用於設定初始展開狀態或程式化控制。
   *
   * @attr value（JSON 字串格式，如 '["item-1"]'）
   */
  @property({ type: Array })
  value: string[] = [];

  @state() private _expandedItems: Set&lt;string&gt; = new Set();

  static styles = css\`
    :host { display: block; }
    ::slotted(acme-accordion-item) {
      border-bottom: var(--acme-accordion-border, 1px solid #e2e8f0);
    }
    ::slotted(acme-accordion-item:last-child) { border-bottom: none; }
  \`;

  /**
   * 程式化展開指定面板。
   * @param value - 要展開的面板 value
   */
  expand(value: string): void {
    if (!this.multiple) this._expandedItems.clear();
    this._expandedItems.add(value);
    this.requestUpdate();
    this.emitChange();
  }

  /**
   * 程式化關閉指定面板。
   * @param value - 要關閉的面板 value
   */
  collapse(value: string): void {
    this._expandedItems.delete(value);
    this.requestUpdate();
    this.emitChange();
  }

  private emitChange() {
    this.dispatchEvent(new CustomEvent('acme-change', {
      detail: { value: [...this._expandedItems] },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    return html\`&lt;slot @slotchange=\${this.handleSlotChange}&gt;&lt;/slot&gt;\`;
  }

  private handleSlotChange = () =&gt; this.requestUpdate();
}
</book-code-block>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>Storybook 8 是元件互動文件的核心，CEM 驅動 Controls 自動化讓維護成本趨近於零，Chromatic 的視覺快照在每個 PR 把關樣式正確性，TypeDoc 生成靜態 API 文件站，四者共同構成元件函式庫的完整文件基礎設施。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch29">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">工具鏈深探：Vite、Rollup、esbuild 與 WTR</span>
    </a>
    <a class="footer-link" href="#ch31">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">四個端到端專案實作</span>
    </a>
  </div>
</div>
`
