export const metadata = {
  id: 27,
  part: 6,
  title: '將 Web Component 函式庫發布到 npm',
  tags: ['實用技巧'] as string[],
  sections: [
    { slug: 'ch27-s01', title: 'package.json exports 欄位：同時支援 ESM、CJS 與 TypeScript 型別' },
    { slug: 'ch27-s02', title: '打包策略：一次建構，到處消費' },
    { slug: 'ch27-s03', title: 'Custom Elements Manifest（custom-elements.json）與 IDE 整合' },
    { slug: 'ch27-s04', title: 'Semantic Versioning 與 HTML API 的 Breaking Change 問題' },
    { slug: 'ch27-s05', title: '用 Changesets 實現自動化發布流程' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 27 · 第六部：發布、工具鏈與 Design System</div>
  <h1>將 Web Component 函式庫發布到 npm</h1>
  <p>Web Components 的最大優勢之一是框架無關性，但「框架無關」要真正落地，需要一套完整的發布基礎設施：正確的 exports 映射、Custom Elements Manifest 讓 IDE 智能補全、以及能夠安全管理 HTML API 破壞性變更的版本策略。</p>
  <div class="chapter-tags"><span class="tag tag-practical">實用技巧</span></div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch27-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">package.json exports 欄位：同時支援 ESM、CJS 與 TypeScript 型別</span>
    </a>
    <a class="catalog-item" href="#ch27-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">打包策略：一次建構，到處消費</span>
    </a>
    <a class="catalog-item" href="#ch27-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">Custom Elements Manifest 與 IDE 整合</span>
    </a>
    <a class="catalog-item" href="#ch27-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">Semantic Versioning 與 HTML API 的 Breaking Change 問題</span>
    </a>
    <a class="catalog-item" href="#ch27-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">用 Changesets 實現自動化發布流程</span>
    </a>
  </div>
</div>

<h2 id="ch27-s01">package.json exports 欄位：同時支援 ESM、CJS 與 TypeScript 型別</h2>

<p>現代 npm 套件需要同時服務多種消費場景：在瀏覽器中直接使用 ESM、在 Node.js（SSR/測試）環境使用 CJS、以及在 TypeScript 專案中獲得完整型別支援。<code>exports</code> 欄位是這一切的關鍵。</p>

<book-code-block language="json" label="package.json — 完整的 exports 映射設定">
{
  "name": "@acme/ui-components",
  "version": "1.0.0",
  "description": "Framework-agnostic Web Components library",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "default": "./dist/index.js"
    },
    "./button": {
      "types": "./dist/components/button/index.d.ts",
      "import": "./dist/components/button/index.js",
      "require": "./dist/components/button/index.cjs"
    },
    "./card": {
      "types": "./dist/components/card/index.d.ts",
      "import": "./dist/components/card/index.js",
      "require": "./dist/components/card/index.cjs"
    },
    "./styles": "./dist/styles/global.css",
    "./custom-elements.json": "./custom-elements.json"
  },
  "files": [
    "dist",
    "custom-elements.json",
    "README.md"
  ],
  "sideEffects": [
    "dist/index.js",
    "dist/index.cjs",
    "**/*.css"
  ],
  "keywords": ["web-components", "custom-elements", "lit", "design-system"],
  "peerDependencies": {
    "lit": "^3.0.0"
  },
  "peerDependenciesMeta": {
    "lit": { "optional": true }
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "@custom-elements-manifest/analyzer": "^0.10.0",
    "vite": "^5.0.0",
    "typescript": "^5.3.0"
  },
  "scripts": {
    "build": "vite build && tsc --emitDeclarationOnly",
    "build:manifest": "cem analyze --globs 'src/**/*.ts'",
    "release": "changeset publish",
    "prepublishOnly": "npm run build && npm run build:manifest"
  },
  "customElements": "custom-elements.json"
}
</book-code-block>

<book-callout variant="tip" title="sideEffects 欄位的重要性">
  <p><code>sideEffects</code> 告訴打包工具哪些模組有副作用（如呼叫 <code>customElements.define()</code>）、不可被 Tree-shaking 移除。若設為 <code>false</code>，打包工具可能移除 define 呼叫，導致元件未被注册。入口點 JS 和所有 CSS 都應列入 sideEffects。</p>
</book-callout>

<h2 id="ch27-s02">打包策略：一次建構，到處消費</h2>

<p>Web Components 函式庫的建構目標是產出 ESM 與 CJS 兩種格式，同時保持外部依賴（如 Lit）不打包進去（Externalize），讓消費者的打包工具做 Tree-shaking。</p>

<book-code-block language="typescript" label="vite.config.ts — 函式庫模式建構設定">
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      // 多個入口點（按需引入）
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        button: resolve(__dirname, 'src/components/button/index.ts'),
        card: resolve(__dirname, 'src/components/card/index.ts'),
        'data-table': resolve(__dirname, 'src/components/data-table/index.ts'),
      },
      formats: ['es', 'cjs'],
      // 根據格式決定副檔名
      fileName: (format, entryName) =&gt;
        format === 'es' ? \`\${entryName}.js\` : \`\${entryName}.cjs\`,
    },
    rollupOptions: {
      // 外部化依賴：不打包進產出物
      external: [
        'lit',
        'lit/decorators.js',
        'lit/directives/repeat.js',
        'lit/directives/if-defined.js',
        /^lit\//,   // Regex：匹配所有 lit/* 路徑
      ],
      output: {
        // 保留模組結構（不合併成單一檔案）
        preserveModules: true,
        preserveModulesRoot: 'src',
        // ESM 產出使用 named exports
        exports: 'named',
        // 為 CSS 注入提供全域變數（若有）
        globals: {
          lit: 'Lit',
        },
      },
    },
    // 產出型別宣告（搭配 tsc）
    sourcemap: true,
    minify: false, // 函式庫不應 minify，讓消費者自行決定
  },
});
</book-code-block>

<book-code-block language="json" label="tsconfig.json — 函式庫專用 TypeScript 設定">
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "strict": true,
    "declaration": true,
    "declarationDir": "./dist",
    "declarationMap": true,
    "emitDeclarationOnly": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts", "src/**/*.stories.ts"]
}
</book-code-block>

<h2 id="ch27-s03">Custom Elements Manifest（custom-elements.json）與 IDE 整合</h2>

<p>Custom Elements Manifest（CEM）是一個 JSON 格式的規格，描述你的 Web Components 的所有公開 API：屬性（attributes）、property、事件（events）、Slot、CSS Parts 與 CSS Custom Properties。CEM 讓 VS Code 等 IDE 能夠為 HTML 中的自訂元素標籤提供智能補全與懸停文件。</p>

<book-code-block language="json" label="custom-elements.json — CEM 結構範例（節錄）">
{
  "schemaVersion": "1.0.0",
  "readme": "README.md",
  "modules": [
    {
      "kind": "javascript-module",
      "path": "src/components/button/index.ts",
      "declarations": [
        {
          "kind": "class",
          "description": "A versatile button component with multiple variants.",
          "name": "AcmeButton",
          "tagName": "acme-button",
          "customElement": true,
          "attributes": [
            {
              "name": "variant",
              "type": { "text": "'primary' | 'secondary' | 'danger'" },
              "default": "'primary'",
              "description": "Visual style variant of the button."
            },
            {
              "name": "disabled",
              "type": { "text": "boolean" },
              "default": "false",
              "description": "Whether the button is disabled."
            },
            {
              "name": "size",
              "type": { "text": "'sm' | 'md' | 'lg'" },
              "default": "'md'",
              "description": "Size of the button."
            }
          ],
          "events": [
            {
              "name": "acme-click",
              "type": { "text": "CustomEvent&lt;{ originalEvent: MouseEvent }&gt;" },
              "description": "Fired when the button is clicked (not fired when disabled)."
            }
          ],
          "slots": [
            {
              "name": "",
              "description": "Default slot for button label text."
            },
            {
              "name": "icon-start",
              "description": "Icon placed before the label."
            }
          ],
          "cssProperties": [
            {
              "name": "--acme-button-bg",
              "description": "Background color of the button.",
              "default": "var(--color-primary, #3b82f6)"
            }
          ],
          "cssParts": [
            {
              "name": "base",
              "description": "The inner &lt;button&gt; element."
            }
          ]
        }
      ],
      "exports": [
        { "kind": "custom-element-definition", "name": "acme-button", "declaration": { "name": "AcmeButton" } }
      ]
    }
  ]
}
</book-code-block>

<p>使用 <code>@custom-elements-manifest/analyzer</code> 可以從 TypeScript JSDoc 自動產生 CEM，無需手寫：</p>

<book-code-block language="typescript" label="TypeScript — JSDoc 標注讓 CEM analyzer 自動解析">
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * A versatile button component with multiple variants.
 *
 * @element acme-button
 *
 * @slot - Default slot for button label text.
 * @slot icon-start - Icon placed before the label.
 *
 * @cssprop --acme-button-bg - Background color. Default: var(--color-primary, #3b82f6)
 * @cssprop --acme-button-radius - Border radius. Default: 6px
 *
 * @csspart base - The inner &lt;button&gt; element.
 *
 * @fires {CustomEvent&lt;{ originalEvent: MouseEvent }&gt;} acme-click - Fired on click.
 */
@customElement('acme-button')
export class AcmeButton extends LitElement {
  /**
   * Visual style variant of the button.
   * @attr variant
   */
  @property({ reflect: true })
  variant: 'primary' | 'secondary' | 'danger' = 'primary';

  /**
   * Whether the button is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  static styles = css\`
    :host { display: inline-flex; }
    button { /* ... */ }
  \`;

  render() {
    return html\`
      &lt;button
        part="base"
        ?disabled=\${this.disabled}
        @click=\${(e: MouseEvent) =&gt; this.dispatchEvent(new CustomEvent('acme-click', {
          detail: { originalEvent: e }, bubbles: true, composed: true,
        }))}
      &gt;
        &lt;slot name="icon-start"&gt;&lt;/slot&gt;
        &lt;slot&gt;&lt;/slot&gt;
      &lt;/button&gt;
    \`;
  }
}
</book-code-block>

<h2 id="ch27-s04">Semantic Versioning 與 HTML API 的 Breaking Change 問題</h2>

<p>Web Components 的公開 API 不只是 JavaScript API，還包括 HTML API（屬性名稱、事件名稱、Slot 名稱、CSS Parts）。HTML API 的破壞性變更對消費者的影響往往更隱蔽，因為 IDE 無法自動偵測 HTML 中的斷點。</p>

<table>
  <thead>
    <tr><th>變更類型</th><th>SemVer 等級</th><th>範例</th></tr>
  </thead>
  <tbody>
    <tr><td>新增 attribute（有預設值）</td><td>Patch / Minor</td><td>新增 <code>size="md"</code>（預設值）</td></tr>
    <tr><td>重新命名 attribute</td><td>Major</td><td><code>color</code> → <code>variant</code></td></tr>
    <tr><td>移除 attribute</td><td>Major</td><td>移除 <code>deprecated-attr</code></td></tr>
    <tr><td>改變 attribute 型別</td><td>Major</td><td><code>count="5"</code>（字串）→ property only（非字串）</td></tr>
    <tr><td>重新命名事件</td><td>Major</td><td><code>click</code> → <code>acme-click</code></td></tr>
    <tr><td>改變事件 detail 結構</td><td>Major</td><td><code>detail.value</code> → <code>detail.newValue</code></td></tr>
    <tr><td>重新命名 CSS Part</td><td>Major</td><td><code>::part(button)</code> → <code>::part(base)</code></td></tr>
    <tr><td>重新命名 Slot</td><td>Major</td><td><code>slot="icon"</code> → <code>slot="icon-start"</code></td></tr>
    <tr><td>改變 display 預設值</td><td>Major</td><td><code>display: inline</code> → <code>display: block</code></td></tr>
    <tr><td>新增 CSS Custom Property（有預設值）</td><td>Minor</td><td>新增 <code>--acme-button-radius</code></td></tr>
  </tbody>
</table>

<book-code-block language="typescript" label="TypeScript — 使用 @deprecated JSDoc 優雅地廢棄 API">
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('acme-button')
export class AcmeButton extends LitElement {
  @property({ reflect: true })
  variant: 'primary' | 'secondary' | 'danger' = 'primary';

  /**
   * @deprecated 請使用 \`variant\` 屬性取代。將在 v3.0 移除。
   * @attr color
   */
  @property({ reflect: true })
  get color(): string {
    return this.variant;
  }
  set color(value: string) {
    console.warn('[acme-button] \`color\` attribute is deprecated. Use \`variant\` instead.');
    this.variant = value as 'primary' | 'secondary' | 'danger';
  }

  // 屬性改名的遷移橋接
  attributeChangedCallback(name: string, old: string | null, value: string | null) {
    if (name === 'color') {
      console.warn('[acme-button] \`color\` attribute is deprecated, use \`variant\`');
      // 透明地轉發到新 attribute
      if (value !== null) this.setAttribute('variant', value);
      return;
    }
    super.attributeChangedCallback(name, old, value);
  }

  render() {
    return html\`&lt;button&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/button&gt;\`;
  }
}
</book-code-block>

<h2 id="ch27-s05">用 Changesets 實現自動化發布流程</h2>

<p>Changesets 是 Atlassian 開源的版本管理工具，特別適合 monorepo 和需要維護 changelog 的元件函式庫。它將「記錄變更意圖」與「執行版本升級」分離，讓 CI/CD 流程安全可預測。</p>

<book-code-block language="bash" label="Bash — Changesets 工作流程">
# 1. 初始化（僅需一次）
npx changeset init
# 產生 .changeset/ 目錄與 config.json

# 2. 開發者完成功能後，記錄變更意圖
npx changeset add
# 互動式選擇：major / minor / patch
# 輸入變更描述
# 產生 .changeset/random-name.md 檔案（提交到 git）

# 3. 在 CI 中（PR 合併後）執行版本升級
npx changeset version
# 根據所有 .changeset/*.md 計算正確的版本號
# 更新 package.json 與 CHANGELOG.md
# 刪除已處理的 .changeset/*.md

# 4. 發布到 npm
npx changeset publish
# 執行 npm publish（可在 package.json scripts 中配置 prepublishOnly）
</book-code-block>

<book-code-block language="json" label=".changeset/config.json — Changesets 設定">
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "acme-org/ui-components" }],
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [],
  "privatePackages": { "version": true, "tag": false },
  "___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH": {
    "onlyUpdatePeerDependentsWhenOutOfRange": true
  }
}
</book-code-block>

<book-code-block language="yaml" label="GitHub Actions — 自動化發布 CI/CD（.github/workflows/release.yml）">
name: Release

on:
  push:
    branches: [main]

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      id-token: write  # npm provenance

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          registry-url: https://registry.npmjs.org

      - run: npm ci

      - name: Build
        run: npm run build

      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          publish: npm run release
          title: "chore: release packages"
          commit: "chore: release packages"
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
          NPM_CONFIG_PROVENANCE: true  # npm provenance (supply chain security)
</book-code-block>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>正確的 exports 映射讓你的套件在所有環境都能工作，Custom Elements Manifest 是智能 IDE 整合的基礎，HTML API 的破壞性變更比 JS API 更難察覺、應給予更多保護，Changesets 讓版本管理與 changelog 維護自動化且安全。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch26">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">偵錯 Web Components</span>
    </a>
    <a class="footer-link" href="#ch28">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">用 Web Components 建構 Design System</span>
    </a>
  </div>
</div>
`
