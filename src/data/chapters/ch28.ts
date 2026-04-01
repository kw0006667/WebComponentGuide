export const metadata = {
  id: 28,
  part: 6,
  title: '用 Web Components 建構 Design System',
  tags: ['專案實作', '進階'] as string[],
  sections: [
    { slug: 'ch28-s01', title: '架構層次：原子元件、複合元件與頁面級元件' },
    { slug: 'ch28-s02', title: 'Token 系統：從 Figma Tokens 到 CSS Custom Properties' },
    { slug: 'ch28-s03', title: '主題化 API 設計 — 讓客製化既安全又符合人體工學' },
    { slug: 'ch28-s04', title: 'Shoelace 與 Spectrum Web Components 真實案例研究' },
    { slug: 'ch28-s05', title: '跨框架消費：用單一來源服務所有框架' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 28 · 第六部：發布、工具鏈與 Design System</div>
  <h1>用 Web Components 建構 Design System</h1>
  <p>Design System 是企業前端一致性的基石，而 Web Components 是迄今為止最適合建構框架無關 Design System 的技術。本章從架構分層、Token 系統、主題化 API 設計，到真實開源案例研究，帶你掌握工業等級 Design System 的完整建構知識。</p>
  <div class="chapter-tags"><span class="tag tag-project">專案實作</span><span class="tag tag-advanced">進階</span></div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch28-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">架構層次：原子元件、複合元件與頁面級元件</span>
    </a>
    <a class="catalog-item" href="#ch28-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">Token 系統：從 Figma Tokens 到 CSS Custom Properties</span>
    </a>
    <a class="catalog-item" href="#ch28-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">主題化 API 設計 — 讓客製化既安全又符合人體工學</span>
    </a>
    <a class="catalog-item" href="#ch28-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">Shoelace 與 Spectrum Web Components 真實案例研究</span>
    </a>
    <a class="catalog-item" href="#ch28-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">跨框架消費：用單一來源服務所有框架</span>
    </a>
  </div>
</div>

<h2 id="ch28-s01">架構層次：原子元件、複合元件與頁面級元件</h2>

<p>Brad Frost 的 Atomic Design 方法論將 UI 分為五個層次，在 Web Components Design System 中對應如下：</p>

<book-code-block language="text" label="ASCII 架構圖 — Atomic Design 與 Web Components 的對應">
┌─────────────────────────────────────────────────────────┐
│                    Pages（頁面模板）                       │
│  &lt;checkout-page&gt;  &lt;dashboard-page&gt;  &lt;onboarding-wizard&gt; │
│  （消費各層元件組合，不發布到 npm，屬於應用程式層）          │
├─────────────────────────────────────────────────────────┤
│                 Organisms（有機體）                        │
│     &lt;acme-header&gt;  &lt;acme-data-table&gt;  &lt;acme-modal&gt;      │
│  （整合多個 Molecules，具備完整業務功能）                   │
├─────────────────────────────────────────────────────────┤
│                 Molecules（分子）                          │
│   &lt;acme-form-field&gt;  &lt;acme-card&gt;  &lt;acme-search-bar&gt;     │
│  （組合多個 Atoms，形成具備單一功能的 UI 單元）             │
├─────────────────────────────────────────────────────────┤
│                   Atoms（原子）                            │
│  &lt;acme-button&gt;  &lt;acme-input&gt;  &lt;acme-badge&gt;  &lt;acme-icon&gt; │
│  （最小的可複用 UI 單元，無外部依賴）                       │
├─────────────────────────────────────────────────────────┤
│           Tokens（設計令牌，非元件）                       │
│  :root { --color-primary: #3b82f6; --spacing-md: 16px }  │
│  （CSS Custom Properties，所有層次的樣式基礎）              │
└─────────────────────────────────────────────────────────┘

發布策略：
  npm @acme/tokens    → CSS Custom Properties（最小依賴）
  npm @acme/atoms     → 依賴 @acme/tokens
  npm @acme/molecules → 依賴 @acme/atoms
  npm @acme/organisms → 依賴 @acme/molecules
</book-code-block>

<p>分層的關鍵原則是<strong>向下依賴</strong>：上層可以使用下層元件，但下層不能引用上層。這保持了原子元件的高度可複用性與低耦合度。</p>

<book-code-block language="typescript" label="TypeScript — Atom 層：acme-badge 原子元件">
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * @element acme-badge
 * @slot - Badge label text
 */
@customElement('acme-badge')
export class AcmeBadge extends LitElement {
  @property({ reflect: true })
  variant: 'default' | 'success' | 'warning' | 'danger' = 'default';

  @property({ type: Boolean, reflect: true })
  pill = false;

  static styles = css\`
    :host { display: inline-flex; }
    .badge {
      padding: 2px var(--acme-badge-padding-x, 8px);
      font-size: var(--acme-badge-font-size, 12px);
      font-weight: 600;
      border-radius: var(--acme-badge-radius, 4px);
      background: var(--acme-badge-bg, var(--color-neutral-100, #f1f5f9));
      color: var(--acme-badge-color, var(--color-neutral-700, #334155));
    }
    :host([variant="success"]) .badge {
      background: var(--color-success-100, #dcfce7);
      color: var(--color-success-700, #15803d);
    }
    :host([variant="warning"]) .badge {
      background: var(--color-warning-100, #fef9c3);
      color: var(--color-warning-700, #a16207);
    }
    :host([variant="danger"]) .badge {
      background: var(--color-danger-100, #fee2e2);
      color: var(--color-danger-700, #b91c1c);
    }
    :host([pill]) .badge { border-radius: 999px; }
  \`;

  render() {
    return html\`&lt;span class="badge"&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/span&gt;\`;
  }
}
</book-code-block>

<h2 id="ch28-s02">Token 系統：從 Figma Tokens 到 CSS Custom Properties</h2>

<p>Design Token 是設計決策的原子單位，連接 Figma 設計稿與程式碼實作。一個完善的 Token 系統包含三個層次：</p>

<book-code-block language="css" label="CSS — 三層 Token 架構">
/* ===== 層次一：原始值 Token（Primitive Tokens）===== */
/* 這層不直接被元件使用，只作為語義層的來源 */
:root {
  /* 顏色原始值 */
  --primitive-blue-50: #eff6ff;
  --primitive-blue-500: #3b82f6;
  --primitive-blue-600: #2563eb;
  --primitive-blue-700: #1d4ed8;
  --primitive-slate-100: #f1f5f9;
  --primitive-slate-700: #334155;
  --primitive-slate-900: #0f172a;

  /* 間距原始值 */
  --primitive-space-1: 4px;
  --primitive-space-2: 8px;
  --primitive-space-4: 16px;
  --primitive-space-6: 24px;
  --primitive-space-8: 32px;

  /* 字型大小原始值 */
  --primitive-text-xs: 12px;
  --primitive-text-sm: 14px;
  --primitive-text-base: 16px;
  --primitive-text-lg: 18px;
  --primitive-text-xl: 20px;
}

/* ===== 層次二：語義 Token（Semantic Tokens）===== */
/* 描述用途，而非具體值 */
:root {
  --color-primary: var(--primitive-blue-500);
  --color-primary-hover: var(--primitive-blue-600);
  --color-primary-active: var(--primitive-blue-700);
  --color-primary-subtle: var(--primitive-blue-50);

  --color-surface: #ffffff;
  --color-surface-raised: var(--primitive-slate-100);
  --color-text-primary: var(--primitive-slate-900);
  --color-text-secondary: var(--primitive-slate-700);

  --spacing-xs: var(--primitive-space-1);
  --spacing-sm: var(--primitive-space-2);
  --spacing-md: var(--primitive-space-4);
  --spacing-lg: var(--primitive-space-6);
  --spacing-xl: var(--primitive-space-8);

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* 深色主題：只需覆蓋語義層，原始值保持不變 */
  @media (prefers-color-scheme: dark) {
    --color-primary: var(--primitive-blue-500);
    --color-surface: #0f172a;
    --color-surface-raised: #1e293b;
    --color-text-primary: #f8fafc;
    --color-text-secondary: #94a3b8;
  }
}

/* ===== 層次三：元件 Token（Component Tokens）===== */
/* 元件專屬，提供精細控制入口 */
:root {
  --acme-button-height-sm: 32px;
  --acme-button-height-md: 40px;
  --acme-button-height-lg: 48px;
  --acme-button-font-size-sm: var(--primitive-text-xs);
  --acme-button-font-size-md: var(--primitive-text-sm);
  --acme-button-font-size-lg: var(--primitive-text-base);
}
</book-code-block>

<p>搭配 Style Dictionary 可以從 JSON 格式的 Token 定義自動產生 CSS、JS、iOS/Android 等多種格式：</p>

<book-code-block language="json" label="tokens/color.json — Style Dictionary Token 定義">
{
  "color": {
    "primitive": {
      "blue": {
        "500": { "value": "#3b82f6", "type": "color" },
        "600": { "value": "#2563eb", "type": "color" }
      }
    },
    "semantic": {
      "primary": {
        "default": { "value": "{color.primitive.blue.500}", "type": "color" },
        "hover":   { "value": "{color.primitive.blue.600}", "type": "color" }
      }
    }
  }
}
</book-code-block>

<h2 id="ch28-s03">主題化 API 設計 — 讓客製化既安全又符合人體工學</h2>

<p>Web Components 的主題化有三個工具：CSS Custom Properties（穿透 Shadow DOM 的 CSS 變數）、<code>::part()</code> 偽元素（直接樣式化 Shadow DOM 內部元件）、以及 Slots（結構替換）。良好的主題化 API 設計讓三者各司其職。</p>

<book-code-block language="typescript" label="TypeScript — 具備完整主題化 API 的元件設計">
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * @element acme-card
 *
 * @csspart base       - 卡片的根容器（用於覆蓋 padding、border-radius 等）
 * @csspart header     - 頭部區域
 * @csspart body       - 主體內容區域
 * @csspart footer     - 底部區域
 *
 * @cssprop --acme-card-bg           - 背景色，預設 var(--color-surface)
 * @cssprop --acme-card-border       - 邊框，預設 1px solid #e2e8f0
 * @cssprop --acme-card-radius       - 圓角，預設 var(--radius-md, 8px)
 * @cssprop --acme-card-padding      - 內距，預設 var(--spacing-md, 16px)
 * @cssprop --acme-card-shadow       - 陰影，預設 0 1px 3px rgba(0,0,0,.1)
 */
@customElement('acme-card')
export class AcmeCard extends LitElement {
  @property({ type: Boolean, reflect: true })
  elevated = false;

  static styles = css\`
    :host { display: block; }

    .base {
      background: var(--acme-card-bg, var(--color-surface, #fff));
      border: var(--acme-card-border, 1px solid #e2e8f0);
      border-radius: var(--acme-card-radius, var(--radius-md, 8px));
      box-shadow: var(--acme-card-shadow, 0 1px 3px rgba(0,0,0,.1));
      overflow: hidden;
    }

    :host([elevated]) .base {
      box-shadow: var(--acme-card-shadow-elevated, 0 4px 16px rgba(0,0,0,.15));
    }

    .header {
      padding: var(--acme-card-header-padding, var(--acme-card-padding, var(--spacing-md, 16px)));
      border-bottom: var(--acme-card-header-border, 1px solid #e2e8f0);
    }

    .header:empty { display: none; }

    .body {
      padding: var(--acme-card-padding, var(--spacing-md, 16px));
    }

    .footer {
      padding: var(--acme-card-footer-padding, var(--acme-card-padding, var(--spacing-md, 16px)));
      border-top: var(--acme-card-footer-border, 1px solid #e2e8f0);
    }

    .footer:empty { display: none; }
  \`;

  render() {
    return html\`
      &lt;div part="base" class="base"&gt;
        &lt;div part="header" class="header"&gt;
          &lt;slot name="header"&gt;&lt;/slot&gt;
        &lt;/div&gt;
        &lt;div part="body" class="body"&gt;
          &lt;slot&gt;&lt;/slot&gt;
        &lt;/div&gt;
        &lt;div part="footer" class="footer"&gt;
          &lt;slot name="footer"&gt;&lt;/slot&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    \`;
  }
}
</book-code-block>

<book-code-block language="css" label="CSS — 消費者如何使用三層主題化 API">
/* 方式一：CSS Custom Properties（推薦，高層次控制）*/
acme-card {
  --acme-card-bg: #f8fafc;
  --acme-card-radius: 16px;
  --acme-card-shadow: 0 8px 32px rgba(59, 130, 246, .15);
}

/* 方式二：::part() 偽元素（細粒度控制）*/
acme-card::part(header) {
  background: var(--color-primary-subtle, #eff6ff);
  font-weight: 700;
}

acme-card::part(base) {
  border: 2px solid var(--color-primary, #3b82f6);
}

/* 方式三：傳遞 Slot 內容（結構替換）*/
/* &lt;acme-card&gt;
     &lt;div slot="header"&gt;完全自訂的頭部 HTML&lt;/div&gt;
     &lt;p&gt;主體內容&lt;/p&gt;
   &lt;/acme-card&gt; */
</book-code-block>

<h2 id="ch28-s04">Shoelace 與 Spectrum Web Components 真實案例研究</h2>

<p><strong>Shoelace（現為 Web Awesome）</strong>是目前最受歡迎的 Web Components Design System，完全框架無關，基於 Lit 建構。其設計哲學是「讓 Web Components 的使用體驗像使用原生 HTML 元素一樣自然」。</p>

<book-code-block language="html" label="HTML — Shoelace sl-button 使用範例">
&lt;!-- 安裝：npm install @shoelace-style/shoelace --&gt;
&lt;!-- 使用 CDN（無需安裝）--&gt;
&lt;link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.15.0/cdn/themes/light.css" /&gt;
&lt;script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.15.0/cdn/shoelace-autoloader.js"&gt;&lt;/script&gt;

&lt;!-- 基本使用 --&gt;
&lt;sl-button&gt;預設按鈕&lt;/sl-button&gt;
&lt;sl-button variant="primary"&gt;主要按鈕&lt;/sl-button&gt;
&lt;sl-button variant="danger" outline&gt;危險操作&lt;/sl-button&gt;
&lt;sl-button size="small" pill&gt;小型圓角按鈕&lt;/sl-button&gt;

&lt;!-- 帶圖示的按鈕 --&gt;
&lt;sl-button&gt;
  &lt;sl-icon slot="prefix" name="gear"&gt;&lt;/sl-icon&gt;
  設定
&lt;/sl-button&gt;

&lt;!-- 主題化：使用 CSS Custom Properties --&gt;
&lt;style&gt;
  :root {
    --sl-color-primary-600: #7c3aed;  /* 覆蓋主色為紫色 */
    --sl-border-radius-medium: 12px;  /* 覆蓋圓角 */
  }
&lt;/style&gt;

&lt;!-- 精細控制：::part() --&gt;
&lt;style&gt;
  sl-button::part(base) {
    font-family: 'Comic Sans MS', cursive; /* 完全覆蓋按鈕樣式 */
  }
&lt;/style&gt;
</book-code-block>

<p><strong>Adobe Spectrum Web Components</strong>是 Adobe 將其 Spectrum Design System 以 Web Components 形式開源的實作，展示了企業級 Design System 如何處理複雜的 ARIA 無障礙需求。</p>

<book-code-block language="html" label="HTML — Spectrum Web Components 使用範例">
&lt;!-- 安裝特定元件：npm install @spectrum-web-components/button --&gt;
&lt;!-- 主題套用 --&gt;
&lt;sp-theme system="spectrum" color="light" scale="medium"&gt;
  &lt;sp-button variant="accent"&gt;Accent Button&lt;/sp-button&gt;
  &lt;sp-button variant="secondary" treatment="outline"&gt;Outline Button&lt;/sp-button&gt;

  &lt;sp-textfield label="電子郵件" type="email"&gt;&lt;/sp-textfield&gt;

  &lt;sp-dialog-wrapper
    headline="確認刪除"
    confirm-label="刪除"
    cancel-label="取消"
    dismissable
  &gt;
    &lt;p&gt;此操作無法復原，確定要刪除此項目嗎？&lt;/p&gt;
  &lt;/sp-dialog-wrapper&gt;
&lt;/sp-theme&gt;

&lt;!-- 深色主題 --&gt;
&lt;sp-theme system="spectrum" color="dark" scale="large"&gt;
  &lt;sp-button variant="accent"&gt;深色主題按鈕&lt;/sp-button&gt;
&lt;/sp-theme&gt;
</book-code-block>

<h2 id="ch28-s05">跨框架消費：用單一來源服務所有框架</h2>

<p>Web Components Design System 的核心價值在於「一次撰寫，跨框架使用」。然而，React 在傳遞複雜 property（非字串）和監聽自訂事件時有些摩擦。解決方案是為每個主要框架提供薄薄的 wrapper：</p>

<book-code-block language="typescript" label="TypeScript — 自動產生 React wrapper 的工具">
// scripts/generate-react-wrappers.ts
// 讀取 custom-elements.json，為每個元件產生 React wrapper

import { createComponent } from '@lit/react';
import React from 'react';

// 手動版本（每個元件一個 wrapper）
import { AcmeButton as AcmeButtonWC } from '@acme/ui-components/button';

export const AcmeButton = createComponent({
  tagName: 'acme-button',
  elementClass: AcmeButtonWC,
  react: React,
  // 將自訂事件映射為 React 的 onXxx prop
  events: {
    onAcmeClick: 'acme-click',
    onAcmeFocus: 'acme-focus',
    onAcmeBlur: 'acme-blur',
  },
});

// 消費者可以像使用 React 元件一樣使用
// &lt;AcmeButton variant="primary" onAcmeClick={(e) =&gt; console.log(e.detail)}&gt;
//   Click me
// &lt;/AcmeButton&gt;
</book-code-block>

<book-code-block language="typescript" label="TypeScript — Vue 3 消費 Web Components（幾乎無需 wrapper）">
// main.ts — Vue 3 設定
import { createApp } from 'vue';
import App from './App.vue';

// 告訴 Vue 哪些標籤是自訂元素，不要嘗試解析為 Vue 元件
const app = createApp(App);
app.config.compilerOptions.isCustomElement = (tag) =&gt; tag.startsWith('acme-');
app.mount('#app');
</book-code-block>

<book-code-block language="typescript" label="TypeScript — Angular 消費 Web Components">
// app.module.ts — Angular 設定
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

// 匯入元件定義（觸發 customElements.define）
import '@acme/ui-components';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // 允許自訂元素標籤
  bootstrap: [AppComponent],
})
export class AppModule {}

// app.component.html 中直接使用：
// &lt;acme-button variant="primary" (acme-click)="handleClick($event)"&gt;
//   Angular 中使用 Web Components
// &lt;/acme-button&gt;
</book-code-block>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>Web Components Design System 以 Token 系統為基礎、以 Atomic Design 為架構、以 CSS Custom Properties 和 ::part() 為主題化 API，讓同一套元件可以無縫服務 React、Vue、Angular 等所有框架，Shoelace 和 Spectrum 是這個模式的最佳現實驗證。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch27">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">將 Web Component 函式庫發布到 npm</span>
    </a>
    <a class="footer-link" href="#ch29">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">工具鏈深探：Vite、Rollup、esbuild 與 WTR</span>
    </a>
  </div>
</div>
`
