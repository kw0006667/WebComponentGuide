export const metadata = {
  id: 19,
  part: 4,
  title: 'Server-Side Rendering 與 Declarative Shadow DOM',
  tags: ['進階', '面試重點'] as string[],
  sections: [
    { slug: 'ch19-s01', title: 'SSR 的核心難題：為什麼 Shadow DOM 難以序列化' },
    { slug: 'ch19-s02', title: 'Declarative Shadow DOM（<template shadowrootmode>）深入解析' },
    { slug: 'ch19-s03', title: '在 Node.js 使用 Lit SSR（@lit-labs/ssr）的完整流程' },
    { slug: 'ch19-s04', title: 'Hydration 策略：Full、Partial 與 Resumable 的比較' },
    { slug: 'ch19-s05', title: 'DSD 搭配 Astro、Next.js 與 Express 的實作方式' },
    { slug: 'ch19-interview', title: '面試題：Web Components 如何處理 SSR？什麼是 Declarative Shadow DOM？' },
  ],
} as const

export const content = `
<div class="chapter-header">
  <div class="chapter-num">Chapter 19 · 第四部：進階模式與系統架構</div>
  <h1>Server-Side Rendering 與 Declarative Shadow DOM</h1>
  <p>Shadow DOM 的封裝特性使傳統 SSR 幾乎不可能實現，直到 Declarative Shadow DOM 的出現才根本性地改變了局面。本章從問題根源出發，完整解析 DSD 機制、Lit SSR 工作流程，以及在現代框架中的整合方式。</p>
  <div class="chapter-tags">
    <span class="tag tag-advanced">進階</span>
    <span class="tag tag-interview">面試重點</span>
  </div>
</div>

<div class="chapter-catalog">
  <div class="chapter-catalog-label">本章段落總覽</div>
  <div class="chapter-catalog-grid">
    <a class="catalog-item" href="#ch19-s01">
      <span class="catalog-item-num">01</span>
      <span class="catalog-item-title">SSR 的核心難題：為什麼 Shadow DOM 難以序列化</span>
    </a>
    <a class="catalog-item" href="#ch19-s02">
      <span class="catalog-item-num">02</span>
      <span class="catalog-item-title">Declarative Shadow DOM 深入解析</span>
    </a>
    <a class="catalog-item" href="#ch19-s03">
      <span class="catalog-item-num">03</span>
      <span class="catalog-item-title">在 Node.js 使用 Lit SSR 的完整流程</span>
    </a>
    <a class="catalog-item" href="#ch19-s04">
      <span class="catalog-item-num">04</span>
      <span class="catalog-item-title">Hydration 策略：Full、Partial 與 Resumable 的比較</span>
    </a>
    <a class="catalog-item" href="#ch19-s05">
      <span class="catalog-item-num">05</span>
      <span class="catalog-item-title">DSD 搭配 Astro、Next.js 與 Express 的實作方式</span>
    </a>
    <a class="catalog-item" href="#ch19-interview">
      <span class="catalog-item-num">06</span>
      <span class="catalog-item-title">面試題：Web Components 如何處理 SSR？</span>
    </a>
  </div>
</div>

<h2 id="ch19-s01">SSR 的核心難題：為什麼 Shadow DOM 難以序列化</h2>

<p>傳統 SSR 的核心是將元件樹序列化成 HTML 字串傳給瀏覽器，讓用戶在 JavaScript 載入前就能看到內容。但 Shadow DOM 的問題在於：</p>

<ol>
  <li><strong>Shadow Root 是命令式的</strong>：<code>element.attachShadow()</code> 是一個 JavaScript API，無法用 HTML 標籤表達</li>
  <li><strong>Node.js 沒有 DOM</strong>：伺服器端沒有瀏覽器的 DOM 實作，無法直接執行 <code>customElements.define()</code></li>
  <li><strong>序列化後 Shadow DOM 消失</strong>：即使在瀏覽器中呼叫 <code>element.innerHTML</code>，Shadow DOM 的內容也不會被包含在輸出中</li>
</ol>

<book-code-block language="javascript" label="JavaScript — 問題演示：Shadow DOM 不在 outerHTML 中">
// 在瀏覽器 console 中測試
const div = document.createElement('div')
const shadow = div.attachShadow({ mode: 'open' })
shadow.innerHTML = '&lt;p&gt;Shadow 內容&lt;/p&gt;'
document.body.appendChild(div)

console.log(div.outerHTML)
// 輸出：&lt;div&gt;&lt;/div&gt;
// Shadow DOM 完全消失了！這就是 SSR 的根本難題

// 解決方案：Declarative Shadow DOM
// &lt;div&gt;
//   &lt;template shadowrootmode="open"&gt;
//     &lt;p&gt;Shadow 內容&lt;/p&gt;
//   &lt;/template&gt;
// &lt;/div&gt;
// 瀏覽器解析 HTML 時，會自動把 template 轉換成 Shadow Root
</book-code-block>

<h2 id="ch19-s02">Declarative Shadow DOM（&lt;template shadowrootmode&gt;）深入解析</h2>

<p>Declarative Shadow DOM（DSD）是 Chrome 90+、Safari 16.4+、Firefox 123+ 支援的 HTML 語法，讓 Shadow Root 可以直接在 HTML 中宣告，無需 JavaScript。</p>

<book-code-block language="html" label="HTML — Declarative Shadow DOM 完整範例">
&lt;!-- 基本用法：shadowrootmode 可為 "open" 或 "closed" --&gt;
&lt;user-card&gt;
  &lt;template shadowrootmode="open"&gt;
    &lt;!-- 樣式也在 Shadow Root 內，不影響外部 --&gt;
    &lt;style&gt;
      :host {
        display: block;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1rem;
        font-family: system-ui;
      }
      .avatar { width: 64px; height: 64px; border-radius: 50%; }
      .name { font-size: 1.25rem; font-weight: bold; margin: 0.5rem 0 0; }
      .bio { color: #718096; margin: 0; }
    &lt;/style&gt;

    &lt;!-- 實際 DOM 結構，伺服器渲染的內容 --&gt;
    &lt;img class="avatar" src="/avatars/alice.jpg" alt="Alice" /&gt;
    &lt;h2 class="name"&gt;Alice Chen&lt;/h2&gt;
    &lt;p class="bio"&gt;Senior Frontend Engineer&lt;/p&gt;

    &lt;!-- Slot 讓 light DOM 內容投影進來 --&gt;
    &lt;slot&gt;&lt;/slot&gt;
  &lt;/template&gt;

  &lt;!-- Light DOM 內容 --&gt;
  &lt;button&gt;追蹤&lt;/button&gt;
&lt;/user-card&gt;

&lt;!-- shadowrootdelegatesfocus：讓 Shadow DOM 可接受 focus 委派 --&gt;
&lt;custom-input&gt;
  &lt;template shadowrootmode="open" shadowrootdelegatesfocus&gt;
    &lt;input type="text" placeholder="請輸入..." /&gt;
  &lt;/template&gt;
&lt;/custom-input&gt;
</book-code-block>

<book-code-block language="typescript" label="TypeScript — DSD Hydration：JavaScript 接管 DSD 渲染的元件">
// user-card.ts
// 當 JS 載入時，LitElement 會自動辨識並 hydrate DSD 渲染的 Shadow Root

import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('user-card')
export class UserCard extends LitElement {
  // DSD 已渲染的 Shadow Root 會被 LitElement 直接接管
  // 不需要特殊處理，LitElement 自動偵測

  @property() name = ''
  @property() bio = ''
  @property({ attribute: 'avatar-url' }) avatarUrl = ''

  static styles = css\`
    :host { display: block; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; }
    .avatar { width: 64px; height: 64px; border-radius: 50%; }
  \`

  render() {
    return html\`
      &lt;img class="avatar" src="\${this.avatarUrl}" alt="\${this.name}" /&gt;
      &lt;h2&gt;\${this.name}&lt;/h2&gt;
      &lt;p&gt;\${this.bio}&lt;/p&gt;
      &lt;slot&gt;&lt;/slot&gt;
    \`
  }
}

// DSD polyfill：為不支援的瀏覽器補充
// 只需要在 HTML 中加入：
// &lt;script&gt;
//   if (!HTMLTemplateElement.prototype.hasOwnProperty('shadowRootMode')) {
//     document.querySelectorAll('template[shadowrootmode]').forEach(tpl =&gt; {
//       tpl.parentElement.attachShadow({ mode: tpl.getAttribute('shadowrootmode') })
//         .appendChild(tpl.content)
//       tpl.remove()
//     })
//   }
// &lt;/script&gt;
</book-code-block>

<h2 id="ch19-s03">在 Node.js 使用 Lit SSR（@lit-labs/ssr）的完整流程</h2>

<p>Lit 提供了官方的 SSR 套件，可在 Node.js 環境中將 LitElement 渲染為包含 DSD 的 HTML 字串。</p>

<book-code-block language="typescript" label="TypeScript — Lit SSR 完整 Node.js 設定">
// npm install @lit-labs/ssr lit

// ===== 1. 元件定義（共用於伺服器和客戶端）=====
// components/product-card.ts
import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('product-card')
export class ProductCard extends LitElement {
  @property() name = ''
  @property({ type: Number }) price = 0
  @property({ attribute: 'image-url' }) imageUrl = ''

  static styles = css\`
    :host { display: block; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    img { width: 100%; height: 200px; object-fit: cover; }
    .body { padding: 1rem; }
    h3 { margin: 0 0 0.5rem; font-size: 1.1rem; }
    .price { color: #e53e3e; font-weight: bold; font-size: 1.25rem; }
  \`

  render() {
    return html\`
      &lt;img src="\${this.imageUrl}" alt="\${this.name}" /&gt;
      &lt;div class="body"&gt;
        &lt;h3&gt;\${this.name}&lt;/h3&gt;
        &lt;span class="price"&gt;NT\$ \${this.price.toLocaleString()}&lt;/span&gt;
        &lt;slot&gt;&lt;/slot&gt;
      &lt;/div&gt;
    \`
  }
}

// ===== 2. SSR 渲染器（伺服器端）=====
// server/ssr-renderer.ts
import { render } from '@lit-labs/ssr'
import { html } from 'lit'
import { collectResult } from '@lit-labs/ssr/lib/render-result.js'

// 必須在伺服器上引入元件定義
import '../components/product-card.js'

export interface Product {
  id: string
  name: string
  price: number
  imageUrl: string
}

export async function renderProductPage(products: Product[]): Promise&lt;string&gt; {
  const template = html\`
    &lt;!DOCTYPE html&gt;
    &lt;html lang="zh-TW"&gt;
    &lt;head&gt;
      &lt;meta charset="UTF-8" /&gt;
      &lt;title&gt;商品列表&lt;/title&gt;
      &lt;!-- DSD polyfill（為舊版瀏覽器）--&gt;
      &lt;script&gt;
        if (!HTMLTemplateElement.prototype.hasOwnProperty('shadowRootMode')) {
          document.querySelectorAll('template[shadowrootmode]').forEach(t =&gt; {
            t.parentElement.attachShadow({mode: t.getAttribute('shadowrootmode')})
             .appendChild(t.content); t.remove();
          })
        }
      &lt;/script&gt;
      &lt;!-- 客戶端 JS（Hydration 用）--&gt;
      &lt;script type="module" src="/client.js"&gt;&lt;/script&gt;
    &lt;/head&gt;
    &lt;body&gt;
      &lt;h1&gt;商品列表&lt;/h1&gt;
      &lt;div class="product-grid"&gt;
        \${products.map(p =&gt; html\`
          &lt;product-card
            name="\${p.name}"
            price="\${p.price}"
            image-url="\${p.imageUrl}"
          &gt;
            &lt;button&gt;加入購物車&lt;/button&gt;
          &lt;/product-card&gt;
        \`)}
      &lt;/div&gt;
    &lt;/body&gt;
    &lt;/html&gt;
  \`

  // render() 回傳 AsyncIterable，使用 collectResult 收集完整字串
  const result = render(template)
  return await collectResult(result)
}

// ===== 3. Express 伺服器整合 =====
// server/index.ts
import express from 'express'
import { renderProductPage } from './ssr-renderer.js'

const app = express()

app.get('/products', async (req, res) =&gt; {
  // 從資料庫取得資料
  const products = await fetchProducts()

  // SSR 渲染，輸出包含 DSD 的 HTML
  const html = await renderProductPage(products)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(html)
})

// 也可以使用串流（更快的 TTFB）
app.get('/products-stream', async (req, res) =&gt; {
  const products = await fetchProducts()
  const template = html\`...\` // 同上
  const stream = render(template)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  for await (const chunk of stream) {
    res.write(chunk)
  }
  res.end()
})

async function fetchProducts(): Promise&lt;Product[]&gt; {
  return [] // 實際從資料庫查詢
}

app.listen(3000, () =&gt; console.log('SSR Server running on :3000'))
</book-code-block>

<h2 id="ch19-s04">Hydration 策略：Full、Partial 與 Resumable 的比較</h2>

<p>Hydration 是讓伺服器渲染的靜態 HTML「活化」的過程，不同策略在效能和複雜度上有顯著差異：</p>

<table>
  <thead>
    <tr>
      <th>策略</th>
      <th>說明</th>
      <th>Time to Interactive</th>
      <th>適用場景</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Full Hydration</strong></td>
      <td>頁面載入後，整個 JS bundle 執行並 hydrate 所有元件</td>
      <td>慢（需等待全部 JS）</td>
      <td>小型應用、內容不複雜時</td>
    </tr>
    <tr>
      <td><strong>Partial Hydration</strong></td>
      <td>只 hydrate 互動性元件（Astro Islands 模式）</td>
      <td>快（靜態部分不需 JS）</td>
      <td>內容為主的網站（Blog、文件）</td>
    </tr>
    <tr>
      <td><strong>Lazy Hydration</strong></td>
      <td>元件進入視窗才 hydrate（Intersection Observer）</td>
      <td>很快（按需載入）</td>
      <td>長頁面、電商列表頁</td>
    </tr>
    <tr>
      <td><strong>Resumable</strong></td>
      <td>序列化執行狀態，客戶端直接恢復（Qwik 模式）</td>
      <td>極快（幾乎零 JS 啟動成本）</td>
      <td>效能極度敏感的應用</td>
    </tr>
  </tbody>
</table>

<book-code-block language="typescript" label="TypeScript — Lazy Hydration：元件進入視窗才載入 JS">
// lazy-hydration.ts
// 實作 "hydrate on visible" 策略

function lazyHydrateOnVisible(selector: string, loader: () =&gt; Promise&lt;void&gt;) {
  const observer = new IntersectionObserver(async (entries) =&gt; {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue

      // 停止觀察，避免重複載入
      observer.unobserve(entry.target)

      // 動態載入元件定義
      await loader()

      // 元件定義後，Custom Elements registry 會自動升級 DOM 中的元素
      // 無需額外操作
      console.log(\`[LazyHydrate] Hydrated \${entry.target.tagName}\`)
    }
  }, {
    rootMargin: '200px 0px', // 提前 200px 開始載入
    threshold: 0,
  })

  // 觀察所有匹配的元素
  document.querySelectorAll(selector).forEach(el =&gt; observer.observe(el))
}

// 使用：只有當 heavy-chart 進入視窗時才載入 JS
lazyHydrateOnVisible('heavy-chart', () =&gt; import('./components/heavy-chart'))
lazyHydrateOnVisible('video-player', () =&gt; import('./components/video-player'))
lazyHydrateOnVisible('map-widget', () =&gt; import('./components/map-widget'))
</book-code-block>

<h2 id="ch19-s05">DSD 搭配 Astro、Next.js 與 Express 的實作方式</h2>

<p>不同框架對 DSD 的支援程度不同。Astro 的 Island Architecture 天然適合搭配 Web Components，Next.js 則需要特殊處理。</p>

<book-code-block language="typescript" label="TypeScript — Astro 整合 Web Components（最自然的方式）">
---
// src/pages/product/[id].astro
// Astro 在伺服器上靜態渲染，只有標記 client:* 的元件才 hydrate

// 伺服器端取得資料（不含 JS overhead）
const { id } = Astro.params
const product = await fetchProduct(id)
---

&lt;!-- Astro 自動處理 DSD，無需手動操作 --&gt;
&lt;html lang="zh-TW"&gt;
  &lt;head&gt;
    &lt;title&gt;{product.name}&lt;/title&gt;
  &lt;/head&gt;
  &lt;body&gt;
    &lt;!-- 純靜態：伺服器渲染，客戶端零 JS --&gt;
    &lt;product-hero name={product.name} image={product.imageUrl} /&gt;

    &lt;!-- client:visible：進入視窗才 hydrate --&gt;
    &lt;review-section product-id={id} client:visible /&gt;

    &lt;!-- client:load：頁面載入立即 hydrate（需要互動） --&gt;
    &lt;add-to-cart-button product-id={id} price={product.price} client:load /&gt;

    &lt;!-- client:idle：瀏覽器空閒時 hydrate --&gt;
    &lt;related-products category={product.category} client:idle /&gt;
  &lt;/body&gt;
&lt;/html&gt;
</book-code-block>

<book-code-block language="typescript" label="TypeScript — Next.js App Router 整合 Web Components">
// app/products/[id]/page.tsx
// Next.js 中，Web Components 必須在 'use client' 元件中使用

// components/ProductClientWrapper.tsx
'use client'
import { useEffect, useRef } from 'react'

// 動態 import 確保只在客戶端執行
import dynamic from 'next/dynamic'

// 建立 React wrapper 讓 Web Component 在 Next.js 中運作
export function AddToCartButton({ productId, price }: { productId: string; price: number }) {
  const ref = useRef&lt;HTMLElement &amp; { productId?: string; price?: number }&gt;(null)

  useEffect(() =&gt; {
    // 動態載入 Web Component 定義
    import('../web-components/add-to-cart-button').then(() =&gt; {
      if (ref.current) {
        ref.current.productId = productId
        ref.current.price = price
      }
    })
  }, [productId, price])

  // 傳遞屬性用 attribute（字串）
  return &lt;add-to-cart-button ref={ref} /&gt; as any
}

// app/products/[id]/page.tsx（伺服器元件）
export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetchProduct(params.id)

  return (
    &lt;main&gt;
      &lt;h1&gt;{product.name}&lt;/h1&gt;
      &lt;!-- 純伺服器渲染的內容 --&gt;
      &lt;p&gt;{product.description}&lt;/p&gt;
      &lt;!-- 客戶端 Web Component --&gt;
      &lt;AddToCartButton productId={product.id} price={product.price} /&gt;
    &lt;/main&gt;
  )
}
</book-code-block>

<h2 id="ch19-interview">面試題：Web Components 如何處理 SSR？什麼是 Declarative Shadow DOM？</h2>

<div class="interview-qa">
  <p><strong>Q：傳統 Shadow DOM 為什麼無法做 SSR？什麼是 Declarative Shadow DOM？如何在實際專案中使用？</strong></p>

  <p><strong>A（分層回答）：</strong></p>

  <p><strong>問題根源：</strong>Shadow DOM 是命令式 API（<code>attachShadow()</code>），需要 JavaScript 執行才能建立 Shadow Root。在伺服器端（Node.js）沒有 DOM，無法執行這個 API；即使在瀏覽器中，序列化 <code>innerHTML</code> 也不包含 Shadow DOM 內容，導致 SSR 輸出的 HTML 沒有任何元件結構。</p>

  <p><strong>解決方案 — Declarative Shadow DOM：</strong>DSD 是 Chrome 90+ 支援的 HTML 語法，允許用 <code>&lt;template shadowrootmode="open"&gt;</code> 標籤直接在 HTML 中宣告 Shadow Root。瀏覽器解析 HTML 時會自動建立對應的 Shadow Root，完全不需要 JavaScript。</p>

  <p><strong>實際應用：</strong>Lit 提供了 <code>@lit-labs/ssr</code> 套件，在 Node.js 端將 LitElement 渲染為包含 DSD 語法的 HTML 字串，發送給瀏覽器後，Lit 客戶端自動辨識並「接管」（hydrate）這些 DSD 渲染的元件，恢復事件監聽和響應式更新。</p>

  <p><strong>框架整合：</strong>Astro 是目前與 Web Components SSR 整合最好的框架，提供 Island Architecture；Next.js 需要 'use client' 邊界來隔離 Web Component 的使用。</p>
</div>

<div class="chapter-summary-note">
  <strong>一句話總結：</strong>Declarative Shadow DOM 用 <code>&lt;template shadowrootmode&gt;</code> 語法解決了 Shadow DOM 無法序列化的根本問題，配合 Lit SSR 可在 Node.js 生成完整 HTML，再由客戶端 hydrate 恢復互動能力。
</div>

<div class="chapter-footer">
  <div class="chapter-footer-links">
    <a class="footer-link" href="#ch18">
      <span class="footer-label">← 上一章</span>
      <span class="footer-title">在 Web Component 應用中實作 Client-Side Routing</span>
    </a>
    <a class="footer-link" href="#ch20">
      <span class="footer-label">下一章 →</span>
      <span class="footer-title">用 Web Components 建構 Micro-Frontend</span>
    </a>
  </div>
</div>
`
