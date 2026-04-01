export const metadata = {
  id: 29,
  part: 6,
  title: '工具鏈深探：Vite、Rollup、esbuild 與 WTR',
  tags: ['進階'] as string[],
  sections: [
    { slug: 'ch29-s01', title: '適用於 Web Components 的 Vite Plugin 生態系' },
    { slug: 'ch29-s02', title: '用 Rollup 建構函式庫：Externals、Tree-shaking 與 Chunk 分割' },
    { slug: 'ch29-s03', title: 'esbuild 帶來的快速開發回饋' },
    { slug: 'ch29-s04', title: 'Web Test Runner vs. Jest vs. Vitest — 各自的取捨' },
    { slug: 'ch29-s05', title: '元件函式庫的 CI/CD Pipeline 設計' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 29 · 第六部：發布、工具鏈與 Design System</div>
  <h1>工具鏈深探：Vite、Rollup、esbuild 與 WTR</h1>
  <p>工具鏈是 Web Components 開發體驗的決定性因素。本章深入比較四大主流工具的設計哲學與適用場景，從 Vite Plugin 生態、Rollup 的 Tree-shaking 策略，到測試工具的取捨分析，最終整合成一套完整的 CI/CD Pipeline。</p>
  <div class="chapter-tags"><span class="tag tag-advanced">進階</span></div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch29-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">適用於 Web Components 的 Vite Plugin 生態系</span>
    </a>
    <a class="catalog-item" href="#ch29-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">用 Rollup 建構函式庫：Externals、Tree-shaking 與 Chunk 分割</span>
    </a>
    <a class="catalog-item" href="#ch29-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">esbuild 帶來的快速開發回饋</span>
    </a>
    <a class="catalog-item" href="#ch29-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">Web Test Runner vs. Jest vs. Vitest — 各自的取捨</span>
    </a>
    <a class="catalog-item" href="#ch29-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">元件函式庫的 CI/CD Pipeline 設計</span>
    </a>
  </div>
</div>

<h2 id="ch29-s01">適用於 Web Components 的 Vite Plugin 生態系</h2>

<p>Vite 憑藉其基於 ESM 的開發伺服器與閃電般的 HMR，成為 Web Components 開發的首選工具。以下是最重要的 Vite Plugin：</p>

<book-code-block language="typescript" label="vite.config.ts — 完整的 Web Components 開發環境設定">
import { defineConfig } from 'vite';
import { litScss } from 'vite-plugin-lit-scss';
import { cemPlugin } from 'vite-plugin-cem';
import { resolve } from 'path';

export default defineConfig(({ mode }) =&gt; ({
  plugins: [
    // 1. vite-plugin-lit-scss：允許在 Lit 的 static styles 中匯入 SCSS 檔案
    litScss({
      // 將 SCSS 轉換為 Lit CSSResult，支援 HMR
      include: ['**/*.scss'],
    }),

    // 2. vite-plugin-cem：自動重新產生 custom-elements.json
    cemPlugin({
      // 每次儲存都重新分析並更新 CEM
      files: ['src/**/*.ts'],
      // 輸出位置
      output: 'custom-elements.json',
    }),
  ],

  // 開發伺服器設定
  server: {
    port: 3000,
    open: '/demo/index.html',
    // HMR 設定（對於 customElements.define 重複定義問題有特殊處理）
    hmr: {
      overlay: true,
    },
  },

  // 路徑別名
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@utils': resolve(__dirname, 'src/utils'),
    },
  },

  // 建構模式：函式庫模式
  build: mode === 'lib' ? {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) =&gt; \`index.\${format === 'es' ? 'js' : 'cjs'}\`,
    },
    rollupOptions: {
      external: [/^lit/, /^@lit/],
    },
  } : undefined,

  // CSS 預處理器全域注入（Token 變數）
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: \`@import "@/styles/tokens.scss";\`,
      },
    },
  },
}));
</book-code-block>

<book-code-block language="typescript" label="TypeScript — 自訂 Vite Plugin：自動注入元件版本號">
// vite-plugin-inject-version.ts
import type { Plugin } from 'vite';
import { readFileSync } from 'fs';

export function injectVersion(): Plugin {
  const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

  return {
    name: 'inject-version',
    // 在 transform 階段替換版本佔位符
    transform(code, id) {
      if (!id.endsWith('.ts') &amp;&amp; !id.endsWith('.js')) return null;
      if (!code.includes('__COMPONENT_VERSION__')) return null;

      return {
        code: code.replace(/__COMPONENT_VERSION__/g, JSON.stringify(pkg.version)),
        map: null,
      };
    },
  };
}

// 元件中使用：
// static version = __COMPONENT_VERSION__;
// 建構後會被替換為："1.2.3"
</book-code-block>

<h2 id="ch29-s02">用 Rollup 建構函式庫：Externals、Tree-shaking 與 Chunk 分割</h2>

<p>當 Vite 的函式庫模式無法滿足複雜的建構需求時（如多入口點的精細控制、複雜的 Chunk 分割策略），直接使用 Rollup 提供了更大的靈活性。</p>

<book-code-block language="javascript" label="rollup.config.js — 完整的函式庫建構設定">
import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { glob } from 'glob';
import { fileURLToPath } from 'url';
import { dirname, relative, extname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 動態發現所有元件入口點
const componentEntries = Object.fromEntries(
  glob.sync('src/components/**/*.ts', {
    ignore: ['**/*.test.ts', '**/*.stories.ts', '**/*.d.ts'],
  }).map(file =&gt; [
    // 產生相對路徑作為 key（如 components/button/index）
    relative('src', file.slice(0, file.length - extname(file).length)),
    fileURLToPath(new URL(file, import.meta.url)),
  ])
);

export default defineConfig([
  // === 建構目標一：ESM（現代打包工具使用）===
  {
    input: {
      index: 'src/index.ts',
      ...componentEntries,
    },
    output: {
      dir: 'dist/esm',
      format: 'esm',
      preserveModules: true,
      preserveModulesRoot: 'src',
      entryFileNames: '[name].js',
      // Source maps（方便消費者 debug）
      sourcemap: true,
    },
    external: [
      // 外部化所有 lit 相關依賴
      /^lit/,
      /^@lit/,
      /^tslib/,
    ],
    plugins: [
      resolve({ browser: true }),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist/types',
      }),
    ],
    // Tree-shaking 相關設定
    treeshake: {
      moduleSideEffects: (id) =&gt; {
        // customElements.define() 是副作用，不可 tree-shake
        return id.includes('src/components');
      },
      propertyReadSideEffects: false,
    },
  },
  // === 建構目標二：CJS（Node.js / Jest 使用）===
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
    },
    external: [/^lit/, /^@lit/],
    plugins: [
      resolve({ browser: false }),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
    ],
  },
]);
</book-code-block>

<h2 id="ch29-s03">esbuild 帶來的快速開發回饋</h2>

<p>esbuild 以 Go 撰寫，速度是 Rollup 的 10-100 倍，雖然 Tree-shaking 能力不如 Rollup，但在開發環境中提供接近即時的重新建構體驗，特別適合用於開發伺服器的快速打包。</p>

<book-code-block language="bash" label="Bash — esbuild 開發環境指令">
# 快速開發建構（不含型別檢查）
npx esbuild src/index.ts \
  --bundle \
  --format=esm \
  --outdir=dist-dev \
  --external:lit \
  --external:'@lit/*' \
  --sourcemap \
  --target=es2020

# 監看模式（儲存即重建，毫秒級）
npx esbuild src/index.ts \
  --bundle \
  --format=esm \
  --outdir=dist-dev \
  --external:lit \
  --watch \
  --sourcemap

# 建構單一元件（快速驗證）
npx esbuild src/components/button/index.ts \
  --bundle=false \
  --format=esm \
  --outfile=dist-dev/button.js \
  --sourcemap \
  --loader:.ts=ts
</book-code-block>

<book-code-block language="typescript" label="TypeScript — esbuild Node.js API（進階自訂建構流程）">
// build-dev.ts — 使用 esbuild API 建構開發版本
import * as esbuild from 'esbuild';
import { glob } from 'glob';

async function buildDev() {
  const entryPoints = await glob('src/components/**/*.ts', {
    ignore: ['**/*.test.ts', '**/*.stories.ts'],
  });

  const ctx = await esbuild.context({
    entryPoints,
    bundle: true,
    format: 'esm',
    outdir: 'dist-dev',
    outbase: 'src',
    external: ['lit', '@lit/*', 'tslib'],
    sourcemap: 'linked',
    target: ['es2020', 'chrome100', 'firefox100', 'safari15'],
    // 自訂 Plugin：處理 CSS 匯入
    plugins: [
      {
        name: 'css-module',
        setup(build) {
          build.onLoad({ filter: /\.css$/ }, async (args) =&gt; {
            const fs = await import('fs/promises');
            const css = await fs.readFile(args.path, 'utf-8');
            // 將 CSS 轉換為 CSSStyleSheet（用於 Constructable Stylesheets）
            return {
              contents: \`
                const sheet = new CSSStyleSheet();
                sheet.replaceSync(\${JSON.stringify(css)});
                export default sheet;
              \`,
              loader: 'js',
            };
          });
        },
      },
    ],
  });

  // 開發模式：監看 + 提供 HTTP 服務
  await ctx.watch();
  const { host, port } = await ctx.serve({ servedir: '.', port: 3001 });
  console.log(\`Dev server: http://\${host}:\${port}\`);
}

buildDev().catch(console.error);
</book-code-block>

<h2 id="ch29-s04">Web Test Runner vs. Jest vs. Vitest — 各自的取捨</h2>

<p>Web Components 涉及真實 DOM API（Shadow DOM、Custom Elements Registry），因此測試環境的選擇至關重要。以下是三大工具的詳細比較：</p>

<table>
  <thead>
    <tr><th>面向</th><th>Web Test Runner</th><th>Vitest</th><th>Jest</th></tr>
  </thead>
  <tbody>
    <tr><td>執行環境</td><td>真實瀏覽器（Chromium/Firefox/Safari）</td><td>jsdom / happy-dom（可選瀏覽器模式）</td><td>jsdom（Node.js 模擬）</td></tr>
    <tr><td>Custom Elements API</td><td>✅ 完整原生支援</td><td>⚠️ happy-dom 部分支援</td><td>❌ jsdom 不支援 Shadow DOM</td></tr>
    <tr><td>執行速度</td><td>中（啟動瀏覽器需時間）</td><td>快（Node.js 環境）</td><td>慢（啟動成本高）</td></tr>
    <tr><td>平行化</td><td>✅ 多瀏覽器平行</td><td>✅ Worker 線程平行</td><td>⚠️ 有限</td></tr>
    <tr><td>Lit 官方推薦</td><td>✅ 是</td><td>✅ 是（新版）</td><td>❌ 否</td></tr>
    <tr><td>Visual Regression</td><td>✅ 可整合 Percy/Chromatic</td><td>❌ 否</td><td>❌ 否</td></tr>
    <tr><td>TypeScript 支援</td><td>✅（需設定）</td><td>✅ 原生</td><td>⚠️（需 ts-jest）</td></tr>
    <tr><td>適合場景</td><td>元件互動、Shadow DOM、事件</td><td>邏輯單元測試、快速回饋</td><td>現有 React 專案共用</td></tr>
  </tbody>
</table>

<book-code-block language="javascript" label="web-test-runner.config.mjs — WTR 設定">
import { playwrightLauncher } from '@web/test-runner-playwright';
import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
  files: 'src/**/*.test.ts',
  nodeResolve: true,
  // 使用 esbuild 轉譯 TypeScript（比 tsc 快）
  plugins: [
    esbuildPlugin({
      ts: true,
      json: true,
      target: 'auto',
    }),
  ],
  // 多瀏覽器測試
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
    playwrightLauncher({ product: 'firefox' }),
    playwrightLauncher({ product: 'webkit' }),
  ],
  // 覆蓋率報告
  coverageConfig: {
    report: true,
    reportDir: 'coverage',
    threshold: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
};
</book-code-block>

<book-code-block language="typescript" label="TypeScript — Vitest 設定（含 happy-dom）">
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // happy-dom 提供比 jsdom 更好的 Web API 支援
    environment: 'happy-dom',
    // 為每個測試檔案設置全域工具
    setupFiles: ['./src/test-setup.ts'],
    // 覆蓋率
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['**/*.stories.ts', '**/*.config.*', 'dist/**'],
    },
    // 避免 customElements 重複定義問題
    pool: 'forks',
    isolate: true,
  },
});

// src/test-setup.ts
// 清理 customElements registry 避免測試間互相干擾
// （happy-dom 支援此操作，jsdom 不支援）
afterEach(() =&gt; {
  // 清理 DOM
  document.body.innerHTML = '';
});
</book-code-block>

<h2 id="ch29-s05">元件函式庫的 CI/CD Pipeline 設計</h2>

<p>一個成熟的元件函式庫 CI/CD Pipeline 需要在速度與嚴謹性之間取得平衡：PR 提交時快速回饋，合併到主幹時完整驗證，發布時自動化且安全。</p>

<book-code-block language="yaml" label="GitHub Actions — 完整 CI/CD Pipeline（.github/workflows/ci.yml）">
name: CI

on:
  push:
    branches: [main, 'release/*']
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  CACHE_KEY: v1

jobs:
  # ===== Job 1: 快速檢查（PR 提交時）=====
  lint-and-typecheck:
    name: Lint & TypeCheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci --prefer-offline
      - run: npm run lint
      - run: npm run typecheck

  # ===== Job 2: 單元測試（Vitest，快速）=====
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: codecov/codecov-action@v4
        with:
          token: \${{ secrets.CODECOV_TOKEN }}

  # ===== Job 3: 瀏覽器整合測試（WTR，較慢）=====
  browser-tests:
    name: Browser Tests
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium firefox webkit
      - run: npm run test:browser
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-results
          path: test-results/

  # ===== Job 4: 建構驗證 =====
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [unit-tests, browser-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npm run build:manifest
      # 驗證建構產出物的 bundle size
      - uses: andresz1/size-limit-action@v1
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  # ===== Job 5: 視覺回歸測試（Chromatic，僅 main 分支）=====
  visual-tests:
    name: Visual Regression
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    needs: build
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - uses: chromaui/action@latest
        with:
          projectToken: \${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          buildScriptName: build:storybook
          exitZeroOnChanges: true
</book-code-block>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>Vite 負責開發體驗，Rollup 負責生產建構的精細控制，esbuild 在開發環境提供毫秒級回饋，WTR 在真實瀏覽器中測試 Shadow DOM，Vitest 負責邏輯單元測試，CI/CD Pipeline 將這些工具串聯為自動化的品質保證流水線。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch28">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">用 Web Components 建構 Design System</span>
    </a>
    <a class="footer-link" href="#ch30">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">文件化與 Storybook</span>
    </a>
  </div>
</div>
`
